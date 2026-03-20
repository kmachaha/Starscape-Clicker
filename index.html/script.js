// STARSCAPE CLICKER
const $ = id => document.getElementById(id)

// Game state
const state = {
  stars: 0,
  perClickBase: 1,
  upgrades: [],
  autos: [],
  multActive: null,
  worlds: [],
  currentWorld: null,
  gameStarted: false,
}

// Definitions
const upgradesDef = [
  { id: 'upgrade1', name: 'Steel Finger', cost: 25, add: 1, description: 'A reinforced fingertip for stronger clicks.' },
  { id: 'upgrade2', name: 'Power Glove', cost: 200, add: 5, description: 'A glove that amplifies your clicking force.' },
  { id: 'upgrade3', name: 'Exo Click', cost: 1200, add: 25, description: 'Exoskeleton-assisted clicks for massive power.' },
  { id: 'upgrade4', name: 'Quantum Digit', cost: 8000, add: 100, description: 'Harness quantum mechanics for clicks.' },
  { id: 'upgrade5', name: 'Stellar Touch', cost: 50000, add: 400, description: 'Touch infused with stellar energy.' },
  { id: 'upgrade6', name: 'Cosmic Fist', cost: 300000, add: 1500, description: 'A fist forged from cosmic matter.' },
  { id: 'upgrade7', name: 'Singularity Punch', cost: 2000000, add: 6000, description: 'Channel the power of a black hole.' },
]

const autosDef = [
  { id: 'auto1', name: 'Cursor', cost: 50, cps: 1, description: 'A tiny helper that clicks for you.' },
  { id: 'auto2', name: 'Farm', cost: 500, cps: 10, description: 'Produces steady clicks over time.' },
  { id: 'auto3', name: 'Factory', cost: 4000, cps: 80, description: 'Industrial-scale automated clicking.' },
  { id: 'auto4', name: 'Station', cost: 40000, cps: 400, description: 'Orbital platform that harvests stars.' },
  { id: 'auto5', name: 'Mothership', cost: 400000, cps: 2500, description: 'Massive vessel collecting stellar energy.' },
]

const multsDef = [
  { id: 'mult1', name: '2x (30s)', cost: 150, factor:2, duration:30, description: 'Doubles your clicks and CPS for 30 seconds.' },
  { id: 'mult2', name: '5x (20s)', cost: 1000, factor:5, duration:20, description: 'Massive boost: 5x for 20 seconds.' },
  { id: 'mult3', name: '10x (15s)', cost: 8000, factor:10, duration:15, description: 'Extreme multiplier: 10x for 15 seconds.' },
]

const worldsDef = [
  { id: 'earth', name: 'Earth', cost: 0, factor: 1, description: 'Your home base. Standard multipliers.' },
  { id: 'moon', name: 'Moon', cost: 5000, factor: 2, description: 'Lower gravity: click output is doubled.' },
  { id: 'mars', name: 'Mars', cost: 50000, factor: 5, description: 'Red planet yields massive multipliers.' },
  { id: 'jupiter', name: 'Jupiter', cost: 500000, factor: 10, description: 'Gas giant amplifies your power tenfold.' },
]

// Tooltip element and helpers
const tooltip = document.createElement('div')
tooltip.id = 'tooltip'
tooltip.style.display = 'none'
document.body.appendChild(tooltip)
let tooltipTimer = null
function showTooltip(text, rect){
  tooltip.textContent = text
  tooltip.style.display = 'block'
  const left = Math.min(window.innerWidth - 220, Math.max(8, rect.left + rect.width/2 - 110))
  const top = rect.bottom + 8
  tooltip.style.left = left + 'px'
  tooltip.style.top = top + 'px'
}
function hideTooltip(){
  tooltip.style.display = 'none'
  tooltip.textContent = ''
  if(tooltipTimer){ clearTimeout(tooltipTimer); tooltipTimer = null }
}

// Persistence
function save(){ localStorage.setItem('clicker_state', JSON.stringify(state)) }
function load(){
  const raw = localStorage.getItem('clicker_state')
  if(raw) {
    const parsed = JSON.parse(raw)
    Object.assign(state, parsed)
  } else {
    // initialize
    state.upgrades = upgradesDef.map(u => ({...u, bought:0}))
    state.autos = autosDef.map(a => ({...a, count:0}))
    state.worlds = worldsDef.map((w,i)=> ({...w, unlocked: i===0}))
    state.currentWorld = state.worlds[0].id
  }
  // Always reset gameStarted to show title screen on each launch
  state.gameStarted = false
}

// Helpers
function starsDisplay(){ $('coins').textContent = Math.floor(state.stars) }
function perClickDisplay(){ $('perClick').textContent = effectivePerClick() }
function cpsDisplay(){ $('cps').textContent = totalCPS().toFixed(1) }
function currentWorldDisplay(){
  const w = state.worlds.find(x=>x.id===state.currentWorld)
  $('currentWorld').textContent = w ? w.name : 'Unknown'
}

function effectivePerClick(){
  let base = state.perClickBase + (state.upgrades ? state.upgrades.reduce((s,u)=>s+(u.bought||0)* (u.add||0),0) : 0)
  if(state.multActive) base *= state.multActive.factor
  const world = state.worlds.find(w=>w.id===state.currentWorld)
  if(world) base *= world.factor
  return Math.max(0.1, Math.floor(base*100)/100)
}

function totalCPS(){
  const base = state.autos.reduce((s,a)=>s + (a.count||0)*a.cps,0)
  const mult = state.multActive ? state.multActive.factor : 1
  const world = state.worlds.find(w=>w.id===state.currentWorld)
  const wf = world ? world.factor : 1
  return base * mult * wf
}

// Star particles animation
function createStarParticle(startX, startY){
  const particle = document.createElement('div')
  particle.className = 'star-particle'
  particle.textContent = '⭐'
  particle.style.left = startX + 'px'
  particle.style.top = startY + 'px'
  document.body.appendChild(particle)
  
  const destEl = $('coins')
  const destRect = destEl.getBoundingClientRect()
  const destX = destRect.left + destRect.width/2
  const destY = destRect.top + destRect.height/2
  
  let progress = 0
  const duration = 600
  const start = Date.now()
  
  function animate(){
    const elapsed = Date.now() - start
    progress = Math.min(1, elapsed / duration)
    
    const currentX = startX + (destX - startX) * progress
    const currentY = startY + (destY - startY) * progress
    const opacity = 1 - progress
    
    particle.style.left = currentX + 'px'
    particle.style.top = currentY + 'px'
    particle.style.opacity = opacity
    
    if(progress < 1){
      requestAnimationFrame(animate)
    } else {
      particle.remove()
    }
  }
  animate()
}

// Game actions
function doClick(evt){
  const clicks = effectivePerClick()
  state.stars += clicks
  
  // Create star particles
  for(let i = 0; i < Math.ceil(clicks / 10); i++){
    setTimeout(()=> createStarParticle(evt.clientX || 130, evt.clientY || 300), i * 50)
  }
  
  starsDisplay(); save(); updateShopButtons()
}

function buyUpgrade(id){
  const up = state.upgrades.find(u=>u.id===id)
  if(!up) return
  if(state.stars >= up.cost){ state.stars -= up.cost; up.bought = (up.bought||0) + 1; up.cost = Math.floor(up.cost*2.5); starsDisplay(); perClickDisplay(); save(); renderUpgrades(); updateShopButtons() }
}

function buyAuto(id){
  const a = state.autos.find(x=>x.id===id)
  if(!a) return
  if(state.stars >= a.cost){ state.stars -= a.cost; a.count = (a.count||0)+1; a.cost = Math.floor(a.cost*1.6); starsDisplay(); cpsDisplay(); save(); renderAutos(); updateShopButtons() }
}

function buyMult(id){
  const m = multsDef.find(x=>x.id===id)
  if(!m) return
  if(state.stars >= m.cost){ state.stars -= m.cost; state.multActive = { ...m, expires: Date.now() + m.duration*1000 }; starsDisplay(); save(); updateShopButtons() }
}

function buyWorld(id){
  const w = state.worlds.find(x=>x.id===id)
  if(!w) return
  if(w.unlocked) { state.currentWorld = w.id; currentWorldDisplay(); save(); updateShopButtons(); return }
  if(state.stars >= w.cost){ state.stars -= w.cost; w.unlocked = true; state.currentWorld = w.id; starsDisplay(); currentWorldDisplay(); save(); renderWorlds(); updateShopButtons() }
}

function resetGame(){
  if(confirm('Are you sure? This will reset your entire game!')){
    localStorage.removeItem('clicker_state')
    state.stars = 0
    state.perClickBase = 1
    state.upgrades = upgradesDef.map(u => ({...u, bought:0}))
    state.autos = autosDef.map(a => ({...a, count:0}))
    state.worlds = worldsDef.map((w,i)=> ({...w, unlocked: i===0}))
    state.currentWorld = state.worlds[0].id
    state.multActive = null
    renderAll()
  }
}

// UI rendering
function renderUpgrades(){
  const el = $('upgradesList'); el.innerHTML = ''
  state.upgrades.forEach(u=>{
    const div = document.createElement('div'); div.className='item'
    div.innerHTML = `<div><strong>${u.name}</strong><div class="muted">Owned: ${u.bought||0}</div><div class="muted desc">${u.description||''}</div></div><div><div>${u.cost}</div><button data-id="${u.id}">Buy</button></div>`
    const btn = div.querySelector('button')
    el.appendChild(div)
  })
}

function renderAutos(){
  const el = $('autosList'); el.innerHTML = ''
  state.autos.forEach(a=>{
    const div = document.createElement('div'); div.className='item'
    div.innerHTML = `<div><strong>${a.name}</strong><div class="muted">Count: ${a.count||0} • ${a.cps} cps each</div><div class="muted desc">${a.description||''}</div></div><div><div>${a.cost}</div><button data-id="${a.id}">Buy</button></div>`
    el.appendChild(div)
  })
}

function renderMults(){
  const el = $('multsList'); el.innerHTML = ''
  multsDef.forEach(m=>{
    const div = document.createElement('div'); div.className='item'
    div.innerHTML = `<div><strong>${m.name}</strong><div class="muted">x${m.factor} for ${m.duration}s</div><div class="muted desc">${m.description||''}</div></div><div><div>${m.cost}</div><button data-id="${m.id}">Buy</button></div>`
    el.appendChild(div)
  })
}

function renderWorlds(){
  const el = $('worldsList'); el.innerHTML = ''
  state.worlds.forEach(w=>{
    const div = document.createElement('div'); div.className='item'
    const label = w.unlocked ? `${w.name} (unlocked)` : `${w.name}`
    const btnLabel = w.unlocked && state.currentWorld===w.id ? 'Active' : 'Select'
    const disabled = w.unlocked && state.currentWorld===w.id
    div.innerHTML = `<div><strong>${label}</strong><div class="muted">x${w.factor} overall</div><div class="muted desc">${w.description||''}</div></div><div><div>${w.cost}</div><button data-id="${w.id}" ${disabled? 'disabled':''}>${btnLabel}</button></div>`
    el.appendChild(div)
  })
}

function updateShopButtons(){
  document.querySelectorAll('#upgradesList button').forEach(b=>{
    const id=b.dataset.id; const u=state.upgrades.find(x=>x.id===id)
    b.disabled = state.stars < u.cost
  })
  document.querySelectorAll('#autosList button').forEach(b=>{
    const id=b.dataset.id; const a=state.autos.find(x=>x.id===id)
    b.disabled = state.stars < a.cost
  })
  document.querySelectorAll('#multsList button').forEach(b=>{
    const id=b.dataset.id; const m=multsDef.find(x=>x.id===id)
    b.disabled = state.stars < m.cost || (state.multActive && state.multActive.expires > Date.now())
  })
  document.querySelectorAll('#worldsList button').forEach(b=>{
    const id=b.dataset.id; const w=state.worlds.find(x=>x.id===id)
    b.disabled = state.stars < w.cost && !w.unlocked
  })
}

// Event wiring
function wire(){
  // Title screen
  $('startBtn').addEventListener('click', startGame)
  
  // Game
  $('clicker').addEventListener('click', doClick)
  $('resetBtn').addEventListener('click', resetGame)

  document.body.addEventListener('click', e=>{
    const id = e.target.dataset && e.target.dataset.id
    if(!id) return
    if(e.target.closest('#upgrades')) buyUpgrade(id)
    if(e.target.closest('#autoclickers')) buyAuto(id)
    if(e.target.closest('#multipliers')) buyMult(id)
    if(e.target.closest('#worlds')) buyWorld(id)
    renderAll()
  })
}

function renderAll(){ starsDisplay(); perClickDisplay(); cpsDisplay(); currentWorldDisplay(); renderUpgrades(); renderAutos(); renderMults(); renderWorlds(); updateShopButtons() }

// Title screen
function startGame(){
  state.gameStarted = true
  $('titleScreen').classList.add('hidden')
  $('gameScreen').classList.remove('hidden')
  renderAll()
  initBgStars()
}

// Canvas for title screen stars
function initTitleStars(){
  const canvas = $('titleStars')
  if(!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')
  
  const stars = []
  for(let i = 0; i < 150; i++){
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      opacity: Math.random() * 0.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    })
  }
  
  function animate(){
    ctx.fillStyle = '#051020'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#fff'
    stars.forEach(s => {
      s.x += s.vx
      s.y += s.vy
      if(s.x < 0) s.x = canvas.width
      if(s.x > canvas.width) s.x = 0
      if(s.y < 0) s.y = canvas.height
      if(s.y > canvas.height) s.y = 0
      
      ctx.globalAlpha = s.opacity
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
    
    requestAnimationFrame(animate)
  }
  animate()
}

// Canvas for game background (parallax)
function initBgStars(){
  const canvas = $('bgStars')
  if(!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')
  
  const layers = [
    { stars: [], depth: 1, speed: 0.5 },
    { stars: [], depth: 0.5, speed: 0.3 },
    { stars: [], depth: 0.2, speed: 0.1 }
  ]
  
  layers.forEach(layer => {
    for(let i = 0; i < 100; i++){
      layer.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * layer.depth,
        opacity: layer.depth
      })
    }
  })
  
  let scrollOffset = 0
  
  function animate(){
    ctx.fillStyle = 'transparent'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    layers.forEach(layer => {
      ctx.fillStyle = '#fff'
      layer.stars.forEach(s => {
        const offset = (scrollOffset * layer.speed) % canvas.width
        ctx.globalAlpha = s.opacity
        ctx.beginPath()
        ctx.arc(s.x - offset, s.y, s.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    })
    ctx.globalAlpha = 1
    
    scrollOffset += 0.02
    requestAnimationFrame(animate)
  }
  animate()
}
setInterval(()=>{
  if(!state.gameStarted) return
  const add = totalCPS()
  state.stars += add
  if(state.multActive && Date.now() > state.multActive.expires) state.multActive = null
  renderAll(); save()
}, 1000)

// Init
load()
initTitleStars()
wire()
if(state.gameStarted) startGame()
