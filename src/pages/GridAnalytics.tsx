import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts'
import { Activity, AlertTriangle, Gauge, BatteryCharging, Info, Sparkles, HelpCircle, TrendingUp } from 'lucide-react'

export default function GridAnalytics() {
  const { pincodes, stations } = MOCK_DB
  const [selectedZone, setSelectedZone] = useState(pincodes[0].id)
  const [addedEVLoad, setAddedEVLoad] = useState(250) // in kW
  const [activeGuideTab, setActiveGuideTab] = useState<'feeder' | 'gnn' | 'harmonics' | 'duckcurve'>('feeder')
  
  
  const selectedPincode = pincodes.find(p => p.id === selectedZone)!
  const selectedCapacityKw = Math.round(selectedPincode.availableCapacityMW * 1000)

  const zoneStressData = pincodes.map(p => {
    const peakForecast = p.forecasts.reduce((prev, c) => (prev.predictedDemandKw > c.predictedDemandKw) ? prev : c)
    const utilization = peakForecast.predictedDemandKw / (p.availableCapacityMW * 1000)
    return {
      id: p.id,
      zone: p.area.split('/')[0].trim().substring(0, 14),
      peakDemand: Math.round(peakForecast.predictedDemandKw),
      capacity: Math.round(p.availableCapacityMW * 1000),
      utilization: Math.round(utilization * 100),
      stressLevel: utilization > 0.8 ? 'Critical' : utilization > 0.6 ? 'Warning' : 'Normal',
    }
  }).sort((a, b) => b.utilization - a.utilization)

  const stressCounts = { Critical: 0, Warning: 0, Normal: 0 }
  zoneStressData.forEach(z => stressCounts[z.stressLevel as keyof typeof stressCounts]++)
  const pieData = [
    { name: 'Critical (>80% Stress)', value: stressCounts.Critical, color: '#ef4444' },
    { name: 'Warning (60-80% Stress)', value: stressCounts.Warning, color: '#f59e0b' },
    { name: 'Normal (<60% Stress)', value: stressCounts.Normal, color: '#10b981' },
  ]

  // Calculate simulated values for the selected zone
  const selectedBasePeak = zoneStressData.find(z => z.id === selectedZone)?.peakDemand || 0
  const simulatedPeakDemand = selectedBasePeak + addedEVLoad
  const simulatedUtilization = Math.round((simulatedPeakDemand / selectedCapacityKw) * 100)
  const simulatedStressLevel = simulatedUtilization > 80 ? 'Critical' : simulatedUtilization > 60 ? 'Warning' : 'Normal'

  // GNN Reliability Score (derived mock GNN prediction of stability)
  const gnnStabilityScore = Math.max(15, Math.round(100 - (simulatedUtilization * 0.8) - (selectedPincode.evAdoptionIndex * 10)))

  const hourlyData = selectedPincode.forecasts.map(f => {
    const baseDemand = Math.round(f.predictedDemandKw)
    return {
      hour: `${f.hour}:00`,
      baseDemand: baseDemand,
      simulatedDemand: baseDemand + addedEVLoad,
      capacity: selectedCapacityKw,
    }
  })

  const operatorCounts: Record<string, number> = {}
  stations.forEach(s => { operatorCounts[s.operator] = (operatorCounts[s.operator] || 0) + 1 })
  const operatorData = Object.entries(operatorCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

  const totalCap = pincodes.reduce((s, p) => s + p.availableCapacityMW, 0)
  const avgUtil = Math.round(zoneStressData.reduce((s, z) => s + z.utilization, 0) / zoneStressData.length)

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-600/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-brand animate-pulse" /> Grid Analytics & Feeder Health
          </h1>
          <p className="text-slate-400 mt-1">
            MPPKVVCL feeder stress monitoring, transformer limits, and Graph Neural Network (GNN) load predictions.
          </p>
        </div>
        
        <div className="bg-brand/10 border border-brand/20 rounded-lg p-3 text-xs text-brand max-w-sm flex gap-2">
          <Sparkles className="shrink-0" size={16} />
          <span>
            <strong>GNN Engine Active:</strong> Analyzing structural grid topology and substation load cascades to optimize proposed charger placement.
          </span>
        </div>
      </motion.div>

      {/* Grid Key Stats */}
      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Grid Capacity', value: `${totalCap.toFixed(1)} MW`, icon: Gauge, color: 'text-brand', bg: 'bg-brand/10', desc: 'Combined MPPKVVCL capacity in district' },
          { label: 'Avg Base Utilization', value: `${avgUtil}%`, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'Average feeder loading before EV load' },
          { label: 'Critical Feeders', value: stressCounts.Critical, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', desc: 'Feeders exceeding 80% stress threshold' },
          { label: 'Active Chargers Listed', value: stations.length, icon: BatteryCharging, color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Monitored charge points on these feeders' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent group-hover:from-brand/50 transition-all duration-300"></div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-lg ${m.bg} ${m.color}`}><m.icon size={20} /></div>
              <div className="text-xs text-slate-400 font-medium">{m.label}</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{m.value}</div>
            <p className="text-[10px] text-slate-500">{m.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Educational Guide Panels (Definitions) */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel border-blue-500/20 bg-gradient-to-r from-dark-800 to-blue-950/20 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-dark-600/40 pb-3">
            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
              <Info size={16} /> Interactive Grid Engineering & Dynamics Guide
            </h3>
            <div className="flex flex-wrap gap-1 bg-dark-900/60 p-1 rounded-lg border border-dark-600/50">
              {[
                { id: 'feeder', label: 'Feeder Limits' },
                { id: 'gnn', label: 'GNN Cascade' },
                { id: 'harmonics', label: 'Power Quality' },
                { id: 'duckcurve', label: 'Solar Curve' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id as any)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    activeGuideTab === tab.id
                      ? 'bg-brand text-dark-900 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[140px] text-xs">
            {activeGuideTab === 'feeder' && (
              <div className="space-y-2.5 animate-fadeIn">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  ⚡ Feeder Overloading & Transformer Thermal Stress
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  MPPKVVCL substation transformer feeders have specific power headroom limits. Continuous loading above 80% causes extreme winding heat, accelerating the aging of internal paper insulation by <strong>up to 7.2x</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2 bg-dark-900/40 rounded border border-brand/20">
                    <strong className="text-brand block">&lt;60% Loading</strong>
                    <span className="text-[10px] text-slate-400">Green zone. Safe for immediate DC Fast Charger activation.</span>
                  </div>
                  <div className="p-2 bg-dark-900/40 rounded border border-amber-500/20">
                    <strong className="text-amber-500 block">60% - 80% Loading</strong>
                    <span className="text-[10px] text-slate-400">Warning zone. Smart slot-shifting active to spread peak demand.</span>
                  </div>
                  <div className="p-2 bg-dark-900/40 rounded border border-red-500/20">
                    <strong className="text-red-500 block">&gt;80% Loading</strong>
                    <span className="text-[10px] text-slate-400">Critical zone. Risk of thermal trip. Battery integration (BESS) required.</span>
                  </div>
                </div>
              </div>
            )}

            {activeGuideTab === 'gnn' && (
              <div className="space-y-2.5 animate-fadeIn">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  🕸️ Graph Neural Network (GNN) Cascade Analysis
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Substations are not isolated; they form an interconnected network topology. When one feeder (e.g., FDR-452) is overloaded by massive EV fleet charging, its voltage sags, forcing adjacent lines to absorb the load differential.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Our GNN Stability Engine calculates real-time structural health indices. A <strong>Stability Score of &gt;75/100</strong> represents a resilient node configuration, whereas scores below 50 indicate a high likelihood of cascading tripping across multiple local rings during peak hours.
                </p>
              </div>
            )}

            {activeGuideTab === 'harmonics' && (
              <div className="space-y-2.5 animate-fadeIn">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  🔌 Power Quality: Non-linear Rectifier Harmonics
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  EV fast chargers use high-frequency power electronics rectifiers that introduce non-linear current waveforms into the grid. This introduces **Total Harmonic Distortion (THD)**, which leads to neutral wire overheating, transformer core humming, and capacitor bank failures.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  ChargeSense recommends CPOs deploy <strong>Active Power Filters (APFs)</strong> and strict impedance matching at sites where THD exceeds IEEE-519 standards (5% THD threshold limits).
                </p>
              </div>
            )}

            {activeGuideTab === 'duckcurve' && (
              <div className="space-y-2.5 animate-fadeIn">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  ☀️ Solar Duck Curve & Load Alignment
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Madhya Pradesh boasts high solar penetration across the Malwa plateau. However, this creates a classic "Duck Curve" where net demand drops during midday solar peak and surges in the evening. EV charging during evening peaks worsens this stress.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Our <strong>Solar Synergy Coefficient</strong> measures how well a feeder's charging profile aligns with solar injection. Charging between <strong>10:00 AM – 3:00 PM</strong> helps absorb solar surplus, earning operators discounts up to ₹3/kWh via grid feed-in rebates.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel border-purple-500/20 bg-gradient-to-r from-dark-800 to-purple-950/20 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-1.5 mb-2">
              <Sparkles size={16} /> Grid Load Shifting Goals
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              To avoid expensive substation upgrades, MPPKVVCL uses ChargeSense's GNN recommendations. The target is to shift **30%** of peak EV charging load to off-peak periods using dynamic slot booking.
            </p>
          </div>
          <div className="bg-dark-900/50 p-3 rounded-lg border border-dark-600/30">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400">Current Shifting Target</span>
              <span className="font-semibold text-purple-300">30.0%</span>
            </div>
            <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: '30%' }}></div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Protects local transformer assets from thermal aging.</span>
          </div>
        </div>
      </motion.div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feeder Health Chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Feeder Health Status</h2>
          <p className="text-slate-500 text-xs mb-4">Proportion of district feeders classified by peak stress risk</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Competitor Charger Distribution */}
        <motion.div variants={item} className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Substation CPO Distribution</h2>
          <p className="text-slate-500 text-xs mb-4">Competitor charging stations connected to the grid segment</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Interactive Feeder Stress Simulator */}
      <motion.div variants={item} className="glass-panel border-brand/20 bg-gradient-to-b from-dark-800 to-dark-800/80 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <Sparkles className="text-brand animate-pulse" size={20} /> Live Feeder Stress Simulator & GNN Predictor
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Select a zone and slide the controls to simulate adding new EV chargers. Observe real-time grid utilization and GNN stability scores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Zone/Substation</label>
              <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)} className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand w-56">
                {pincodes.map(p => <option key={p.id} value={p.id}>{p.area} ({p.pincode})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* Slider input */}
          <div className="lg:col-span-2 space-y-4 bg-dark-900/50 p-5 rounded-xl border border-dark-600/30">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Simulate Added EV Load (kW)</span>
              <span className="text-sm font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">{addedEVLoad} kW</span>
            </div>
            <input 
              type="range" 
              min={0} max={1500} step={50} 
              value={addedEVLoad} 
              onChange={e => setAddedEVLoad(Number(e.target.value))} 
              className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 kW (No load)</span>
              <span>500 kW (Med Station)</span>
              <span>1000 kW (Large Hub)</span>
              <span>1500 kW (Hyper Hub)</span>
            </div>

            <div className="border-t border-dark-600/40 pt-3 mt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">Grid Impact Rationale:</span>
              Adding a simulated charger capacity of <strong className="text-white">{addedEVLoad} kW</strong> raises the peak power requirement on the <strong className="text-white">FDR-{selectedPincode.pincode.slice(0, 3)}</strong> feeder. Shift to night slots to mitigate stress.
            </div>
          </div>

          {/* Readout stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-600/20 text-center">
              <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Simulated Feeder Peak</div>
              <div className="text-2xl font-bold text-white">{simulatedPeakDemand} kW</div>
              <div className="text-[10px] text-slate-500 mt-1">Base: {selectedBasePeak} kW</div>
            </div>

            <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-600/20 text-center">
              <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Simulated Utilization</div>
              <div className={`text-2xl font-bold ${simulatedUtilization > 80 ? 'text-red-400' : simulatedUtilization > 60 ? 'text-amber-400' : 'text-brand'}`}>
                {simulatedUtilization}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Feeder Limit: {selectedCapacityKw} kW</div>
            </div>

            <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-600/20 text-center">
              <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">GNN Stability Rating</div>
              <div className={`text-2xl font-bold ${gnnStabilityScore < 50 ? 'text-red-400' : gnnStabilityScore < 75 ? 'text-amber-400' : 'text-brand'}`}>
                {gnnStabilityScore}/100
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {gnnStabilityScore < 50 ? 'Critical Cascade Risk' : gnnStabilityScore < 75 ? 'Moderate Cascade Risk' : 'Highly Resilient'}
              </div>
            </div>

            <div className="bg-dark-900/40 p-4 rounded-xl border border-dark-600/20 text-center flex flex-col items-center justify-center">
              <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Recommended Action</div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                simulatedStressLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                simulatedStressLevel === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-brand/20 text-brand border border-brand/30'
              }`}>
                {simulatedStressLevel === 'Critical' ? 'BESS Deploy / Halt' :
                 simulatedStressLevel === 'Warning' ? 'Dynamic TOU Tariff' :
                 'Approved for Fast EV'}
              </span>
              <span className="text-[9px] text-slate-500 mt-1">
                {simulatedStressLevel === 'Critical' ? 'Battery storage required' :
                 simulatedStressLevel === 'Warning' ? 'Shift loads off-peak' :
                 'Safe for expansion'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Chart showing Base vs Simulated demand */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} unit=" kW" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="baseDemand" name="Base Feeder Demand" stroke="#10b981" strokeWidth={2} fill="url(#colorBase)" />
              <Area type="monotone" dataKey="simulatedDemand" name="Simulated Demand (Base + EV Load)" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSimulated)" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="capacity" name="Transformer Capacity Threshold" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 6" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid Stress Table */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-white">Zone Feeder Stress Ranking (All Substation Segments)</h2>
            <p className="text-[11px] text-slate-500">Sorted by highest peak utilization rate</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-dark-900 px-3 py-1 rounded border border-dark-600/30">
            <TrendingUp size={14} className="text-red-400" />
            <span>Feeder Risk Index</span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-dark-800 z-10">
              <tr className="text-left border-b border-dark-600">
                <th className="py-2.5 px-3 text-slate-400 text-xs">#</th>
                <th className="py-2.5 px-3 text-slate-400 text-xs">Substation / Zone</th>
                <th className="py-2.5 px-3 text-slate-400 text-xs">Peak Base Load</th>
                <th className="py-2.5 px-3 text-slate-400 text-xs">Feeder Limit</th>
                <th className="py-2.5 px-3 text-slate-400 text-xs">Base Util.</th>
                <th className="py-2.5 px-3 text-slate-400 text-xs">Status Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {zoneStressData.map((z, i) => (
                <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                  <td className="py-3 px-3 text-slate-500 text-xs">{i+1}</td>
                  <td className="py-3 px-3 text-white font-medium text-xs">{z.zone}</td>
                  <td className="py-3 px-3 text-slate-300 text-xs">{z.peakDemand.toLocaleString()} kW</td>
                  <td className="py-3 px-3 text-slate-300 text-xs">{z.capacity.toLocaleString()} kW</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className={`h-full ${z.utilization > 80 ? 'bg-red-500' : z.utilization > 60 ? 'bg-amber-500' : 'bg-brand'}`} style={{width:`${Math.min(z.utilization,100)}%`}} />
                      </div>
                      <span className="text-xs text-slate-300 font-semibold">{z.utilization}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                      z.stressLevel === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/10' : 
                      z.stressLevel === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' : 
                      'bg-brand/20 text-brand border border-brand/10'
                    }`}>
                      {z.stressLevel.toUpperCase()}
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
