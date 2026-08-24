import { MOCK_DB } from '../data/mock-db'
import { getPeakShiftingRecommendation } from '../lib/forecast'
import { motion } from 'framer-motion'
import { Zap, Clock, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Forecast() {
  const { pincodes } = MOCK_DB

  // Aggregate state-level forecast
  const stateForecast = Array.from({ length: 24 }, (_, hour) => {
    const hourForecasts = pincodes.flatMap(p => p.forecasts.filter(f => f.hour === hour))
    const totalKw = hourForecasts.reduce((sum, f) => sum + f.predictedDemandKw, 0)
    return {
      hour: `${hour}:00`,
      demand: Math.round(totalKw),
      capacity: Math.round(pincodes.reduce((sum, p) => sum + p.availableCapacityMW * 1000, 0))
    }
  })

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-white">Demand Forecasting & Scheduling</h1>
          <p className="text-slate-400 mt-1">Part A — Time-series grid load prediction (Day-Ahead)</p>
        </motion.div>
        <motion.div variants={item} className="px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full flex items-center gap-2">
          <Clock size={14} className="text-brand" />
          <span className="text-xs font-medium text-brand">Live Forecast (Updated 6h ago)</span>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold text-white mb-1">State-Level Aggregate Demand Forecast (Next 24h)</h2>
        <p className="text-sm text-slate-400 mb-6">Hourly predictions across all {pincodes.length} analyzed pincodes</p>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stateForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} kW`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pincodes.slice(0, 4).map(p => {
          const peakForecast = p.forecasts.reduce((prev, current) => 
            (prev.predictedDemandKw > current.predictedDemandKw) ? prev : current
          )
          const recommendation = getPeakShiftingRecommendation(
            peakForecast.hour, 
            peakForecast.predictedDemandKw, 
            p.availableCapacityMW * 1000
          )
          
          const isCritical = recommendation?.includes('CRITICAL')

          return (
            <motion.div key={p.id} variants={item} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">{p.area} ({p.pincode})</h3>
                <div className={`px-2 py-1 rounded text-xs font-medium ${isCritical ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  Peak: {peakForecast.hour}:00
                </div>
              </div>
              
              <div className="h-32 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={p.forecasts.map(f => ({ hour: `${f.hour}:00`, demand: f.predictedDemandKw }))}>
                    <defs>
                      <linearGradient id={`colorDemand-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill={`url(#colorDemand-${p.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {recommendation && (
                <div className={`p-3 rounded-lg flex gap-3 text-xs ${isCritical ? 'bg-red-500/10 text-red-200 border border-red-500/20' : 'bg-amber-500/10 text-amber-200 border border-amber-500/20'}`}>
                  <AlertTriangle size={16} className={`shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                  <p className="leading-relaxed">{recommendation}</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <h3 className="font-semibold text-white mb-2">Smart Scheduling Recommendations</h3>
        <p className="text-sm text-slate-400 mb-6">Optimized windows for commercial fleet and non-essential domestic charging</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-800/80 border border-brand/30 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2"><Zap size={16} className="text-brand/20" /></div>
            <div className="font-bold text-white mb-1">11 PM – 06 AM</div>
            <div className="text-xs text-brand font-medium mb-2 tracking-wide">OPTIMAL WINDOW</div>
            <div className="text-xs text-slate-400 leading-relaxed">Lowest grid stress. 15% Time-of-Use discount applies.</div>
          </div>
          <div className="p-4 bg-dark-800/50 border border-dark-600/50 rounded-lg">
            <div className="font-bold text-white mb-1">06 AM – 06 PM</div>
            <div className="text-xs text-blue-400 font-medium mb-2 tracking-wide">NEUTRAL WINDOW</div>
            <div className="text-xs text-slate-400 leading-relaxed">Normal solar availability. Standard tariffs.</div>
          </div>
          <div className="p-4 bg-dark-800/50 border border-red-500/20 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2"><AlertTriangle size={16} className="text-red-500/20" /></div>
            <div className="font-bold text-white mb-1">06 PM – 11 PM</div>
            <div className="text-xs text-red-400 font-medium mb-2 tracking-wide">PEAK WINDOW</div>
            <div className="text-xs text-slate-400 leading-relaxed">Maximum residential load. Managed charging enforced.</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
