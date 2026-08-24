import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { Battery, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

function simulateDegradation(annualV2gCycles: number, years: number) {
  const data = []
  let soh = 100 // State of Health
  let cumGrossRev = 0, cumNetRev = 0, cumDegCost = 0
  const cycleDepthFactor = 0.0004 // SOH loss per V2G cycle (Schenk et al. 2023)
  const batteryCapKwh = 60
  const replacementCostPerKwh = 120 // USD/kWh proxy for India
  const v2gRevenuePerCycle = 45 // INR per cycle

  for (let y = 0; y <= years; y++) {
    const cyclesThisYear = y === 0 ? 0 : annualV2gCycles
    const sohLoss = cyclesThisYear * cycleDepthFactor * (1 + y * 0.05) // accelerating degradation
    soh = Math.max(soh - sohLoss, 60)
    const grossRev = cyclesThisYear * v2gRevenuePerCycle
    const degradationCost = sohLoss / 100 * batteryCapKwh * replacementCostPerKwh * 83 // USD to INR
    cumGrossRev += grossRev
    cumDegCost += degradationCost
    cumNetRev = cumGrossRev - cumDegCost
    data.push({
      year: `Year ${y}`,
      soh: +soh.toFixed(1),
      grossRevenue: Math.round(cumGrossRev / 100000),
      netRevenue: Math.round(cumNetRev / 100000),
      degradationCost: Math.round(cumDegCost / 100000),
    })
  }
  return data
}

export default function V2GDegradation() {
  const [cyclesPerYear, setCyclesPerYear] = useState(365)
  const data = simulateDegradation(cyclesPerYear, 10)

  const finalSoh = data[data.length - 1].soh
  const finalNet = data[data.length - 1].netRevenue
  const finalGross = data[data.length - 1].grossRevenue
  const finalDeg = data[data.length - 1].degradationCost
  const breakEvenYear = data.findIndex(d => d.netRevenue < 0 && d.year !== 'Year 0')

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">V2G Fleet Simulation & Battery Degradation</h1>
        <p className="text-slate-400 mt-1">Semi-empirical battery wear model (Schenk et al. 2023) — realistic V2G economics for Indian conditions</p>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-5">
        <p className="text-sm text-slate-300 font-mono mb-3">Net_V2G_Revenue = Gross_Revenue − (SOH_Loss × Battery_Cap × Replacement_Cost)</p>
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400">V2G Cycles/Year:</label>
          <input type="range" min={100} max={730} step={10} value={cyclesPerYear} onChange={e => setCyclesPerYear(+e.target.value)} className="w-48 accent-brand" />
          <span className="text-sm text-brand font-bold">{cyclesPerYear} ({(cyclesPerYear / 365).toFixed(1)}/day)</span>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Battery SOH @ 10yr', value: `${finalSoh}%`, icon: Battery, color: finalSoh > 75 ? 'text-brand' : 'text-red-400', bg: finalSoh > 75 ? 'bg-brand/10' : 'bg-red-400/10' },
          { label: 'Gross V2G Revenue', value: `₹${finalGross} L`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Degradation Cost', value: `₹${finalDeg} L`, icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Net Revenue (10yr)', value: `₹${finalNet} L`, icon: AlertTriangle, color: finalNet > 0 ? 'text-brand' : 'text-red-400', bg: finalNet > 0 ? 'bg-brand/10' : 'bg-red-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Battery State of Health Over Time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs><linearGradient id="sohGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[60, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
              <Area type="monotone" dataKey="soh" name="SOH %" stroke="#10b981" strokeWidth={2} fill="url(#sohGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Gross vs Net Revenue (with Degradation)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="grossRevenue" name="Gross Revenue (₹L)" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netRevenue" name="Net Revenue (₹L)" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="degradationCost" name="Degradation Cost (₹L)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  )
}
