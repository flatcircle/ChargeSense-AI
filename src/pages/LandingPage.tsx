import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ShieldAlert, Cpu, Sparkles, Database, BarChart3, ChevronRight, Play, RotateCcw, AlertOctagon, SunDim } from 'lucide-react'

// Define 3D Node interface
interface Node3D {
  x: number
  y: number
  z: number
  baseX: number
  baseY: number
  baseZ: number
  label: string
  type: 'substation' | 'charging' | 'solar'
  status: 'optimal' | 'warning' | 'critical'
}

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Custom Controls for 3D simulation
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.2)
  const [gridLoad, setGridLoad] = useState<number>(45) // peak load in %
  const [stationDensity, setStationDensity] = useState<number>(30) // number of stations
  const [activeTab, setActiveTab] = useState<'network' | 'flows' | 'metrics'>('network')
  const [alertMode, setAlertMode] = useState<boolean>(false)
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null)

  // Interactive Stats Counter
  const [counters, setCounters] = useState({ stations: 0, capacity: 0, proposals: 0, savings: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => ({
        stations: Math.min(142, prev.stations + 4),
        capacity: Math.min(8420, prev.capacity + 250),
        proposals: Math.min(28, prev.proposals + 1),
        savings: Math.min(1620, prev.savings + 55),
      }))
    }, 30)
    return () => clearInterval(interval)
  }, [])

  // 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = canvas.width = canvas.offsetWidth
    let height = canvas.height = canvas.offsetHeight
    
    // Listen to resize
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate 3D nodes
    const nodes: Node3D[] = []
    const nodeCount = stationDensity
    const types: ('substation' | 'charging' | 'solar')[] = ['substation', 'charging', 'solar']
    const statuses: ('optimal' | 'warning' | 'critical')[] = ['optimal', 'warning', 'critical']

    // Indore grid names
    const names = [
      'Vijay Nagar Smart Hub', 'Palasia EV Station', 'Super Corridor Giga Hub',
      'Rajwada MPPKVVCL Node', 'Chappan Dukan Power Link', 'Bhawarkua BRTS Charger',
      'Rau Bypass Substation', 'Sanwer Road Industrial Grid', 'Khajrana Fast Charger',
      'Scheme 54 Solar Array', 'Scheme 140 Power Feed', 'Silicon City Smart Link',
      'Pologround Substation-2', 'Bengali Square EV Loop', 'Airport Road Node',
      'Mahalakshmi Nagar Hub', 'Treasure Island Charger', 'Brilliant Convention Centre Grid',
      'Annapurna Solar Feed', 'Sapna Sangeeta Node'
    ]

    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const radius = 180 + Math.random() * 30 // size of sphere

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      nodes.push({
        x, y, z,
        baseX: x,
        baseY: y,
        baseZ: z,
        label: names[i % names.length] || `MPPKVVCL Node-${i}`,
        type: types[i % 3],
        status: alertMode && i % 4 === 0 ? 'critical' : statuses[i % 3 === 0 ? 1 : 0]
      })
    }

    // Camera angles
    let rx = 0.5
    let ry = 0.5
    let targetRx = 0.5
    let targetRy = 0.5
    
    // Mouse Interaction
    let isDragging = false
    let startX = 0
    let startY = 0

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        // Hover detection
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        let foundNode: Node3D | null = null
        let minDist = 15

        nodes.forEach(node => {
          const cosX = Math.cos(rx), sinX = Math.sin(rx)
          const cosY = Math.cos(ry), sinY = Math.sin(ry)

          // Rotate Y
          const x1 = node.x * cosY - node.z * sinY
          const z1 = node.z * cosY + node.x * sinY
          // Rotate X
          const y2 = node.y * cosX - z1 * sinX
          const z2 = z1 * cosX + node.y * sinX

          const fov = 400
          const scale = fov / (fov + z2)
          const projX = width / 2 + x1 * scale
          const projY = height / 2 + y2 * scale

          const dist = Math.hypot(projX - mouseX, projY - mouseY)
          if (dist < minDist) {
            minDist = dist
            foundNode = node
          }
        })
        setSelectedNode(foundNode)
        return
      }
      
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      targetRy += dx * 0.005
      targetRx += dy * 0.005
      startX = e.clientX
      startY = e.clientY
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Auto rotation
      if (!isDragging) {
        targetRy += 0.002 * rotationSpeed
      }

      // Smooth camera interpolation
      rx += (targetRx - rx) * 0.1
      ry += (targetRy - ry) * 0.1

      const cosX = Math.cos(rx), sinX = Math.sin(rx)
      const cosY = Math.cos(ry), sinY = Math.sin(ry)

      // Project all nodes
      const projected = nodes.map(node => {
        // Rotate around Y
        const x1 = node.x * cosY - node.z * sinY
        const z1 = node.z * cosY + node.x * sinY

        // Rotate around X
        const y2 = node.y * cosX - z1 * sinX
        const z2 = z1 * cosX + node.y * sinX

        // Perspective projection
        const fov = 450
        const scale = fov / (fov + z2)
        const projX = width / 2 + x1 * scale
        const projY = height / 2 + y2 * scale

        return {
          ...node,
          projX,
          projY,
          depth: z2,
          scale
        }
      })

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => b.depth - a.depth)

      // Draw grid connections/links
      ctx.lineWidth = 0.5
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const n1 = projected[i]
          const n2 = projected[j]
          
          // Connect nodes that are close to each other in 3D base space
          const dx = n1.baseX - n2.baseX
          const dy = n1.baseY - n2.baseY
          const dz = n1.baseZ - n2.baseZ
          const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz)

          if (dist3D < 160) {
            const alpha = Math.max(0, (160 - dist3D) / 160) * 0.35
            
            // Grid load color shifts
            if (alertMode && (i % 3 === 0 || j % 3 === 0)) {
              ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})` // Red grid pulse
              ctx.lineWidth = 1.2
            } else if (gridLoad > 75) {
              ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.6})` // Orange high load
            } else {
              ctx.strokeStyle = `rgba(16, 185, 129, ${alpha * 0.4})` // Green optimal
            }

            ctx.beginPath()
            ctx.moveTo(n1.projX, n1.projY)
            ctx.lineTo(n2.projX, n2.projY)
            ctx.stroke()

            // Draw micro particles moving along connections
            if (activeTab === 'flows' || alertMode) {
              const time = Date.now() * 0.001
              const flowSpeed = alertMode ? 3.0 : (gridLoad / 30)
              const particleRatio = ((time * flowSpeed) % 1)
              const px = n1.projX + (n2.projX - n1.projX) * particleRatio
              const py = n1.projY + (n2.projY - n1.projY) * particleRatio

              ctx.fillStyle = alertMode ? '#ef4444' : '#10b981'
              ctx.beginPath()
              ctx.arc(px, py, 2 * n1.scale, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }

      // Draw nodes
      projected.forEach(node => {
        const size = (node.type === 'substation' ? 7 : 5) * node.scale
        if (size <= 0) return

        // Glow effect
        ctx.shadowBlur = node.status === 'critical' ? 12 : 6
        ctx.shadowColor = node.status === 'critical' 
          ? '#ef4444' 
          : node.type === 'solar' 
            ? '#38bdf8' 
            : '#10b981'

        // Determine node base color
        if (node.status === 'critical') {
          ctx.fillStyle = '#ef4444'
        } else if (node.type === 'solar') {
          ctx.fillStyle = '#38bdf8'
        } else if (node.type === 'substation') {
          ctx.fillStyle = '#10b981'
        } else {
          ctx.fillStyle = '#8b5cf6'
        }

        ctx.beginPath()
        ctx.arc(node.projX, node.projY, size, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.shadowBlur = 0 // Reset glow

        // Draw ring around node
        ctx.strokeStyle = ctx.fillStyle
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(node.projX, node.projY, size * 1.6, 0, Math.PI * 2)
        ctx.stroke()

        // Label if selected/hovered
        const isHovered = selectedNode && selectedNode.label === node.label
        if (isHovered) {
          ctx.fillStyle = '#ffffff'
          ctx.font = '10px sans-serif'
          ctx.fillText(node.label, node.projX + size * 2.2, node.projY + 3)
          
          // Draw connecting dot line to tooltip
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'
          ctx.beginPath()
          ctx.moveTo(node.projX, node.projY)
          ctx.lineTo(node.projX + size * 1.8, node.projY)
          ctx.stroke()
        }
      })

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [rotationSpeed, gridLoad, stationDensity, activeTab, alertMode, selectedNode])

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col relative overflow-hidden font-sans w-full">
      {/* Decorative Gradients */}
      <div className="absolute top-[-25%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-30 px-4 sm:px-8 py-4 sm:py-6 border-b border-dark-600/30 backdrop-blur-md bg-dark-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand/20 p-2.5 rounded-xl text-brand border border-brand/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-brand">
              ChargeSense AI
            </h1>
            <p className="text-[10px] text-brand font-semibold tracking-widest uppercase">Smart MPPKVVCL Grid Coordinator</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 text-sm text-slate-400 font-medium">
            <button onClick={() => setActiveTab('network')} className={`transition-colors hover:text-white ${activeTab === 'network' ? 'text-brand border-b-2 border-brand pb-1' : ''}`}>3D Grid Topology</button>
            <button onClick={() => setActiveTab('flows')} className={`transition-colors hover:text-white ${activeTab === 'flows' ? 'text-brand border-b-2 border-brand pb-1' : ''}`}>Energy Flows</button>
            <button onClick={() => setAlertMode(!alertMode)} className={`transition-colors flex items-center gap-1.5 hover:text-red-400 ${alertMode ? 'text-red-400 font-bold' : ''}`}>
              <ShieldAlert size={14} />
              Simulate Load-Shedding Alert
            </button>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white font-semibold rounded-xl text-sm hover:bg-brand-light transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105"
          >
            Enter Platform
            <ChevronRight size={15} />
          </Link>
        </div>
      </header>

      {/* Main Hero & Simulation Section */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 relative z-20">
        
        {/* Left Hand: Hero Title & Controls */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-8 pr-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold shadow-inner">
              <Sparkles size={14} className="animate-spin text-brand" />
              <span>Indore Smart EV Grid Platform</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Intelligent Grid Placement &
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-blue-400">
                EV Synergy Optimization
              </span>
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              MPPKVVCL's next-gen grid coordinator powered by GNN node evaluation, PINN capacity forecasting, real-time reinforcement slot scheduling, and robust quota-failover Gemini flash reasoning.
            </p>
          </div>

          {/* Quick Real-Time Counters */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="glass-panel p-4 border border-dark-600/40 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reinforced Nodes</div>
              <div className="text-2xl font-black text-white mt-1">{counters.stations}+</div>
              <div className="text-[10px] text-brand font-medium mt-1">Real-time scheduling</div>
            </div>
            <div className="glass-panel p-4 border border-dark-600/40 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Grid Headroom</div>
              <div className="text-2xl font-black text-white mt-1">{(counters.capacity/1000).toFixed(1)} MW</div>
              <div className="text-[10px] text-blue-400 font-medium mt-1">Real-time headroom monitoring</div>
            </div>
            <div className="glass-panel p-4 border border-dark-600/40 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Proposals Staged</div>
              <div className="text-2xl font-black text-white mt-1">{counters.proposals}</div>
              <div className="text-[10px] text-purple-400 font-medium mt-1">Approved & evaluated</div>
            </div>
            <div className="glass-panel p-4 border border-dark-600/40 rounded-xl relative overflow-hidden">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CO2 Mitigation</div>
              <div className="text-2xl font-black text-white mt-1">{counters.savings} Tons</div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1">V2G / Solar offset</div>
            </div>
          </div>

          {/* Canvas Simulation Control Panel */}
          <div className="glass-panel p-5 border border-dark-600/50 rounded-2xl space-y-4 max-w-md bg-dark-900/60 backdrop-blur-lg">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Cpu size={14} className="text-brand" />
              Interactive 3D Grid Parameters
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                  <span>3D Orbit Rotate Speed</span>
                  <span className="text-brand font-medium">{rotationSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={e => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                  <span>Active Grid Load (Simulation)</span>
                  <span className={`${gridLoad > 75 ? 'text-orange-400 font-bold' : 'text-brand font-medium'}`}>{gridLoad}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={gridLoad}
                  onChange={e => setGridLoad(parseInt(e.target.value))}
                  className="w-full h-1 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 text-slate-400">
                  <span>Station Placement Density</span>
                  <span className="text-purple-400 font-medium">{stationDensity} Nodes</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={stationDensity}
                  onChange={e => setStationDensity(parseInt(e.target.value))}
                  className="w-full h-1 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRotationSpeed(1.2)
                  setGridLoad(45)
                  setStationDensity(30)
                  setAlertMode(false)
                }}
                className="flex-1 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-dark-600 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={12} />
                Reset Grid
              </button>
              <button
                onClick={() => setAlertMode(!alertMode)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
                  alertMode
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-dark-800 hover:bg-dark-700 text-slate-300 border-dark-600'
                }`}
              >
                <AlertOctagon size={12} />
                {alertMode ? 'Resolve Grid Alert' : 'Trigger Grid Alert'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Hand: 3D Topology Visualization Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-center relative min-h-[450px] lg:min-h-0">
          
          {/* Glass Card Tooltip over Canvas */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-4 left-4 z-30 p-4 w-72 glass-panel border border-dark-600/60 rounded-2xl shadow-2xl bg-dark-900/80 backdrop-blur-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                      selectedNode.type === 'substation' 
                        ? 'bg-brand/20 text-brand' 
                        : selectedNode.type === 'solar' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {selectedNode.type}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1.5">{selectedNode.label}</h4>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedNode.status === 'critical' 
                      ? 'bg-red-500 animate-ping' 
                      : selectedNode.status === 'warning' 
                        ? 'bg-orange-500' 
                        : 'bg-brand'
                  }`} />
                </div>
                <div className="mt-3 pt-3 border-t border-dark-600/30 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <div className="text-slate-500">Live Grid Voltage</div>
                    <div className="font-bold text-white mt-0.5">11.4 kV</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Available Headroom</div>
                    <div className="font-bold text-brand mt-0.5">3.24 MW</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Node Load Factor</div>
                    <div className="font-bold text-white mt-0.5">{(gridLoad + (selectedNode.label.length % 5) * 4)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Solar Synergy Co-eff</div>
                    <div className="font-bold text-blue-400 mt-0.5">0.82</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Guide Indicator */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-4 text-[10px] text-slate-500 font-bold bg-dark-900/60 p-2.5 rounded-xl border border-dark-600/20 backdrop-blur-md select-none pointer-events-none">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand" /> Substation</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Solar Link</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Charging Hub</span>
            <span className="flex items-center gap-1 text-slate-400 border-l border-dark-600/30 pl-4">Drag to Orbit</span>
          </div>

          {/* Main 3D Canvas */}
          <div className="w-full h-full relative border border-dark-600/30 rounded-3xl bg-dark-900/20 backdrop-blur-xs overflow-hidden shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-[350px] sm:h-[500px] cursor-grab active:cursor-grabbing"
            />
          </div>
        </div>

      </div>

      {/* Feature Highlights Grid */}
      <section className="relative z-20 border-t border-dark-600/30 bg-dark-900/30 backdrop-blur-md p-8 md:p-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-2 mb-10">
            <h3 className="font-bold text-2xl text-white">Full-Suite Grid-EV Intelligence Features</h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">Explore the five dedicated sub-systems built for MPPKVVCL's infrastructure optimization and grid stability.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="glass-panel p-5 border border-dark-600/40 rounded-2xl hover:border-brand/30 transition-all group">
              <div className="bg-brand/10 p-2.5 rounded-xl text-brand w-fit group-hover:scale-110 transition-transform">
                <Sparkles size={16} />
              </div>
              <h4 className="font-bold text-xs text-white mt-4 group-hover:text-brand transition-colors">AI Planning Assistant</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Global streaming chat powered by Gemini utilizing the entire grid, zone, and proposal database.</p>
            </div>

            <div className="glass-panel p-5 border border-dark-600/40 rounded-2xl hover:border-purple-500/30 transition-all group">
              <div className="bg-purple-500/10 p-2.5 rounded-xl text-purple-400 w-fit group-hover:scale-110 transition-transform">
                <Database size={16} />
              </div>
              <h4 className="font-bold text-xs text-white mt-4 group-hover:text-purple-400 transition-colors">Proposal Rationale</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Dynamic payback and site compatibility scoring evaluation to assess station installation proposals.</p>
            </div>

            <div className="glass-panel p-5 border border-dark-600/40 rounded-2xl hover:border-red-500/30 transition-all group">
              <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400 w-fit group-hover:scale-110 transition-transform">
                <ShieldAlert size={16} />
              </div>
              <h4 className="font-bold text-xs text-white mt-4 group-hover:text-red-400 transition-colors">Alert Explainer</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Detailed grid spike diagnostics, hazard evaluations, and utility/citizen action plan generation.</p>
            </div>

            <div className="glass-panel p-5 border border-dark-600/40 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-400 w-fit group-hover:scale-110 transition-transform">
                <SunDim size={16} />
              </div>
              <h4 className="font-bold text-xs text-white mt-4 group-hover:text-sky-400 transition-colors">Community Score Advisor</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Evaluates area ratings and suggests actionable items like solar synergy buffers and micro-grids.</p>
            </div>

            <div className="glass-panel p-5 border border-dark-600/40 rounded-2xl hover:border-amber-500/30 transition-all group">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 w-fit group-hover:scale-110 transition-transform">
                <BarChart3 size={16} />
              </div>
              <h4 className="font-bold text-xs text-white mt-4 group-hover:text-amber-400 transition-colors">Policy Brief Builder</h4>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">Automatic generation of detailed, formatted MPPKVVCL policy documents ready for export.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-dark-600/20 backdrop-blur-md bg-dark-950 text-slate-500 text-xs flex flex-col md:flex-row items-center justify-between mt-auto">
        <p>© 2026 ChargeSense-AI. Smart EV Grid Intelligence Platform for Indore.</p>
        <p className="mt-2 md:mt-0 flex items-center gap-2">
          <span>Failover Active: 3 API Slots Staged</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
        </p>
      </footer>
    </div>
  )
}
