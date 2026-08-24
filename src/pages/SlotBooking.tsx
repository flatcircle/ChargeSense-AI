import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { Calendar, Clock, IndianRupee, Zap, Info, Sparkles, AlertCircle, Award, CheckCircle } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Dynamic tariff schedule details
function getSlotStatus(hour: number, dayIdx: number) {
  const isPeak = hour >= 18 && hour <= 22
  const isMorning = hour >= 7 && hour <= 9
  const isNight = hour >= 23 || hour <= 5
  const isWeekend = dayIdx >= 5
  
  if (isPeak && !isWeekend) {
    return { 
      status: 'premium' as const, 
      price: 18, 
      color: '#ef4444', 
      label: 'Peak Surge (+15%)', 
      discount: -15,
      desc: 'High industrial & domestic load. Discouraged charging window.' 
    }
  }
  if (isNight) {
    return { 
      status: 'discount' as const, 
      price: 12, 
      color: '#10b981', 
      label: 'Off-Peak (−20%)', 
      discount: 20,
      desc: 'Excess wind/hydro generation. Highly encouraged charging window.' 
    }
  }
  return { 
    status: 'normal' as const, 
    price: 15, 
    color: '#60a5fa', 
    label: 'Standard Rate', 
    discount: 0,
    desc: 'Average grid load. Standard grid integration pricing.' 
  }
}

export default function SlotBooking() {
  const { stations } = MOCK_DB
  const [selectedStation, setSelectedStation] = useState(stations[0])
  const [booked, setBooked] = useState<Set<string>>(new Set(['0-23', '0-0', '1-1', '2-2'])) // pre-fill a few for illustration
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTariffSection, setActiveTariffSection] = useState<'tou' | 'coincidence' | 'vpp'>('tou')
  

  // Session Calculator States
  const [batterySize, setBatterySize] = useState(40) // kWh
  const [chargeAmount, setChargeAmount] = useState(60) // % (e.g. 20% to 80%)
  const [chargerPower, setChargerPower] = useState(50) // kW (DC Fast)

  // Session Calculator calculations
  const energyRequiredKwh = (batterySize * chargeAmount) / 100
  const estimatedHours = Number((energyRequiredKwh / chargerPower).toFixed(2))
  const estimatedCostPeak = energyRequiredKwh * 18
  const estimatedCostNormal = energyRequiredKwh * 15
  const estimatedCostOffPeak = energyRequiredKwh * 12
  const maxSavings = estimatedCostPeak - estimatedCostOffPeak
  const peakGridReliefKw = chargerPower
  const sessionCarbonSavedKg = energyRequiredKwh * 0.37 // 0.37 kg saved per kWh by shifting to wind/solar
  

  function toggleBook(key: string) {
    setBooked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const bookedSlots = Array.from(booked)
  const totalCost = bookedSlots.reduce((s, key) => {
    const [d, h] = key.split('-').map(Number)
    return s + getSlotStatus(h, d).price
  }, 0)
  
  const baseCost = bookedSlots.length * 15
  const totalSavings = baseCost - totalCost
  
  // Grid relief contribution: charging during off-peak shifts load away from the grid peak
  const peakSlotsBookedCount = bookedSlots.filter(key => {
    const [d, h] = key.split('-').map(Number)
    return getSlotStatus(h, d).status === 'premium'
  }).length

  const offPeakSlotsBookedCount = bookedSlots.filter(key => {
    const [d, h] = key.split('-').map(Number)
    return getSlotStatus(h, d).status === 'discount'
  }).length

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-600/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-brand" /> Smart Slot Booking & Demand Response
          </h1>
          <p className="text-slate-400 mt-1">
            Grid-incentivized pricing schedules to smooth peak transformer load and reward off-peak charging.
          </p>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 max-w-sm flex gap-2">
          <AlertCircle className="shrink-0" size={16} />
          <span>
            <strong>MPPKVVCL TOU Protocol:</strong> Peak pricing (+15% surge) is active Mon-Fri from 6:00 PM to 10:00 PM. Book off-peak to save money.
          </span>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Selected Station Hub', value: selectedStation.name.substring(0, 18), icon: Zap, color: 'text-brand', desc: `${selectedStation.portCount} Active Ports` },
          { label: 'Booked Time Slots', value: `${booked.size} slots`, icon: Calendar, color: 'text-blue-400', desc: `${(booked.size * 0.5).toFixed(1)} hrs charging duration` },
          { label: 'Estimated Total Cost', value: `₹${totalCost}`, icon: IndianRupee, color: 'text-amber-400', desc: `Standard Cost: ₹${baseCost}` },
          { label: 'Off-Peak Rebates Saved', value: totalSavings >= 0 ? `₹${totalSavings}` : `−₹${Math.abs(totalSavings)}`, icon: Clock, color: totalSavings >= 0 ? 'text-brand' : 'text-red-400', desc: 'Saves money & shifts grid load' },
        ].map(m => (
          <motion.div key={m.label} variants={item} className="glass-card rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">{m.label}</div>
            <div className={`text-xl font-bold ${m.color} mb-1`}>{m.value}</div>
            <div className="text-[10px] text-slate-500">{m.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Grid Tariff Rules Guide Panel */}
      <motion.div variants={item} className="glass-panel border-brand/20 bg-gradient-to-r from-dark-800 to-brand/5 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-dark-600/40 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Info size={16} className="text-brand" /> MPPKVVCL Dynamic Demand Response & Tariff Policy Guide
          </h3>
          <div className="flex flex-wrap gap-1 bg-dark-900/60 p-1 rounded-lg border border-dark-600/50">
            {[
              { id: 'tou', label: 'Time-of-Use Rates' },
              { id: 'coincidence', label: 'Peak Coincidence' },
              { id: 'vpp', label: 'Demand Response & VPP' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTariffSection(tab.id as any)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  activeTariffSection === tab.id
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
          {activeTariffSection === 'tou' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-slate-300 leading-relaxed">
                Time-of-Use (TOU) rates vary based on real-time grid load. Dynamic pricing motivative CPOs and individual drivers to shift heavy charging sessions from critical evening peaks to off-peak or high solar injection windows.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-dark-900/40 rounded-lg border border-red-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-red-400">Peak Surge Rate</span>
                    <span className="text-xs font-bold text-red-400">₹18 / kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mb-2">Hours: 6:00 PM – 10:00 PM</span>
                  <p className="text-[10px] text-slate-400">Disk stress surcharge applied. Designed to suppress concurrent domestic and EV load.</p>
                </div>

                <div className="p-3 bg-dark-900/40 rounded-lg border border-blue-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-blue-400">Standard Rate</span>
                    <span className="text-xs font-bold text-blue-400">₹15 / kWh</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mb-2">Hours: 6:00 AM – 5:00 PM</span>
                  <p className="text-[10px] text-slate-400">Standard tariff. Solar synergy rebates apply during maximum sunlight generation hours.</p>
                </div>

                <div className="p-3 bg-dark-900/40 rounded-lg border border-brand/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-brand">Off-Peak Discount</span>
                    <span className="text-xs font-bold text-brand">₹12 / kWh (−20%)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mb-2">Hours: 11:00 PM – 5:00 AM</span>
                  <p className="text-[10px] text-slate-400">Grid stress relief credit. MPPKVVCL rewards night charging to absorb excess baseload power.</p>
                </div>
              </div>
            </div>
          )}

          {activeTariffSection === 'coincidence' && (
            <div className="space-y-2.5 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                📈 Peak Load Coincidence & Substation Stress
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Coincidence factor refers to the probability that individual electricity consumers will turn on their loads at the same time. The sharpest grid spikes happen during the evening (6:00 PM - 10:00 PM) when households run air conditioners, geysers, and appliances concurrently.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Adding heavy EV fleet loads during this window increases peak coincidence, which leads to voltage drops, power factor degradation, and potential local transformer failure. Shifting just <strong>15% of EV loads</strong> outside this peak avoids expensive physical grid reinforcement.
              </p>
            </div>
          )}

          {activeTariffSection === 'vpp' && (
            <div className="space-y-2.5 animate-fadeIn">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                🔋 Decentralized Demand Response & Virtual Power Plants (VPP)
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Demand Response allows grid operators to request consumers reduce their power draw during peak stress in exchange for financial rewards. Under a <strong>Virtual Power Plant (VPP)</strong> structure, millions of parked EVs act as a distributed battery system.
              </p>
              <p className="text-slate-400 leading-relaxed">
                By booking slots using ChargeSense, CPOs and fleet owners participate in V2G (Vehicle-to-Grid) load shifting. During critical spikes, the scheduling system can briefly throttle DC charger power or feed electricity back from EVs to the grid, earning operators significant rebates.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Grid: Scheduler & EV Session Optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduler Grid (Left 2 columns) */}
        <motion.div variants={item} className="lg:col-span-2 glass-panel rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-white">Interactive Week Grid Scheduler</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click cells to reserve charging ports and build your load-shifting profile</p>
            </div>
            <select 
              value={selectedStation.id} 
              onChange={e => setSelectedStation(stations.find(s => s.id === e.target.value)!)} 
              className="px-3 py-1.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand w-64"
            >
              {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.operator})</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 text-xs bg-dark-900/40 p-3 rounded-lg border border-dark-600/30">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3.5 h-3.5 rounded bg-brand/10 border border-brand/30"></span> 
              Off-Peak (₹12/kWh)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3.5 h-3.5 rounded bg-blue-500/10 border border-blue-500/30"></span> 
              Normal (₹15/kWh)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3.5 h-3.5 rounded bg-red-500/10 border border-red-500/30"></span> 
              Peak Surge (₹18/kWh)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3.5 h-3.5 rounded bg-brand border border-white"></span> 
              Your Booked Slots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-2 px-1 text-slate-500 text-left w-12">Day</th>
                  {HOURS.map(h => <th key={h} className="py-2 px-0.5 text-slate-500 text-center w-10 font-mono">{h.toString().padStart(2, '0')}</th>)}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, di) => (
                  <tr key={day} className="hover:bg-dark-700/10">
                    <td className="py-1.5 px-1 text-slate-400 font-semibold">{day}</td>
                    {HOURS.map(h => {
                      const slot = getSlotStatus(h, di)
                      const key = `${di}-${h}`
                      const isBooked = booked.has(key)
                      return (
                        <td key={h} className="py-1 px-0.5">
                          <button
                            onClick={() => toggleBook(key)}
                            title={`${day} @ ${h}:00 - Rate: ₹${slot.price}/kWh (${slot.label})`}
                            className="w-full h-8 rounded text-[9px] font-mono font-semibold transition-all border flex items-center justify-center relative overflow-hidden"
                            style={{
                              backgroundColor: isBooked ? '#10b981' : slot.color + '0c',
                              borderColor: isBooked ? '#10b981' : slot.color + '25',
                              color: isBooked ? '#0f172a' : slot.color,
                            }}
                          >
                            <span>₹{slot.price}</span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bookings Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-dark-600/40">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Selected: <strong className="text-white">{booked.size} slots</strong>. Shifting <strong className="text-brand">{offPeakSlotsBookedCount}</strong> slots to Off-Peak helps stabilize MPPKVVCL local feeders.
            </div>
            <button
              onClick={() => {
                if (booked.size > 0) {
                  setShowSuccess(true)
                  setTimeout(() => setShowSuccess(false), 5000)
                }
              }}
              disabled={booked.size === 0}
              className="px-6 py-2.5 bg-brand text-dark-900 font-bold rounded-lg hover:bg-brand-light disabled:bg-brand/40 disabled:text-dark-900/60 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <CheckCircle size={16} /> Confirm Scheduled Booking
            </button>
          </div>

          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand/10 border border-brand/30 rounded-lg p-4 flex items-center gap-3 text-brand text-xs"
            >
              <Award size={24} className="shrink-0 animate-bounce" />
              <div>
                <strong>Grid Hero Reservation Generated!</strong> Scheduled charging sequence compiled and pushed to substation control unit. You saved <strong>₹{totalSavings}</strong> off base rate, and shifted load away from peak transformer stress.
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* EV Charge Cost Simulator (Right column) */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={18} className="text-brand animate-pulse" /> Session Cost & Savings Optimizer
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">Calculate costs based on vehicle and speed constraints</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">EV Battery Size (kWh)</label>
                  <span className="text-xs font-bold text-brand">{batterySize} kWh</span>
                </div>
                <input 
                  type="range" min={15} max={100} step={5} value={batterySize} 
                  onChange={e => setBatterySize(Number(e.target.value))} 
                  className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>15kWh (3W)</span>
                  <span>40kWh (Nexon)</span>
                  <span>100kWh (Premium)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Charge Requirement (%)</label>
                  <span className="text-xs font-bold text-brand">+{chargeAmount}% (SoC delta)</span>
                </div>
                <input 
                  type="range" min={20} max={90} step={5} value={chargeAmount} 
                  onChange={e => setChargeAmount(Number(e.target.value))} 
                  className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand"
                />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>+20% (Top up)</span>
                  <span>+60% (Typical)</span>
                  <span>+90% (Full session)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Charger Type / Speed</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'AC (7.4 kW)', value: 7.4, desc: 'Slow / Night' },
                    { label: 'DC (25 kW)', value: 25.0, desc: 'Medium Fast' },
                    { label: 'DC (50 kW)', value: 50.0, desc: 'Ultra Fast' }
                  ].map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setChargerPower(c.value)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        chargerPower === c.value 
                          ? 'bg-brand/10 border-brand text-brand font-bold' 
                          : 'bg-dark-900/60 border-dark-600 text-slate-400 text-xs'
                      }`}
                    >
                      <div className="text-xs">{c.label}</div>
                      <div className="text-[8px] opacity-75 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Session Readout */}
            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-600/40 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Energy Needed:</span>
                <span className="font-semibold text-white">{energyRequiredKwh.toFixed(1)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Charging Time:</span>
                <span className="font-semibold text-white flex items-center gap-1"><Clock size={12} /> {estimatedHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CO₂ Saved (Off-Peak):</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">{sessionCarbonSavedKg.toFixed(2)} kg</span>
              </div>
              <div className="border-t border-dark-600/40 my-2 pt-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Cost Comparison</span>
                <div className="space-y-1">
                  <div className="flex justify-between text-red-400">
                    <span>Peak Charge Cost:</span>
                    <span>₹{estimatedCostPeak.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>Standard Charge Cost:</span>
                    <span>₹{estimatedCostNormal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-brand">
                    <span>Off-Peak Charge Cost:</span>
                    <span>₹{estimatedCostOffPeak.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Banner */}
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mt-4 space-y-3">
            <h4 className="text-xs font-bold text-brand flex items-center gap-1">
              <Award size={14} /> Optimization Rationale
            </h4>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              By shifting this session to the Night/Off-Peak window, you reduce your session cost by <strong>₹{maxSavings.toFixed(0)}</strong>, avoid <strong>{sessionCarbonSavedKg.toFixed(2)} kg</strong> of CO₂ emissions, and support the utility by shifting <strong>{peakGridReliefKw} kW</strong> of demand load off the evening peak curve.
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-brand/10 pt-2">
              <span>Grid Peak Relief contribution:</span>
              <span className="font-bold text-brand">{peakGridReliefKw} kW</span>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Projected Grid Impact Summary */}
      <motion.div variants={item} className="glass-panel rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3 text-sm">Target Demand-Response Impact Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="space-y-1 border-r border-dark-600/30 pr-4">
            <span className="font-bold text-brand text-lg block">30%</span>
            <strong className="text-slate-300 block">Peak Load Mitigation</strong>
            <p className="text-slate-400">Target reduction in concurrent charging loads on high-stress transformer feeders during domestic lighting peaks.</p>
          </div>
          <div className="space-y-1 border-r border-dark-600/30 pr-4">
            <span className="font-bold text-blue-400 text-lg block">18%</span>
            <strong className="text-slate-300 block">Average Monthly Savings</strong>
            <p className="text-slate-400">For CPOs and individual fleet owners utilizing ChargeSense TOU automated slot scheduling.</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-purple-400 text-lg block">2.4 Tons</span>
            <strong className="text-slate-300 block">CO₂ Reduced / Month</strong>
            <p className="text-slate-400">By charging during maximum wind generation windows (11 PM - 5 AM) which avoids grid reliance on coal peaker stations.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
