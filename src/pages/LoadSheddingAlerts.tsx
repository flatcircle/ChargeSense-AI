import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { AlertTriangle, Shield, Siren, Radio, CheckCircle, Sparkles, Loader2, Cpu, Activity, Thermometer } from 'lucide-react'
import { askGemini } from '../lib/gemini'

interface Alert { 
  id: string 
  zone: string 
  pincode: string 
  level: '90%' | '95%' 
  timestamp: Date 
  message: string 
  resolved: boolean 
  // Simulated telemetry characteristics
  telemetry: {
    current: number // Amps
    voltage: number // Volts
    powerFactor: number // cos phi
    thermalDegradation: number // theta scale
    thd: number // Total Harmonic Distortion %
  }
}

function generateAlerts(pincodes: any[]): Alert[] {
  const alerts: Alert[] = []
  pincodes.forEach(p => {
    const peakF = p.forecasts.reduce((a: any, b: any) => a.predictedDemandKw > b.predictedDemandKw ? a : b)
    const util = peakF.predictedDemandKw / (p.availableCapacityMW * 1000)
    
    // Deterministic telemetry generator based on pincode available capacity
    const currentBase = Math.round(util * 400)
    const voltageSag = Math.round(415 - util * 20)
    const pf = Math.round((0.95 - util * 0.08) * 100) / 100
    const theta = Math.round((1.0 + util * 0.4) * 100) / 100
    const thdVal = Math.round((5 + util * 10) * 10) / 10

    if (util > 0.9) {
      alerts.push({ 
        id: `a-${p.id}-95`, 
        zone: p.area, 
        pincode: p.pincode, 
        level: '95%', 
        timestamp: new Date(Date.now() - Math.random() * 3600000), 
        message: `CRITICAL: Auto-prioritize emergency-route chargers, throttle residential loads in ${p.area}`, 
        resolved: false,
        telemetry: { current: currentBase + 50, voltage: voltageSag - 5, powerFactor: pf - 0.02, thermalDegradation: theta + 0.1, thd: thdVal + 1.5 }
      })
    }
    if (util > 0.8) {
      alerts.push({ 
        id: `a-${p.id}-90`, 
        zone: p.area, 
        pincode: p.pincode, 
        level: '90%', 
        timestamp: new Date(Date.now() - Math.random() * 7200000), 
        message: `WARNING: Send SMS to EV users on feeder ${p.pincode} — unplug non-essential vehicles`, 
        resolved: Math.random() > 0.5,
        telemetry: { current: currentBase, voltage: voltageSag, powerFactor: pf, thermalDegradation: theta, thd: thdVal }
      })
    }
  })
  return alerts.sort((a, b) => (a.level === '95%' ? 0 : 1) - (b.level === '95%' ? 0 : 1))
}

export default function LoadSheddingAlerts() {
  const { pincodes } = MOCK_DB
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts(pincodes))

  // Alert Explanation States
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const [reports, setReports] = useState<Record<string, string>>({})
  const [loadingReport, setLoadingReport] = useState<Record<string, boolean>>({})
  const [showTelemetryId, setShowTelemetryId] = useState<string | null>(null)

  async function handleAIReport(alert: Alert) {
    if (activeReportId === alert.id) {
      setActiveReportId(null)
      return
    }
    setActiveReportId(alert.id)
    if (reports[alert.id]) return

    setLoadingReport(prev => ({ ...prev, [alert.id]: true }))
    try {
      const prompt = `Write a formal, detailed MPPKVVCL incident report for a power load alert in ${alert.zone} (${alert.pincode}), Indore.
The alert details are:
- Level: ${alert.level} capacity utilization on local feeder.
- Initial Trigger: ${alert.message}
- Feeder Telemetry: Current ${alert.telemetry.current}A, Voltage ${alert.telemetry.voltage}V (nom: 415V), THD-I ${alert.telemetry.thd}%, Pf ${alert.telemetry.powerFactor}, Thermal Aging factor ${alert.telemetry.thermalDegradation}x.
Provide a plain-English explanation of why this happened, the grid consequences (transformer strain, voltage fluctuations, safety hazards), and 3 specific actions that the utility and local residents should take to remediate the issue. Keep it professional and structured.`
      const explanation = await askGemini(prompt)
      setReports(prev => ({ ...prev, [alert.id]: explanation }))
    } catch (e) {
      setReports(prev => ({ ...prev, [alert.id]: 'Failed to generate incident report.' }))
    } finally {
      setLoadingReport(prev => ({ ...prev, [alert.id]: false }))
    }
  }

  function resolve(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))
  }

  const critical = alerts.filter(a => a.level === '95%' && !a.resolved).length
  const warnings = alerts.filter(a => a.level === '90%' && !a.resolved).length
  const resolved = alerts.filter(a => a.resolved).length

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Dynamic Load Shedding Alerts</h1>
        <p className="text-slate-400 mt-1">Prioritized charger protection with tiered alerts to prevent transformer blowouts</p>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Critical (≥95%)', value: critical, icon: Siren, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-500/30' },
          { label: 'Warning (≥90%)', value: warnings, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' },
          { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-brand', bg: 'bg-brand/10', border: 'border-brand/30' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className={`glass-card rounded-xl p-5 border ${m.border}`}>
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Grid Protection & Dynamics Tutorial Card */}
      <motion.div variants={item} className="glass-panel border-brand/20 bg-gradient-to-r from-dark-800 to-brand/5 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Shield size={18} className="text-brand" /> Smart Grid Protection & Coincidence Safeguards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-dark-900/60 rounded-lg border border-dark-600/50">
            <span className="text-[11px] font-semibold text-brand block mb-1">Grid Voltage Sags</span>
            <p className="text-slate-400">
              When too many chargers draw power simultaneously on a single feeder circuit, the grid voltage drops below the nominal 415V (measured here as high as a 5% drop). This reduces power quality and damages residential appliances.
            </p>
          </div>
          <div className="p-3 bg-dark-900/60 rounded-lg border border-dark-600/50">
            <span className="text-[11px] font-semibold text-amber-400 block mb-1">Harmonic Distortion (THD-I)</span>
            <p className="text-slate-400">
              EV fast-charging hubs use large non-linear switch-mode rectifiers that introduce high-frequency current harmonics back into the feeder. High THD values (exceeding IEEE-519 standards of 5%) lead to overheating transformers.
            </p>
          </div>
          <div className="p-3 bg-dark-900/60 rounded-lg border border-dark-600/50">
            <span className="text-[11px] font-semibold text-red-400 block mb-1">Transformer Thermal Aging</span>
            <p className="text-slate-400">
              Transformer oil heat increases exponentially with overloading. An insulation aging factor of 1.4x means the cellulose insulation paper degrades 40% faster, cutting a 30-year transformer's lifespan down to under a decade.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Alert Protocol</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-amber-400" /><span className="text-sm font-semibold text-amber-400">Tier 1 — 90% Utilization</span></div>
            <p className="text-xs text-slate-300">SMS/App push to MPPKVVCL field teams + EV users to unplug non-essential vehicles from the feeder.</p>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2"><Siren size={16} className="text-red-400" /><span className="text-sm font-semibold text-red-400">Tier 2 — 95% Utilization</span></div>
            <p className="text-xs text-slate-300">Auto-prioritize power to emergency-route chargers (hospitals, fire stations) and V2G-enabled chargers. Throttle non-critical residential loads.</p>
          </div>
        </div>

        <h2 className="font-semibold text-white mb-4">Live Alert Feed</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map(a => (
            <div key={a.id} className="flex flex-col p-4 bg-dark-900/40 border border-dark-700/50 rounded-lg space-y-3">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${a.level === '95%' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'}`}>
                  {a.level === '95%' ? <Siren size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{a.zone}</span>
                    <span className="text-xs text-slate-500">{a.pincode}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.level === '95%' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{a.level}</span>
                    {a.resolved && <span className="text-xs px-2 py-0.5 rounded-full bg-brand/20 text-brand">Resolved</span>}
                  </div>
                  <p className="text-xs text-slate-300">{a.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{a.timestamp.toLocaleTimeString()}</p>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      setShowTelemetryId(showTelemetryId === a.id ? null : a.id)
                    }}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Activity size={12} />
                    {showTelemetryId === a.id ? 'Close Telemetry' : 'Telemetry Logs'}
                  </button>

                  <button 
                    onClick={() => handleAIReport(a)}
                    className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded-lg border border-brand/20 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Sparkles size={12} />
                    {activeReportId === a.id ? 'Close Report' : '✨ AI Report'}
                  </button>
                  
                  {!a.resolved && (
                    <button onClick={() => resolve(a.id)} className="px-3 py-1.5 bg-dark-700 hover:bg-brand/20 text-slate-400 hover:text-brand text-xs rounded-lg transition-colors border border-dark-600 hover:border-brand/30 shrink-0">
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>

              {/* Diagnostic Telemetry Logs Panel */}
              <AnimatePresence>
                {showTelemetryId === a.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-dark-950 border border-blue-500/20 rounded-lg text-xs font-mono grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <span className="text-slate-500 block">CURRENT DRAW</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Activity size={12} className="text-blue-400" />
                          {a.telemetry.current} A
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">VOLTAGE</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Cpu size={12} className="text-purple-400" />
                          {a.telemetry.voltage} V <span className="text-[10px] text-red-400">({Math.round((a.telemetry.voltage/415 - 1)*100)}%)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">POWER FACTOR</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Activity size={12} className="text-amber-400" />
                          {a.telemetry.powerFactor} (cos φ)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">THERMAL AGING</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Thermometer size={12} className="text-red-400" />
                          {a.telemetry.thermalDegradation} x (θ)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">TOTAL HARMONICS</span>
                        <span className="text-sm font-bold text-white flex items-center gap-1 mt-0.5">
                          <Cpu size={12} className="text-brand" />
                          {a.telemetry.thd}% (THD-I)
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Incident Report Panel */}
              <AnimatePresence>
                {activeReportId === a.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-dark-900 border border-dark-700/50 rounded-lg text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                      {loadingReport[a.id] ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 size={14} className="animate-spin text-brand" />
                          Analyzing local grid state and writing incident report...
                        </div>
                      ) : (
                        reports[a.id]
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-5">
        <h2 className="font-semibold text-white mb-2">Projected Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3"><Shield size={16} className="text-brand" /><span className="text-slate-300"><strong className="text-brand">40%</strong> reduction in transformer failure-related outages</span></div>
          <div className="flex items-center gap-3"><Radio size={16} className="text-blue-400" /><span className="text-slate-300"><strong className="text-blue-400">25%</strong> faster emergency response to grid faults via targeted alerts</span></div>
        </div>
      </motion.div>
    </motion.div>
  )
}
