import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts'
import { Sun, Leaf, Zap, Building } from 'lucide-react'

function computeSolarIndex(pincode: any) {
  const solarIrradiance = 4.8 + Math.random() * 1.6 // kWh/m²/day for Indore (Malwa Plateau)
  const rooftopPotential = 30 + pincode.population / 10000 * 15 + Math.random() * 20
  const evDemandOverlap = pincode.evAdoptionIndex * 80 + 10
  const gridDependencyReduction = Math.min(solarIrradiance / 6 * 100, 100)
  const score = Math.round(0.35 * Math.min(solarIrradiance / 6 * 100, 100) + 0.25 * Math.min(rooftopPotential, 100) + 0.25 * evDemandOverlap + 0.15 * gridDependencyReduction)
  return { score, solarIrradiance: +solarIrradiance.toFixed(2), rooftopPotential: Math.round(rooftopPotential), evDemandOverlap: Math.round(evDemandOverlap), gridReduction: Math.round(gridDependencyReduction) }
}

export default function SolarSynergy() {
  const { pincodes } = MOCK_DB
  const zones = pincodes.map(p => {
    const solar = computeSolarIndex(p)
    return { ...p, ...solar, recommended: solar.score >= 70 }
  }).sort((a, b) => b.score - a.score)

  const solarFirstCount = zones.filter(z => z.recommended).length
  const avgIrradiance = (zones.reduce((s, z) => s + z.solarIrradiance, 0) / zones.length).toFixed(2)
  const avgScore = Math.round(zones.reduce((s, z) => s + z.score, 0) / zones.length)

  const barData = zones.slice(0, 12).map(z => ({ name: z.area.substring(0, 12), score: z.score, fill: z.recommended ? '#f59e0b' : '#6b7280' }))

  const radarData = zones.slice(0, 5).map(z => ({
    zone: z.area.substring(0, 10),
    Solar: Math.round(z.solarIrradiance / 6 * 100),
    Rooftop: z.rooftopPotential,
    EVDemand: z.evDemandOverlap,
    GridSaving: z.gridReduction,
  }))

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Solar Synergy Index</h1>
        <p className="text-slate-400 mt-1">Score zones for rooftop PV + EV charging hub integration — aligned with Karnataka solar policy</p>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-5">
        <p className="text-sm text-slate-300 font-mono">SSI = 0.35 × Solar_Irradiance + 0.25 × Rooftop_Potential + 0.25 × EV_Demand_Overlap + 0.15 × Grid_Dependency_Reduction</p>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Solar Irradiance', value: `${avgIrradiance} kWh/m²`, icon: Sun, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Avg Synergy Score', value: avgScore, icon: Leaf, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Solar-First Sites', value: solarFirstCount, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Zones Analyzed', value: zones.length, icon: Building, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className="text-2xl font-bold text-white">{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Solar Synergy Scores by Zone</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={50} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>{barData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Top 5 Zones — Component Breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="zone" stroke="#9ca3af" fontSize={10} />
                <PolarRadiusAxis stroke="#4b5563" fontSize={10} />
                <Radar name="Solar" dataKey="Solar" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                <Radar name="Rooftop" dataKey="Rooftop" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Radar name="EV Demand" dataKey="EVDemand" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Solar-First Recommended Sites</h2>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-800">
              <tr className="text-left border-b border-dark-600">
                <th className="py-2 px-3 text-slate-400">Zone</th>
                <th className="py-2 px-3 text-slate-400">Irradiance</th>
                <th className="py-2 px-3 text-slate-400">Rooftop %</th>
                <th className="py-2 px-3 text-slate-400">EV Overlap</th>
                <th className="py-2 px-3 text-slate-400">Score</th>
                <th className="py-2 px-3 text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {zones.map(z => (
                <tr key={z.id}>
                  <td className="py-2 px-3 text-white">{z.area}</td>
                  <td className="py-2 px-3 text-amber-400">{z.solarIrradiance} kWh/m²</td>
                  <td className="py-2 px-3 text-slate-300">{z.rooftopPotential}%</td>
                  <td className="py-2 px-3 text-slate-300">{z.evDemandOverlap}%</td>
                  <td className="py-2 px-3 font-bold" style={{ color: z.recommended ? '#f59e0b' : '#6b7280' }}>{z.score}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${z.recommended ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-700 text-slate-500'}`}>{z.recommended ? '☀️ Solar-First' : 'Standard'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
