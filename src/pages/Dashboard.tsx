import { Link } from 'react-router-dom'
import { MOCK_DB } from '../data/mock-db'
import { MapPin, Plug, Zap, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatInr } from '../lib/utils'

export default function Dashboard() {
  const { pincodes, stations, proposals } = MOCK_DB
  const topProposals = proposals.sort((a, b) => b.siteScore - a.siteScore).slice(0, 6)
  const totalRevenueYr1 = proposals.reduce((sum, p) => sum + p.estimatedRevenueInrPerMonth * 12, 0)
  
  const statusCounts: Record<string, number> = {}
  for (const p of proposals) statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1

  const metrics = [
    { label: 'Pincodes Analyzed', value: pincodes.length, icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Existing Chargers', value: stations.length, icon: Plug, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Active Proposals', value: proposals.length, icon: Zap, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Revenue Yr 1', value: formatInr(totalRevenueYr1), icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10' },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-white">Operational Dashboard</h1>
          <p className="text-slate-400 mt-1">MPPKVVCL EV charging infrastructure planning (Indore)</p>
        </motion.div>
        <motion.div variants={item}>
          <Link
            to="/plan"
            className="px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
          >
            <Zap size={16} />
            Generate Plan
          </Link>
        </motion.div>
      </div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${m.bg} ${m.color}`}>
                <m.icon size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">{m.label}</div>
                <div className="text-2xl font-bold text-white">{m.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Top Proposals by Site Score</h2>
            <Link to="/proposals" className="text-sm text-brand hover:text-brand-light transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {topProposals.map(p => (
              <Link
                key={p.id}
                to={`/proposals`}
                className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600/50 hover:border-brand/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate group-hover:text-brand-light transition-colors">
                    {p.pincode.area} ({p.pincode.pincode})
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {p.category.replace(/_/g, ' ')} · {p.recommendedPorts} ports · {formatInr(p.estimatedRevenueInrPerMonth)}/mo
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Score</div>
                    <div className="font-bold text-lg text-brand">{(p.siteScore * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">Payback</div>
                    <div className="font-medium text-sm text-slate-300">{p.paybackMonths}mo</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-6">Proposal Status</h2>
          <div className="space-y-5">
            {['PROPOSED', 'SHORTLISTED', 'APPROVED', 'DEPLOYED', 'REJECTED'].map(s => {
              const count = statusCounts[s] ?? 0
              const pct = proposals.length ? (count / proposals.length) * 100 : 0
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{s}</span>
                    <span className="text-sm text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full ${s === 'REJECTED' ? 'bg-red-500' : 'bg-brand'}`} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
