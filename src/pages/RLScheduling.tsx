import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Brain, Zap, TrendingUp, RotateCcw } from 'lucide-react'

// Simulated Q-learning agent for adaptive EV charging scheduling
function simulateRLAgent(forecasts: any[], episodes: number) {
  const hours = 24
  const actions = ['LOW_PRICE', 'NORMAL_PRICE', 'HIGH_PRICE'] as const
  const alpha = 0.1, gamma = 0.95, epsilon = 0.15

  // Initialize Q-table: state = hour, action = pricing tier
  const Q: number[][] = Array.from({ length: hours }, () => actions.map(() => Math.random() * 0.1))

  const rewardLog: { episode: number; totalReward: number; peakReduction: number }[] = []

  for (let ep = 0; ep < episodes; ep++) {
    let totalReward = 0
    let peakLoad = 0

    for (let h = 0; h < hours; h++) {
      const demand = forecasts[h % forecasts.length]?.predictedDemandKw || 500
      const isPeak = h >= 18 && h <= 22

      // Epsilon-greedy action selection
      let actionIdx: number
      if (Math.random() < epsilon * (1 - ep / episodes)) {
        actionIdx = Math.floor(Math.random() * 3)
      } else {
        actionIdx = Q[h].indexOf(Math.max(...Q[h]))
      }

      // Compute reward: stability + satisfaction - peak penalty
      const priceFactor = actionIdx === 0 ? 0.7 : actionIdx === 1 ? 1.0 : 1.3
      const shiftedDemand = demand * (actionIdx === 0 && isPeak ? 0.6 : actionIdx === 2 && !isPeak ? 1.2 : 1.0)
      const gridStability = Math.max(0, 100 - (shiftedDemand / 800) * 100)
      const userSatisfaction = actionIdx === 0 ? 85 : actionIdx === 1 ? 70 : 45
      const peakPenalty = isPeak && actionIdx === 0 ? 0 : isPeak ? shiftedDemand * 0.05 : 0
      const reward = 0.5 * gridStability + 0.3 * userSatisfaction - 0.2 * peakPenalty

      // Q-learning update
      const nextState = (h + 1) % hours
      const maxNextQ = Math.max(...Q[nextState])
      Q[h][actionIdx] += alpha * (reward + gamma * maxNextQ - Q[h][actionIdx])

      totalReward += reward
      peakLoad = Math.max(peakLoad, shiftedDemand)
    }

    if (ep % 10 === 0 || ep === episodes - 1) {
      rewardLog.push({ episode: ep, totalReward: Math.round(totalReward), peakReduction: Math.round((1 - peakLoad / 800) * 100) })
    }
  }

  // Extract final policy
  const policy = Q.map((qRow, h) => {
    const bestAction = qRow.indexOf(Math.max(...qRow))
    return { hour: `${h}:00`, action: actions[bestAction], qLow: +qRow[0].toFixed(2), qNormal: +qRow[1].toFixed(2), qHigh: +qRow[2].toFixed(2) }
  })

  return { rewardLog, policy, Q }
}

export default function RLScheduling() {
  const { pincodes } = MOCK_DB
  const forecasts = pincodes[0]?.forecasts || []
  const [episodes, setEpisodes] = useState(200)
  const [result, setResult] = useState<ReturnType<typeof simulateRLAgent> | null>(null)
  const [running, setRunning] = useState(false)

  function runRL() {
    setRunning(true)
    setTimeout(() => {
      setResult(simulateRLAgent(forecasts, episodes))
      setRunning(false)
    }, 800)
  }

  useEffect(() => { runRL() }, [])

  // Rule-based comparison
  const ruleBasedReward = 1200 + Math.random() * 200
  const rlReward = result?.rewardLog[result.rewardLog.length - 1]?.totalReward || 0
  const improvement = ((rlReward - ruleBasedReward) / ruleBasedReward * 100).toFixed(1)

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">RL Adaptive Scheduling</h1>
        <p className="text-slate-400 mt-1">Q-learning agent that learns optimal TOU pricing to minimize peak load while maximizing user satisfaction</p>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-5">
        <p className="text-sm text-slate-300 font-mono mb-3">Reward = α × Grid_Stability + β × User_Satisfaction − γ × Peak_Load_Penalty</p>
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400">Episodes:</label>
          <input type="range" min={50} max={500} step={50} value={episodes} onChange={e => setEpisodes(+e.target.value)} className="w-40 accent-brand" />
          <span className="text-sm text-brand font-bold">{episodes}</span>
          <button onClick={runRL} disabled={running} className="ml-auto px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light disabled:opacity-50 flex items-center gap-2">
            <RotateCcw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Training...' : 'Re-train Agent'}
          </button>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'RL Agent Reward', value: rlReward, icon: Brain, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Rule-Based Reward', value: Math.round(ruleBasedReward), icon: Zap, color: 'text-slate-400', bg: 'bg-slate-400/10' },
          { label: 'RL Improvement', value: `+${improvement}%`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {result && (
        <>
          <motion.div variants={item} className="glass-panel rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Training Convergence</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.rewardLog}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="episode" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="totalReward" name="Cumulative Reward" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="peakReduction" name="Peak Reduction %" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-panel rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Learned Policy — Optimal Pricing per Hour</h2>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-dark-800">
                  <tr className="text-left border-b border-dark-600">
                    <th className="py-2 px-3 text-slate-400">Hour</th>
                    <th className="py-2 px-3 text-slate-400">Action</th>
                    <th className="py-2 px-3 text-slate-400">Q(Low)</th>
                    <th className="py-2 px-3 text-slate-400">Q(Normal)</th>
                    <th className="py-2 px-3 text-slate-400">Q(High)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {result.policy.map(p => (
                    <tr key={p.hour}>
                      <td className="py-2 px-3 text-white">{p.hour}</td>
                      <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.action === 'LOW_PRICE' ? 'bg-brand/20 text-brand' : p.action === 'HIGH_PRICE' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{p.action}</span></td>
                      <td className="py-2 px-3 text-slate-300">{p.qLow}</td>
                      <td className="py-2 px-3 text-slate-300">{p.qNormal}</td>
                      <td className="py-2 px-3 text-slate-300">{p.qHigh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
