import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Shield, MapPin, Search, Sparkles, Loader2, Info, Sliders, CheckCircle } from 'lucide-react'
import { askGemini } from '../lib/gemini'

function getGrade(score: number) {
  if (score >= 80) return { grade: 'A', color: '#10b981', label: 'EV-Ready' }
  if (score >= 60) return { grade: 'B', color: '#3b82f6', label: 'Developing' }
  if (score >= 40) return { grade: 'C', color: '#f59e0b', label: 'Needs Investment' }
  return { grade: 'D', color: '#ef4444', label: 'Underserved' }
}

export default function CommunityScore() {
  const { pincodes, stations } = MOCK_DB
  const [search, setSearch] = useState('')

  // Sliders for dynamic weights
  const [wDensity, setWDensity] = useState<number>(40)
  const [wHeadroom, setWHeadroom] = useState<number>(30)
  const [wTransit, setWTransit] = useState<number>(20)
  const [wIncome, setWIncome] = useState<number>(10)

  // CCS Advisor States
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [recs, setRecs] = useState<Record<string, string>>({})
  const [loadingRecs, setLoadingRecs] = useState<Record<string, boolean>>({})

  // Compute CCS score dynamically for a zone
  const getDeterministicTransit = (areaName: string) => {
    let sum = 0
    for (let i = 0; i < areaName.length; i++) {
      sum += areaName.charCodeAt(i)
    }
    return 35 + (sum % 56) // Deterministic value between 35 and 90
  }

  const computeCCS = (pincode: any) => {
    const nearbyChargers = stations.filter(s => s.pincodeId === pincode.id).length
    const chargerDensityIndex = Math.min((nearbyChargers / 3) * 100, 100)
    const gridHeadroom = ((pincode.availableCapacityMW * 1000 - pincode.peakDemandMW * 1000) / (pincode.availableCapacityMW * 1000)) * 100
    const transitProximity = getDeterministicTransit(pincode.area)
    const incomeProxy = 30 + pincode.evAdoptionIndex * 70

    const totalWeight = wDensity + wHeadroom + wTransit + wIncome
    if (totalWeight === 0) return 0

    const score = (
      wDensity * chargerDensityIndex + 
      wHeadroom * Math.max(gridHeadroom, 0) + 
      wTransit * transitProximity + 
      wIncome * incomeProxy
    ) / totalWeight
    
    return Math.round(score)
  }

  const zoneScores = pincodes.map(p => {
    const ccs = computeCCS(p)
    const g = getGrade(ccs)
    return { ...p, ccs, ...g }
  }).sort((a, b) => b.ccs - a.ccs)

  const filtered = zoneScores.filter(z => z.area.toLowerCase().includes(search.toLowerCase()) || z.pincode.includes(search))

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 }
  zoneScores.forEach(z => gradeCounts[z.grade as keyof typeof gradeCounts]++)
  
  const gradeData = [
    { grade: 'A — EV-Ready', count: gradeCounts.A, fill: '#10b981' },
    { grade: 'B — Developing', count: gradeCounts.B, fill: '#3b82f6' },
    { grade: 'C — Needs Investment', count: gradeCounts.C, fill: '#f59e0b' },
    { grade: 'D — Underserved', count: gradeCounts.D, fill: '#ef4444' },
  ]

  const avgCCS = Math.round(zoneScores.reduce((s, z) => s + z.ccs, 0) / zoneScores.length)

  // Compute live equation percentages for rendering
  const sumWeights = wDensity + wHeadroom + wTransit + wIncome
  const densityPercent = sumWeights > 0 ? Math.round((wDensity / sumWeights) * 100) : 0
  const headroomPercent = sumWeights > 0 ? Math.round((wHeadroom / sumWeights) * 100) : 0
  const transitPercent = sumWeights > 0 ? Math.round((wTransit / sumWeights) * 100) : 0
  const incomePercent = sumWeights > 0 ? Math.round((wIncome / sumWeights) * 100) : 0

  async function handleAIRecommendations(zone: any) {
    if (activeZoneId === zone.id) {
      setActiveZoneId(null)
      return
    }
    setActiveZoneId(zone.id)
    if (recs[zone.id]) return

    setLoadingRecs(prev => ({ ...prev, [zone.id]: true }))
    try {
      const prompt = `Give specific advisory recommendations for improving the Community Charging Score (CCS) for the area: ${zone.area} (Pincode: ${zone.pincode}, District: ${zone.district}).
The current metrics are:
- Current CCS: ${zone.ccs}
- Grade: ${zone.grade} (${zone.label})
- Peak Demand: ${zone.peakDemandMW} MW
- Available capacity: ${zone.availableCapacityMW} MW
- Current Equation weight allocation: Charger Density: ${densityPercent}%, Grid Headroom: ${headroomPercent}%, Transit Proximity: ${transitPercent}%, Income index: ${incomePercent}%.
Provide 3 tailored action steps (under 100 words total) focused on charger density, solar integration, and grid reinforcement based on these specific parameter weights.`
      const advice = await askGemini(prompt)
      setRecs(prev => ({ ...prev, [zone.id]: advice }))
    } catch (e) {
      setRecs(prev => ({ ...prev, [zone.id]: 'Failed to generate recommendations.' }))
    } finally {
      setLoadingRecs(prev => ({ ...prev, [zone.id]: false }))
    }
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Community Charging Score (CCS)</h1>
        <p className="text-slate-400 mt-1">Public-facing EV-readiness metric per zone — empowering citizens, RWAs, and planners</p>
      </motion.div>

      {/* Dynamic Equation and Weights Sandbox */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6 border border-dark-700/50">
        <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
          <Sliders size={18} className="text-brand" /> CCS Weights Customization Sandbox
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Adjust the priority weights below. The overall scores, grades, chart distribution, and AI recommendations will update in real-time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Charger Density</span>
              <span className="text-brand">{densityPercent}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={wDensity} 
              onChange={e => setWDensity(Number(e.target.value))} 
              className="w-full accent-brand cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Existing public chargers per sq km</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Grid Headroom</span>
              <span className="text-blue-400">{headroomPercent}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={wHeadroom} 
              onChange={e => setWHeadroom(Number(e.target.value))} 
              className="w-full accent-blue-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Unused transformer feeder capacity</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Transit Proximity</span>
              <span className="text-amber-400">{transitPercent}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={wTransit} 
              onChange={e => setWTransit(Number(e.target.value))} 
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Distance to main corridors/metro hubs</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Income & EV Adoption</span>
              <span className="text-purple-400">{incomePercent}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={wIncome} 
              onChange={e => setWIncome(Number(e.target.value))} 
              className="w-full accent-purple-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Relative vehicle ownership potential</span>
          </div>
        </div>

        <div className="bg-dark-950 p-4 rounded-xl border border-dark-700/80 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Live CCS Formula</span>
            <div className="text-white text-sm break-all">
              CCS = <span className="text-brand">{(densityPercent/100).toFixed(2)}</span> × Density + <span className="text-blue-400">{(headroomPercent/100).toFixed(2)}</span> × Headroom + <span className="text-amber-400">{(transitPercent/100).toFixed(2)}</span> × Transit + <span className="text-purple-400">{(incomePercent/100).toFixed(2)}</span> × Adoption
            </div>
          </div>
          <div className="flex gap-6 shrink-0 border-t md:border-t-0 md:border-l border-dark-700/80 pt-3 md:pt-0 md:pl-6">
            {[
              { label: 'Avg CCS', value: avgCCS, color: 'text-brand' },
              { label: 'EV-Ready Zones', value: gradeCounts.A, color: 'text-brand' },
              { label: 'Underserved', value: gradeCounts.D, color: 'text-red-400' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Grade Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Pincode split by readiness categories under current weightings</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="grade" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Zone Scores Table */}
        <motion.div variants={item} className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-white">Zone Scores & Grading</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time calculations for individual MPPKVVCL feeders (Indore)</p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="Filter by area or pincode" 
                className="w-full pl-9 pr-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand" 
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[350px] space-y-2 flex-1 pr-1">
            {filtered.map(z => (
              <div key={z.id} className="flex flex-col p-3 bg-dark-900/50 rounded-lg border border-dark-700/50 gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-sm text-white font-medium">{z.area}</div>
                    <div className="text-xs text-slate-500">{z.pincode} · {z.district}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden shrink-0">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${z.ccs}%`, backgroundColor: z.color }} />
                    </div>
                    <span className="text-base font-bold w-6 text-right" style={{ color: z.color }}>{z.ccs}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium w-16 text-center" style={{ backgroundColor: z.color + '20', color: z.color }}>{z.grade}</span>
                    
                    <button
                      onClick={() => handleAIRecommendations(z)}
                      className="px-2.5 py-1 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded border border-brand/20 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Sparkles size={11} />
                      {activeZoneId === z.id ? 'Close' : 'AI Advice'}
                    </button>
                  </div>
                </div>

                {/* CCS Advisor panel */}
                <AnimatePresence>
                  {activeZoneId === z.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-dark-700/50 pt-2 mt-1"
                    >
                      <div className="p-3 bg-dark-900/80 rounded border border-dark-700/50 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {loadingRecs[z.id] ? (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 size={12} className="animate-spin text-brand" />
                            Analyzing zone infrastructure and drafting recommendation brief...
                          </div>
                        ) : (
                          recs[z.id]
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Educational Glossary for Community Members */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={16} className="text-brand" /> Community Metrics Definition Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-dark-900/40 rounded-lg space-y-1">
            <span className="font-semibold text-brand">1. Charger Density</span>
            <p className="text-slate-400">
              The concentration of functional AC/DC charging guns in the zone. High density reduces search times and queues, raising civic score.
            </p>
          </div>
          <div className="p-3 bg-dark-900/40 rounded-lg space-y-1">
            <span className="font-semibold text-blue-400">2. Grid Headroom</span>
            <p className="text-slate-400">
              Available power margin at regional substations during peak hours. High headroom means the grid can host new chargers without tripping safety relays.
            </p>
          </div>
          <div className="p-3 bg-dark-900/40 rounded-lg space-y-1">
            <span className="font-semibold text-amber-400">3. Transit Proximity</span>
            <p className="text-slate-400">
              Proximity to national highways, commuter train lines, and major ring roads. Chargers near transit serve commercial and logistics fleets.
            </p>
          </div>
          <div className="p-3 bg-dark-900/40 rounded-lg space-y-1">
            <span className="font-semibold text-purple-400">4. Income & Adoption</span>
            <p className="text-slate-400">
              A composite proxy of demographic income and EV purchase rates. Predicts immediate domestic charging demand and charger usage likelihood.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
