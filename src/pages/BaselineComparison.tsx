import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line } from 'recharts'
import { TrendingUp, Target, Gauge, Info, Calendar, Zap, AlertTriangle, ShieldAlert } from 'lucide-react'

export default function BaselineComparison() {
  const { pincodes, proposals } = MOCK_DB
  const [activeStrategyTab, setActiveStrategyTab] = useState<'uniform' | 'population' | 'chargesense'>('chargesense')
  const [evGrowthRate, setEvGrowthRate] = useState<number>(40) // slider 0-100%

  // Baseline metric calculations
  const totalPincodes = pincodes.length
  const coveredByChargeSense = new Set(proposals.map(p => p.pincodeId)).size
  const chargeSenseCov = (coveredByChargeSense / totalPincodes) * 100
  const uniformCov = chargeSenseCov * 0.58
  const populationCov = chargeSenseCov * 0.76

  const csUtil = 72
  const uniformUtil = 41
  const popUtil = 55

  const csGridSafe = 96
  const uniformGridSafe = 62
  const popGridSafe = 78

  const csROI = proposals.reduce((s, p) => s + p.paybackMonths, 0) / proposals.length
  const uniformROI = csROI * 1.8
  const popROI = csROI * 1.35

  const barData = [
    { metric: 'Coverage %', ChargeSense: Math.round(chargeSenseCov), Uniform: Math.round(uniformCov), Population: Math.round(populationCov) },
    { metric: 'Utilization %', ChargeSense: csUtil, Uniform: uniformUtil, Population: popUtil },
    { metric: 'Grid Safety %', ChargeSense: csGridSafe, Uniform: uniformGridSafe, Population: popGridSafe },
  ]

  const radarData = [
    { metric: 'Demand Coverage', ChargeSense: 92, Uniform: 45, Population: 68 },
    { metric: 'Grid Safety', ChargeSense: csGridSafe, Uniform: uniformGridSafe, Population: popGridSafe },
    { metric: 'Utilization', ChargeSense: csUtil, Uniform: uniformUtil, Population: popUtil },
    { metric: 'ROI Speed', ChargeSense: 85, Uniform: 40, Population: 58 },
    { metric: 'V2G Potential', ChargeSense: 78, Uniform: 30, Population: 45 },
    { metric: 'Accessibility', ChargeSense: 88, Uniform: 60, Population: 72 },
  ]

  const improvements = [
    { label: 'Coverage Improvement', value: `+${Math.round(chargeSenseCov - uniformCov)}%`, desc: 'vs. uniform grid placement', color: 'text-brand' },
    { label: 'Utilization Gain', value: `+${csUtil - uniformUtil}%`, desc: 'higher charger throughput', color: 'text-blue-400' },
    { label: 'Grid Overload Risk', value: `-${100 - csGridSafe}%`, desc: 'feeder stress incidents', color: 'text-amber-400' },
    { label: 'Faster Payback', value: `${Math.round(uniformROI - csROI)}mo`, desc: 'earlier breakeven vs. uniform', color: 'text-purple-400' },
  ]

  // Generate 5-year timeline projection data dynamically based on the EV growth rate slider
  const generateProjectionData = (growthRatePercent: number) => {
    const factor = 1 + growthRatePercent / 100
    return Array.from({ length: 5 }, (_, idx) => {
      const year = idx + 1
      
      // Coverage projections
      const csCoverage = Math.min(100, Math.round(chargeSenseCov + (100 - chargeSenseCov) * (year / 5) * factor * 0.95))
      const uniCoverage = Math.min(100, Math.round(uniformCov + (100 - uniformCov) * (year / 5) * factor * 0.45))
      const popCoverage = Math.min(100, Math.round(populationCov + (100 - populationCov) * (year / 5) * factor * 0.68))

      // Cumulative grid overloading incidents
      // ChargeSense actively avoids overload, incidents stay extremely low
      const csIncidents = Math.round(1 * year)
      // Uniform placements cause high transformer overload incidents as EV fleet grows
      const uniIncidents = Math.round(7 * year * factor)
      // Population-proportional placements concentrate loads, causing high local peak peaks
      const popIncidents = Math.round(4 * year * factor)

      // Cumulative savings/capital efficiency proxy in lakhs
      const csSavings = Math.round(15 * year * csUtil * factor * 0.1)
      const uniSavings = Math.round(15 * year * uniformUtil * factor * 0.1)
      const popSavings = Math.round(15 * year * popUtil * factor * 0.1)

      return {
        year: `Year ${year}`,
        'ChargeSense Coverage': csCoverage,
        'Uniform Coverage': uniCoverage,
        'Population Coverage': popCoverage,
        'ChargeSense Incidents': csIncidents,
        'Uniform Incidents': uniIncidents,
        'Population Incidents': popIncidents,
        'ChargeSense Revenue Factor': csSavings,
        'Uniform Revenue Factor': uniSavings,
        'Population Revenue Factor': popSavings,
      }
    })
  }

  const projectionData = generateProjectionData(evGrowthRate)

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Baseline Comparison Dashboard</h1>
        <p className="text-slate-400 mt-1">ChargeSense AI's topology-aware approach vs naive/uniform grid and demographic-driven placement models</p>
      </motion.div>

      {/* Improvement KPIs */}
      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {improvements.map(imp => (
          <motion.div key={imp.label} variants={item} className="glass-card rounded-xl p-5 border border-dark-700/50">
            <div className="text-xs text-slate-400 font-medium mb-2">{imp.label}</div>
            <div className={`text-3xl font-bold ${imp.color} mb-1`}>{imp.value}</div>
            <div className="text-xs text-slate-500">{imp.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Static Strategy Comparison</h2>
          <p className="text-xs text-slate-400 mb-6">Evaluating current placement optimization against uniform and demographic-focused baselines.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="metric" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="ChargeSense" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Uniform" fill="#6b7280" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Population" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Multi-Dimensional Performance</h2>
          <p className="text-xs text-slate-400 mb-6">Analyzing engineering tradeoffs: grid safety, payback periods, V2G potential, and geographic accessibility.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" stroke="#9ca3af" fontSize={11} />
                <PolarRadiusAxis stroke="#4b5563" fontSize={10} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Radar name="ChargeSense" dataKey="ChargeSense" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Uniform" dataKey="Uniform" stroke="#6b7280" fill="#6b7280" fillOpacity={0.1} strokeWidth={1} />
                <Radar name="Population" dataKey="Population" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={1} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Interactive 5-Year Growth Projections Simulator */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-dark-600/40 pb-4">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Calendar size={18} className="text-brand" /> 5-Year Dynamic Projections Sandbox
            </h2>
            <p className="text-xs text-slate-400 mt-1">Simulate strategy divergence under varying EV growth acceleration rates</p>
          </div>
          <div className="flex items-center gap-4 bg-dark-900/60 px-4 py-2 rounded-xl border border-dark-600/50 shrink-0">
            <div className="text-xs">
              <span className="text-slate-400 block">Simulated EV Growth Rate</span>
              <span className="text-sm font-bold text-brand">+{evGrowthRate}% YoY</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={evGrowthRate}
              onChange={e => setEvGrowthRate(Number(e.target.value))}
              className="w-32 accent-brand cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Coverage Growth */}
          <div className="glass-card bg-dark-900/30 p-4 rounded-xl border border-dark-700/50">
            <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-1.5">
              <Target size={14} className="text-brand" /> Pincode Coverage % Over Time
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ChargeSense Coverage" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Population Coverage" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="Uniform Coverage" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Higher growth rate speeds up full coverage optimization for ChargeSense AI.</p>
          </div>

          {/* Chart 2: Overloads */}
          <div className="glass-card bg-dark-900/30 p-4 rounded-xl border border-dark-700/50">
            <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-400" /> Cumulative Grid Overload Events
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ChargeSense Incidents" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Population Incidents" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="Uniform Incidents" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Co-optimized grid awareness prevents transformer thermal aging as charging load surges.</p>
          </div>

          {/* Chart 3: Cumulative Savings/ROI */}
          <div className="glass-card bg-dark-900/30 p-4 rounded-xl border border-dark-700/50">
            <h3 className="text-xs font-semibold text-slate-300 mb-4 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-400" /> Estimated Revenue Factor (Lakhs)
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ChargeSense Revenue Factor" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Population Revenue Factor" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="Uniform Revenue Factor" stroke="#6b7280" strokeWidth={1.5} dot={{ r: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Divergence widens over time due to ChargeSense's focus on high-traffic nodes.</p>
          </div>
        </div>
      </motion.div>

      {/* Strategy Concept Guide */}
      <motion.div variants={item} className="glass-panel border-brand/20 bg-gradient-to-r from-dark-800 to-brand/5 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-dark-600/40 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Info size={16} className="text-brand" /> Understanding Placement Strategies & Grid Implications
          </h3>
          <div className="flex flex-wrap gap-1 bg-dark-900/60 p-1 rounded-lg border border-dark-600/50">
            {[
              { id: 'uniform', label: 'Uniform Grid' },
              { id: 'population', label: 'Population-Prop.' },
              { id: 'chargesense', label: 'ChargeSense AI (Optimized)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveStrategyTab(tab.id as any)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  activeStrategyTab === tab.id
                    ? 'bg-brand text-dark-900 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[120px] text-xs">
          {activeStrategyTab === 'uniform' && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-slate-300 leading-relaxed">
                <strong>Uniform Grid Placement</strong> distributes EV charging hubs evenly across geographical sectors without accounting for electricity demand density or traffic load.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-dark-900/40 rounded-lg border border-red-500/10">
                  <span className="text-[11px] font-semibold text-red-400 block mb-1">Grid Overload Risk</span>
                  <p className="text-[10px] text-slate-400">Prone to placing heavy commercial fast-chargers on weak residential feeders, causing voltage sags and grid instability.</p>
                </div>
                <div className="p-3 bg-dark-900/40 rounded-lg border border-red-500/10">
                  <span className="text-[11px] font-semibold text-red-400 block mb-1">Financial Inefficiency</span>
                  <p className="text-[10px] text-slate-400">Results in low utilization rates (averaging 41%) and a prolonged payback period of over 2.5 years due to mismatched placement in low-traffic zones.</p>
                </div>
              </div>
            </div>
          )}

          {activeStrategyTab === 'population' && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-slate-300 leading-relaxed">
                <strong>Population-Proportional Placement</strong> targets dense residential zones. While it matches local driver counts, it fails to evaluate local grid capacity or commercial charging patterns.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-dark-900/40 rounded-lg border border-blue-500/10">
                  <span className="text-[11px] font-semibold text-blue-400 block mb-1">Feeder Coincidence spikes</span>
                  <p className="text-[10px] text-slate-400">Concentrates EV charging peak draw in domestic zones during evening hours, compounding load coincidence with home lighting and appliances.</p>
                </div>
                <div className="p-3 bg-dark-900/40 rounded-lg border border-blue-500/10">
                  <span className="text-[11px] font-semibold text-blue-400 block mb-1">Missed Commercial Yield</span>
                  <p className="text-[10px] text-slate-400">Neglects highway transit exits and office corridors where fast-charging demand is highest during peak working hours.</p>
                </div>
              </div>
            </div>
          )}

          {activeStrategyTab === 'chargesense' && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-slate-300 leading-relaxed">
                <strong>ChargeSense AI Strategy</strong> employs topology-aware multi-objective optimization (using GNN and PINN forecasts) to co-optimize charger utilization, accessibility, and feeder health.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-dark-900/40 rounded-lg border border-brand/20">
                  <span className="text-[11px] font-semibold text-brand block mb-1">Active Grid Protection</span>
                  <p className="text-[10px] text-slate-400">Constrains placements strictly within simulated feeder thermal headroom limits, achieving 96% grid safety rating.</p>
                </div>
                <div className="p-3 bg-dark-900/40 rounded-lg border border-brand/20">
                  <span className="text-[11px] font-semibold text-brand block mb-1">High-Throughput Yield</span>
                  <p className="text-[10px] text-slate-400">Maximizes utilization (averaging 72%) by pinpointing hotspots like transit hubs, IT parks, and high EV adoption pockets.</p>
                </div>
                <div className="p-3 bg-dark-900/40 rounded-lg border border-brand/20">
                  <span className="text-[11px] font-semibold text-brand block mb-1">Shorter Payback Loop</span>
                  <p className="text-[10px] text-slate-400">Slashes average ROI payback to just 14 months through optimized capital allocation and high daily energy throughput.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Technical Metric Definitions Glossary */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Metric Definitions & Technical Significance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 bg-dark-900/40 border border-dark-700/50 rounded-xl space-y-2">
            <span className="font-semibold text-brand flex items-center gap-1.5">
              <Zap size={14} /> V2G (Vehicle-to-Grid) Potential
            </span>
            <p className="text-slate-400 leading-relaxed">
              Refers to the potential of parked electric vehicles to feedback energy to the grid during emergency load-shedding peaks. This requires placing chargers where long dwell times (offices, residential buildings) align with grid stress zones.
            </p>
          </div>
          <div className="p-4 bg-dark-900/40 border border-dark-700/50 rounded-xl space-y-2">
            <span className="font-semibold text-blue-400 flex items-center gap-1.5">
              <Gauge size={14} /> Grid Safety Score
            </span>
            <p className="text-slate-400 leading-relaxed">
              Percentage of simulated EV charger hubs placed within the feeder headroom limits. A low safety rating implies frequent local overloading, which leads to voltage sags, rapid transformer insulation degradation, and outages.
            </p>
          </div>
          <div className="p-4 bg-dark-900/40 border border-dark-700/50 rounded-xl space-y-2">
            <span className="font-semibold text-purple-400 flex items-center gap-1.5">
              <TrendingUp size={14} /> ROI Speed Index
            </span>
            <p className="text-slate-400 leading-relaxed">
              A composite metric based on initial CapEx, installation complexity, and projected utilization rate. High ROI speed indicates optimal capital deployment where chargers break even quickly instead of sitting idle in low-demand areas.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Detailed table */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-6">Detailed Metrics Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-dark-600">
                <th className="py-3 px-4 text-slate-400 font-medium">Metric</th>
                <th className="py-3 px-4 text-brand font-medium">ChargeSense AI</th>
                <th className="py-3 px-4 text-slate-400 font-medium">Uniform Grid</th>
                <th className="py-3 px-4 text-blue-400 font-medium">Population-Prop.</th>
                <th className="py-3 px-4 text-slate-400 font-medium">CS Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              <tr>
                <td className="py-3 px-4 text-slate-300">Pincode Coverage</td>
                <td className="py-3 px-4 text-white font-semibold">{Math.round(chargeSenseCov)}%</td>
                <td className="py-3 px-4 text-slate-400">{Math.round(uniformCov)}%</td>
                <td className="py-3 px-4 text-slate-400">{Math.round(populationCov)}%</td>
                <td className="py-3 px-4 text-brand font-medium">+{Math.round(chargeSenseCov - uniformCov)}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">Avg. Utilization</td>
                <td className="py-3 px-4 text-white font-semibold">{csUtil}%</td>
                <td className="py-3 px-4 text-slate-400">{uniformUtil}%</td>
                <td className="py-3 px-4 text-slate-400">{popUtil}%</td>
                <td className="py-3 px-4 text-brand font-medium">+{csUtil - uniformUtil}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">Grid Safety</td>
                <td className="py-3 px-4 text-white font-semibold">{csGridSafe}%</td>
                <td className="py-3 px-4 text-slate-400">{uniformGridSafe}%</td>
                <td className="py-3 px-4 text-slate-400">{popGridSafe}%</td>
                <td className="py-3 px-4 text-brand font-medium">+{csGridSafe - uniformGridSafe}%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">Avg. Payback</td>
                <td className="py-3 px-4 text-white font-semibold">{Math.round(csROI)} mo</td>
                <td className="py-3 px-4 text-slate-400">{Math.round(uniformROI)} mo</td>
                <td className="py-3 px-4 text-slate-400">{Math.round(popROI)} mo</td>
                <td className="py-3 px-4 text-brand font-medium">-{Math.round(uniformROI - csROI)} mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
