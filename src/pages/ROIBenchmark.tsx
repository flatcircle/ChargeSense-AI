import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { formatInr } from '../lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { IndianRupee, TrendingUp, Clock, BatteryCharging } from 'lucide-react'

export default function ROIBenchmark() {
  const { proposals } = MOCK_DB

  const avgPayback = Math.round(proposals.reduce((s, p) => s + p.paybackMonths, 0) / proposals.length)
  const totalRevYr1 = proposals.reduce((s, p) => s + p.estimatedRevenueInrPerMonth * 12, 0)
  const totalV2G = proposals.reduce((s, p) => s + p.annualV2gRevenueInr, 0)
  const totalProfit5Yr = proposals.reduce((s, p) => s + p.fiveYearProfitInr, 0)

  // 5-year cumulative projection
  const projectionData = Array.from({ length: 60 }, (_, month) => {
    let cumRevenue = 0
    let cumCost = 0
    proposals.forEach(p => {
      cumRevenue += p.estimatedRevenueInrPerMonth + (p.annualV2gRevenueInr / 12)
      cumCost += month === 0 ? (p.fiveYearProfitInr / 60 + p.estimatedRevenueInrPerMonth) * 0.3 : 0
    })
    return {
      month: month + 1,
      revenue: Math.round(cumRevenue * (month + 1) / 10000000 * 100) / 100,
      cost: Math.round((totalRevYr1 * 1.2 / 12 * Math.min(month + 1, avgPayback)) / 10000000 * 100) / 100,
    }
  }).filter((_, i) => i % 6 === 0 || i === 59)

  // Per-proposal ROI bar chart
  const proposalROI = proposals.slice(0, 10).map(p => ({
    name: p.pincode.area.substring(0, 12),
    payback: Math.round(p.paybackMonths),
    monthlyRev: Math.round(p.estimatedRevenueInrPerMonth / 1000),
    v2g: Math.round(p.annualV2gRevenueInr / 12000),
  }))

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">ROI & V2G Revenue Benchmarking</h1>
        <p className="text-slate-400 mt-1">5-year financial projections and V2G revenue estimates per site</p>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Payback Period', value: `${avgPayback} months`, icon: Clock, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Revenue Year 1', value: formatInr(totalRevYr1), icon: IndianRupee, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Annual V2G Revenue', value: formatInr(totalV2G), icon: BatteryCharging, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: '5-Year Net Profit', value: formatInr(totalProfit5Yr), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${m.bg} ${m.color}`}><m.icon size={20} /></div>
              <div className="text-xs text-slate-400 font-medium">{m.label}</div>
            </div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Cumulative Revenue Projection (5 Years)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v} Cr`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} formatter={(v: number) => `₹${v.toFixed(2)} Cr`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Cumulative Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" name="Cumulative CAPEX" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-3">Breakeven point at ~{avgPayback} months. Revenue includes charging tariff + V2G grid stabilization credits.</p>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Per-Site Revenue Breakdown (Top 10)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={proposalROI}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}K`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="monthlyRev" name="Charging Rev (₹K/mo)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="v2g" name="V2G Rev (₹K/mo)" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Site-Level Financial Details</h2>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-800">
              <tr className="text-left border-b border-dark-600">
                <th className="py-2 px-3 text-slate-400">Site</th>
                <th className="py-2 px-3 text-slate-400">Monthly Rev</th>
                <th className="py-2 px-3 text-slate-400">V2G/yr</th>
                <th className="py-2 px-3 text-slate-400">Payback</th>
                <th className="py-2 px-3 text-slate-400">5yr Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {proposals.map(p => (
                <tr key={p.id}>
                  <td className="py-2 px-3 text-white">{p.pincode.area}</td>
                  <td className="py-2 px-3 text-brand">{formatInr(p.estimatedRevenueInrPerMonth)}</td>
                  <td className="py-2 px-3 text-purple-400">{formatInr(p.annualV2gRevenueInr)}</td>
                  <td className="py-2 px-3 text-slate-300">{p.paybackMonths} mo</td>
                  <td className="py-2 px-3 text-amber-400">{formatInr(p.fiveYearProfitInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
