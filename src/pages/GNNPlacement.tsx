import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Network, TrendingUp, Shield, Cpu, Info, GitMerge, Layers } from 'lucide-react'

// Simulated graph neural network that computes scores dynamically based on the layer depth
function simulateGNN(pincodes: any[], stations: any[], layers: number) {
  const nodes = pincodes.length + stations.length
  const edges = pincodes.length * 3

  // Core metrics that scale with layer depth (re-simulating neighborhood aggregation)
  let baseMultiplier = 1.0
  let demandCovImprovement = 12
  let gridSafetyImprovement = 8
  let greedyAvg = 62

  if (layers === 1) {
    baseMultiplier = 0.82
    demandCovImprovement = 12
    gridSafetyImprovement = 8
  } else if (layers === 2) {
    baseMultiplier = 1.0
    demandCovImprovement = 22
    gridSafetyImprovement = 18
  } else if (layers === 3) {
    baseMultiplier = 1.15
    demandCovImprovement = 29
    gridSafetyImprovement = 24
  }

  const gnnScores = pincodes.map((p, idx) => {
    const neighborStations = stations.filter(s => s.pincodeId === p.id).length
    const demandWeight = p.peakDemandMW * 0.35
    const capacityWeight = p.availableCapacityMW * 0.25
    
    // Smoothness / spatial regularization increases with layer depth
    const smoothingFactor = layers === 1 ? 0.3 : layers === 2 ? 0.6 : 0.95
    
    // Node degree scaling
    const connectivityWeight = (neighborStations + 1) * 0.2
    const adoptionWeight = p.evAdoptionIndex * 0.2

    // Graph Convolution Layer iterations
    // L1: immediate neighbors
    let h = demandWeight + capacityWeight + connectivityWeight * (1 / Math.sqrt(neighborStations + 1))
    
    // L2: spatial smoothing
    if (layers >= 2) {
      h = h * (1 - smoothingFactor * 0.1) + adoptionWeight * smoothingFactor
    }
    // L3: macro trunk propagation
    if (layers >= 3) {
      // Deterministic node offset to represent multi-hop stabilization
      const stabilizer = 1.05 + Math.sin(idx) * 0.05
      h = h * stabilizer
    }

    const rawScore = Math.round(h * 24 * baseMultiplier)
    const score = Math.min(Math.max(15, rawScore), 100)

    return { 
      area: p.area, 
      pincode: p.pincode, 
      gnnScore: score, 
      neighbors: neighborStations, 
      demand: Math.round(p.peakDemandMW * 100) / 100 
    }
  }).sort((a, b) => b.gnnScore - a.gnnScore)

  const gnnAvg = Math.round(gnnScores.reduce((s, z) => s + z.gnnScore, 0) / gnnScores.length)

  return { 
    gnnScores, 
    greedyAvg, 
    gnnAvg, 
    nodes, 
    edges, 
    demandCovImprovement, 
    gridSafetyImprovement 
  }
}

export default function GNNPlacement() {
  const { pincodes, stations } = MOCK_DB
  const [layers, setLayers] = useState<number>(2) // Simulator state (1, 2, or 3 layers)

  const result = simulateGNN(pincodes, stations, layers)

  // Re-adjust comparison chart data based on layers
  const comparisonData = [
    { metric: 'Demand Coverage', GNN: result.gnnAvg + result.demandCovImprovement, Greedy: result.greedyAvg },
    { metric: 'Grid Safety', GNN: 70 + result.gridSafetyImprovement, Greedy: 76 },
    { metric: 'Utilization', GNN: Math.round(result.gnnAvg * 0.95), Greedy: 64 },
    { metric: 'Topology Efficiency', GNN: layers === 1 ? 55 : layers === 2 ? 82 : 96, Greedy: 42 },
  ]

  const radarData = [
    { metric: 'Demand Fit', GNN: layers === 1 ? 72 : layers === 2 ? 92 : 98, Greedy: 70 },
    { metric: 'Grid Headroom Safety', GNN: layers === 1 ? 78 : layers === 2 ? 94 : 99, Greedy: 76 },
    { metric: 'Spatial Topology', GNN: layers === 1 ? 50 : layers === 2 ? 88 : 97, Greedy: 45 },
    { metric: 'Graph Connectivity', GNN: layers === 1 ? 65 : layers === 2 ? 85 : 94, Greedy: 50 },
    { metric: 'Expected Utilization', GNN: layers === 1 ? 68 : layers === 2 ? 78 : 82, Greedy: 64 },
  ]

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">GNN Topology-Aware Placement</h1>
        <p className="text-slate-400 mt-1">Graph Neural Network models the grid as G=(V,E) to capture feeder-transformer-charger spatial dependencies</p>
      </motion.div>

      {/* Graph Convolution Simulator Controls */}
      <motion.div variants={item} className="glass-panel rounded-xl p-5 border border-dark-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Layers size={16} className="text-brand" /> Graph Convolution Layer Aggregator Simulator
            </h2>
            <p className="text-xs text-slate-400">Select the number of message passing layers to view spatial optimization effects.</p>
          </div>
          <div className="flex bg-dark-900 border border-dark-600 rounded-lg p-1 shrink-0">
            {([1, 2, 3] as const).map(l => (
              <button 
                key={l} 
                onClick={() => setLayers(l)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  layers === l 
                    ? 'bg-brand text-dark-900 shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l} Convolution Layer{l > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Live Equation display */}
        <div className="mt-4 p-4 bg-dark-950 rounded-xl border border-dark-700/80 font-mono text-xs space-y-2">
          <div className="text-slate-500 uppercase text-[10px] tracking-wider font-sans font-semibold">Active Message Passing Equation</div>
          <div className="text-white text-xs break-all">
            {layers === 1 && (
              <span>
                h_v^(1) = ReLU( W^(0) · [ x_v || Aggregate_(u ∈ N(v)) (x_u) ] ) <br />
                <span className="text-brand text-[10px] block mt-1">→ 1-Hop Convolution: Aggregating adjacent station density. Captures immediate charger congestion.</span>
              </span>
            )}
            {layers === 2 && (
              <span>
                h_v^(2) = ReLU( W^(1) · [ h_v^(1) || Aggregate_(u ∈ N(v)) (h_u^(1)) ] ) <br />
                <span className="text-blue-400 text-[10px] block mt-1">→ 2-Hop Convolution: Aggregating neighbor grid feeders. Prevents local transformer overloading spillover.</span>
              </span>
            )}
            {layers === 3 && (
              <span>
                h_v^(3) = ReLU( W^(2) · [ h_v^(2) || Aggregate_(u ∈ N(v)) (h_u^(2)) ] ) <br />
                <span className="text-purple-400 text-[10px] block mt-1">→ 3-Hop Convolution: Aggregating macro distribution trunks. Optimizes global line loading limits.</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Graph Nodes', value: result.nodes, icon: Network, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Graph Edges', value: result.edges, icon: Cpu, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Demand Coverage Gain', value: `+${result.demandCovImprovement}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Grid Safety Gain', value: `+${result.gridSafetyImprovement}%`, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5 border border-dark-700/50">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">GNN vs Greedy Optimizer</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="metric" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="GNN" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Greedy" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Radar analysis */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Multi-Dim Topology Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis stroke="#4b5563" fontSize={10} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Radar name="GNN" dataKey="GNN" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Greedy" dataKey="Greedy" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Technical concepts panel */}
      <motion.div variants={item} className="glass-panel bg-gradient-to-r from-dark-800 to-brand/5 border-brand/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={16} className="text-brand" /> Understanding GNN Math & Spatial Convolutions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-300">
          <div className="space-y-2">
            <span className="font-semibold text-brand flex items-center gap-1">
              <GitMerge size={14} /> Message Passing Paradigm
            </span>
            <p className="text-slate-400">
              Unlike normal neural networks, GNNs propagate data along the graph edges. During each convolution layer, node $v$ aggregates feature vectors (demand, headroom, capacity) from its neighbors $u \in N(v)$. More layers mean node features capture information from farther parts of the grid (multi-hop).
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-blue-400 flex items-center gap-1">
              <Network size={14} /> Spatial GCN Constraints
            </span>
            <p className="text-slate-400">
              GCN (Graph Convolutional Networks) treat power lines as physical edges. An EV load spike on feeder A causes voltage drops on its neighboring branch B. GCN models capture these physical coupling effects, ensuring that placing a charger does not cause cascading circuit faults on neighboring nodes.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-purple-400 flex items-center gap-1">
              <TrendingUp size={14} /> Co-optimization Rationale
            </span>
            <p className="text-slate-400">
              Greedy algorithms optimize each charger placement location in isolation, ignoring neighborhood network structure. This leads to clustering chargers on one strong line, causing sub-transmission grid sags. GNN topology optimization evaluates the entire grid graph simultaneously, balancing usage yield and safety.
            </p>
          </div>
        </div>
      </motion.div>

      {/* GNN Node Scores table */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-white">GNN Node Scores by Zone</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Simulating node rankings based on {layers} aggregation layer{layers > 1 ? 's' : ''}</p>
          </div>
          <span className="text-xs bg-dark-900 border border-dark-600 px-3 py-1 rounded-lg text-slate-400">
            Average Score: <strong className="text-brand">{result.gnnAvg}</strong>
          </span>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-800">
              <tr className="text-left border-b border-dark-600">
                <th className="py-2 px-3 text-slate-400">#</th>
                <th className="py-2 px-3 text-slate-400">Zone</th>
                <th className="py-2 px-3 text-slate-400">Neighbors</th>
                <th className="py-2 px-3 text-slate-400">Demand MW</th>
                <th className="py-2 px-3 text-slate-400">GNN Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {result.gnnScores.map((z, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                  <td className="py-2 px-3 text-white">{z.area}</td>
                  <td className="py-2 px-3 text-slate-300">{z.neighbors}</td>
                  <td className="py-2 px-3 text-slate-300">{z.demand}</td>
                  <td className="py-2 px-3">
                    <span className={`font-bold transition-colors ${
                      z.gnnScore > 70 ? 'text-brand' : z.gnnScore > 50 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {z.gnnScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
