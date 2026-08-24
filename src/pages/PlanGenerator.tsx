import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Loader2, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { optimize } from '../lib/optimizer'
import { MOCK_DB } from '../data/mock-db'
import { formatInr } from '../lib/utils'

export default function PlanGenerator() {
  const navigate = useNavigate()
  const [budgetCr, setBudgetCr] = useState(5)
  const [maxPayback, setMaxPayback] = useState(18)
  const [targetCount, setTargetCount] = useState(15)
  const [district, setDistrict] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<null | any>(null)

  function run() {
    setRunning(true)
    
    // Simulate network delay for the UX of "running AI"
    setTimeout(() => {
      try {
        const optimized = optimize(
          {
            budgetInr: budgetCr * 10_000_000,
            maxPaybackMonths: maxPayback,
            targetCount,
            focusDistrict: district || undefined,
          },
          MOCK_DB.pincodes,
          MOCK_DB.hotspots,
          MOCK_DB.stations
        )

        // Generate proposal structure matching database schema
        const newProposals = optimized.proposals.map((p, i) => {
          const pincode = MOCK_DB.pincodes.find(pin => pin.id === p.pincodeId)!
          const statuses = [
            ...Array(8).fill('PROPOSED'),
            ...Array(3).fill('SHORTLISTED'),
            ...Array(2).fill('APPROVED'),
            ...Array(2).fill('DEPLOYED'),
          ]
          return {
            ...p,
            id: `opt_id_${Date.now()}_${i}`,
            recommendedTypes: JSON.stringify(p.recommendedTypes),
            status: statuses[i] ?? 'PROPOSED',
            createdAt: new Date(),
            pincode
          }
        })

        // Persist back to the in-memory singleton
        MOCK_DB.proposals.length = 0
        MOCK_DB.proposals.push(...newProposals)

        setResult(optimized)
      } finally {
        setRunning(false)
      }
    }, 1500)
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white mb-1">Generate Charging Plan</h1>
        <p className="text-slate-400">Configure constraints; the AI optimizer will propose the best sites avoiding grid stress.</p>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-8 space-y-8">
        <Slider label="Budget" value={budgetCr} min={1} max={20} step={0.5} onChange={setBudgetCr} display={`₹${budgetCr.toFixed(1)} Cr`} />
        <Slider label="Maximum Payback Limit" value={maxPayback} min={6} max={36} step={1} onChange={setMaxPayback} display={`${maxPayback} months`} />
        <Slider label="Target Proposal Count" value={targetCount} min={5} max={30} step={1} onChange={setTargetCount} display={`${targetCount} sites`} />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Focus District (optional)</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="e.g., Indore Urban"
              className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-light disabled:bg-brand/50 disabled:text-white/50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
          {running ? 'Running greedy optimizer & feeder load simulation…' : 'Run Optimization'}
        </button>
      </motion.div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel border-brand/50 rounded-xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-blue-500"></div>
          <h2 className="font-semibold text-white mb-6 text-lg">Optimization Complete</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Metric label="Proposals Generated" value={result.proposals.length.toString()} />
            <Metric label="Total CAPEX Required" value={`₹${(result.totalInvestment / 10_000_000).toFixed(2)} Cr`} />
            <Metric label="Projected Revenue (Yr 1)" value={`₹${(result.totalRevenueYr1Inr / 10_000_000).toFixed(2)} Cr`} />
          </div>

          <div className="border-t border-dark-600/40 my-6 pt-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5">
              <Zap size={16} className="text-brand" /> Generated Proposal Sites Preview
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-dark-600">
              {result.proposals.map((p: any, idx: number) => {
                const pincode = MOCK_DB.pincodes.find(pin => pin.id === p.pincodeId);
                const areaName = pincode ? pincode.area : 'Unknown Area';
                const pinCode = pincode ? pincode.pincode : '000000';
                return (
                  <div key={idx} className="bg-dark-900/60 border border-dark-600/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{areaName}</span>
                        <span className="text-[10px] text-slate-500 bg-dark-800 px-1.5 py-0.2 rounded border border-dark-700">{pinCode}</span>
                        <span className="text-[10px] text-slate-400 bg-brand/10 text-brand px-1.5 py-0.2 rounded font-mono">{p.feederCode}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span>Category: <strong className="text-slate-300">{p.category.replace('_', ' ')}</strong></span>
                        <span>Ports: <strong className="text-slate-300">{p.recommendedPorts}</strong></span>
                        <span>Feeder Load: <strong className="text-red-400">{p.feederImpactPct}%</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[10px] text-slate-500">Payback</div>
                        <div className="font-semibold text-white">{p.paybackMonths} mo</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Est. Revenue</div>
                        <div className="font-semibold text-brand">₹{(p.estimatedRevenueInrPerMonth / 1000).toFixed(1)}k/mo</div>
                      </div>
                      <div className="bg-brand/10 px-2 py-1 rounded text-center">
                        <div className="text-[9px] text-brand font-medium">Score</div>
                        <div className="font-bold text-brand text-xs">{(p.siteScore * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/map')}
              className="flex-1 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-sm font-medium hover:bg-dark-600 transition-colors text-white"
            >
              View Placements on Map
            </button>
            <button
              onClick={() => navigate('/proposals')}
              className="flex-1 py-3 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Review All Proposals
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function Slider({ label, value, min, max, step, onChange, display }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm font-bold text-brand">{display}</span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} 
        value={value} 
        onChange={e => onChange(Number(e.target.value))} 
        className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
      />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400 font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
