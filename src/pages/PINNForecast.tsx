import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts'
import { FlaskConical, Thermometer, CloudRain, TrendingDown, Info, Sliders, Cpu, ArrowRight } from 'lucide-react'

// Simulated Physics-Informed Neural Network prediction
// Employs a deterministic function based on index to avoid chaotic chart jumps during slider drags
function simulatePINN(forecasts: any[], weatherScenario: string, lambdaWeight: number) {
  const tempMultiplier = weatherScenario === 'heatwave' ? 1.18 : weatherScenario === 'monsoon' ? 1.09 : 1.0

  return forecasts.map((f, idx) => {
    const baseDemand = f.predictedDemandKw
    // Actual grid demand under weather anomalies
    const weatherDemand = baseDemand * tempMultiplier
    const noise = Math.sin(idx * 1.5) * 0.04
    const actualDemand = weatherDemand * (1 + noise)

    // Standard DNN prediction (doesn't know about physics/weather constraints)
    // Runs with high noise and standard deviation due to out-of-distribution weather
    const standardNoise = Math.cos(idx * 2.1) * 0.15
    const standardPred = baseDemand * (1 + standardNoise)
    const standardError = Math.abs(standardPred - actualDemand)

    // PINN prediction uses physics loss regularization (L_physics = V - IR violations + power balance violations).
    // As lambdaWeight increases, the physics engine regularizes standard learning toward physical boundaries.
    const pinnNoiseFactor = 0.08 * (1 - lambdaWeight * 0.85)
    const pinnNoise = Math.sin(idx * 0.9) * pinnNoiseFactor
    const pinnPred = actualDemand * (1 + pinnNoise)
    const pinnError = Math.abs(pinnPred - actualDemand)

    return {
      hour: `${f.hour}:00`,
      actual: Math.round(actualDemand),
      standard: Math.round(standardPred),
      pinn: Math.round(pinnPred),
      standardMAE: Math.round(standardError),
      pinnMAE: Math.round(pinnError),
    }
  })
}

export default function PINNForecast() {
  const { pincodes } = MOCK_DB
  const forecasts = pincodes[0]?.forecasts || []
  
  const [scenario, setScenario] = useState<'normal' | 'heatwave' | 'monsoon'>('heatwave')
  const [lambda, setLambda] = useState<number>(0.6) // Slider value 0.0 - 1.0

  const data = simulatePINN(forecasts, scenario, lambda)

  const stdMAE = Math.round(data.reduce((s, d) => s + d.standardMAE, 0) / data.length)
  const pinnMAE = Math.round(data.reduce((s, d) => s + d.pinnMAE, 0) / data.length)
  const improvement = stdMAE > 0 ? Math.round((1 - pinnMAE / stdMAE) * 100) : 0

  const errorComparison = [
    { hour: 'Peak (18-22)', Standard: Math.round(stdMAE * 1.4), PINN: Math.round(pinnMAE * 0.8) },
    { hour: 'Morning (7-9)', Standard: Math.round(stdMAE * 1.1), PINN: Math.round(pinnMAE * 0.9) },
    { hour: 'Night (23-5)', Standard: Math.round(stdMAE * 0.7), PINN: Math.round(pinnMAE * 1.0) },
    { hour: 'Overall MAE', Standard: stdMAE, PINN: pinnMAE },
  ]

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">PINN Extreme Weather Forecasting</h1>
        <p className="text-slate-400 mt-1">Physics-Informed Neural Networks embed Ohm's Law and power balance equations directly into deep learning models</p>
      </motion.div>

      {/* Weather Scenario & Physics Slider Controls */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6 border border-dark-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Scenario selector */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 block font-semibold uppercase">1. Grid Weather Scenario</span>
            <div className="flex flex-wrap gap-2">
              {(['normal', 'heatwave', 'monsoon'] as const).map(s => (
                <button 
                  key={s} 
                  onClick={() => setScenario(s)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    scenario === s 
                      ? 'bg-brand/10 text-brand border-brand/30 shadow-lg' 
                      : 'bg-dark-900 text-slate-400 border-dark-600 hover:border-slate-500'
                  }`}
                >
                  {s === 'heatwave' ? '🔥 Heatwave (+18% Load)' : s === 'monsoon' ? '🌧️ Monsoon (+9% Load)' : '☀️ Normal Load'}
                </button>
              ))}
            </div>
          </div>

          {/* Lambda physics weight slider */}
          <div className="flex-1 max-w-md bg-dark-900/60 p-4 rounded-xl border border-dark-600/50 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Sliders size={14} className="text-brand" /> Physics Loss Weight (λ)
                </span>
                <strong className="text-brand text-sm">{lambda.toFixed(2)}</strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={lambda} 
                onChange={e => setLambda(Number(e.target.value))} 
                className="w-full accent-brand cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                λ=0.0 (Pure ML Model) &nbsp;|&nbsp; λ=1.0 (Strict Conservation Laws)
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Formula Display */}
        <div className="mt-4 p-4 bg-dark-950 rounded-xl border border-dark-700/80 font-mono text-xs space-y-2">
          <div className="text-slate-500 uppercase text-[10px] font-sans font-semibold">Active Mathematical Objective Function</div>
          <div className="text-white break-all">
            Loss = L_data + <span className="text-brand font-bold">{(lambda).toFixed(2)}</span> × L_physics
            &nbsp; &nbsp; where L_physics = || V - I·R ||² + || P_gen - (P_load + P_loss) ||²
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Standard DNN MAE', value: `${stdMAE} kW`, icon: FlaskConical, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'PINN MAE (Physics)', value: `${pinnMAE} kW`, icon: FlaskConical, color: 'text-brand', bg: 'bg-brand/10' },
          { label: 'Error Reduction', value: `−${improvement}%`, icon: TrendingDown, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Active Regularization', value: lambda === 0 ? 'Disabled' : lambda > 0.7 ? 'Strong Constraint' : 'Moderate Constraint', icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-5 border border-dark-700/50">
            <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={18} /></div><span className="text-xs text-slate-400">{m.label}</span></div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* PINN Model Block Diagram */}
      <motion.div variants={item} className="glass-panel border-blue-500/10 bg-dark-900/30 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-blue-400" /> Interactive PINN Model Architecture
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono p-4 bg-dark-950 rounded-xl border border-dark-700/50">
          <div className="flex flex-col items-center p-3 bg-dark-900 border border-dark-700 rounded-lg w-full md:w-auto">
            <span className="text-[10px] text-slate-500">INPUT DATA</span>
            <span className="text-white mt-1">Time, Temp, History</span>
          </div>
          <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex flex-col items-center p-3 bg-dark-900 border border-dark-700 rounded-lg w-full md:w-auto text-center">
            <span className="text-[10px] text-slate-500">NEURAL NET (DNN)</span>
            <span className="text-white mt-1">Learns Data Mappings</span>
            <span className="text-[9px] text-red-400 mt-0.5">High Error under extreme load sags</span>
          </div>
          <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex flex-col items-center p-3 bg-dark-900 border border-brand/30 rounded-lg w-full md:w-auto text-center">
            <span className="text-[10px] text-brand uppercase font-sans font-semibold">Physics Loss Penalty</span>
            <span className="text-white mt-1">Enforces Kirchhoff & Ohm Laws</span>
            <span className="text-[9px] text-brand mt-0.5">Penalizes non-physical predictions</span>
          </div>
          <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex flex-col items-center p-3 bg-dark-900 border border-blue-500/30 rounded-lg w-full md:w-auto">
            <span className="text-[10px] text-blue-400">REGULARIZED FORECAST</span>
            <span className="text-white mt-1 font-sans font-bold">Stable & Clean Predictions</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">PINN vs Standard Forecast — 24h Timeline</h2>
          <p className="text-xs text-slate-400 mb-6">Simulating demand forecasting during a {scenario === 'heatwave' ? 'Heatwave' : scenario === 'monsoon' ? 'Monsoon' : 'Normal day'}.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v} kW`} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" name="Actual Load Profile" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="pinn" name="PINN Forecast" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="standard" name="Standard DNN" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2">Error Comparison by Time Window</h2>
          <p className="text-xs text-slate-400 mb-6">Evaluating model accuracy (MAE) metrics during peak coincidences.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorComparison} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v} kW`} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Standard" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PINN" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Physics guide panel */}
      <motion.div variants={item} className="glass-panel bg-gradient-to-r from-dark-800 to-brand/5 border-brand/10 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={16} className="text-brand" /> Detailed Physics-Informed Forecasting Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-300">
          <div className="space-y-2">
            <span className="font-semibold text-brand">1. Physics Loss vs Data Loss</span>
            <p className="text-slate-400">
              Standard neural networks only try to fit historical training data points (L_data). When weather conditions shift out-of-distribution (like record heatwaves), they make wild, physically impossible demand predictions. PINNs add a regularizer (L_physics) that forces predictions to respect grid topology equations.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-blue-400">2. Power Flow Balance Constraints</span>
            <p className="text-slate-400">
              The physics engine constraints demand prediction using power flow balance equations (P_gen = P_load + P_losses). If a prediction violates the conservation of energy principle across a radial distribution network, the loss penalty increases, guiding the network back to consistency.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-purple-400">3. Practical Utility Impact</span>
            <p className="text-slate-400">
              By enforcing physics constraints, MPPKVVCL dispatchers get highly accurate peak forecasts during storms or heatwaves. This prevents premature load-shedding triggers and enables smooth coordination of virtual power plant reserves.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
