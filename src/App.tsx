import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, LineChart, Zap, Map as MapIcon, List, ZapIcon, GitCompareArrows, Activity, IndianRupee, ClipboardCheck, Users, Brain, Sun, Battery, AlertTriangle, Calendar, Network, FlaskConical, Menu, X } from 'lucide-react'
import { clsx } from 'clsx'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Forecast from './pages/Forecast'
import PlanGenerator from './pages/PlanGenerator'
import MapViewer from './pages/MapViewer'
import ProposalsList from './pages/ProposalsList'
import BaselineComparison from './pages/BaselineComparison'
import GridAnalytics from './pages/GridAnalytics'
import ROIBenchmark from './pages/ROIBenchmark'
import ApprovalWorkflow from './pages/ApprovalWorkflow'
import CommunityScore from './pages/CommunityScore'
import RLScheduling from './pages/RLScheduling'
import SolarSynergy from './pages/SolarSynergy'
import V2GDegradation from './pages/V2GDegradation'
import LoadSheddingAlerts from './pages/LoadSheddingAlerts'
import SlotBooking from './pages/SlotBooking'
import GNNPlacement from './pages/GNNPlacement'
import PINNForecast from './pages/PINNForecast'
import GeminiChat from './components/GeminiChat'

export default function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Automatically close sidebar when navigation path changes
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  const sections = [
    { label: 'OPERATIONS', items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Forecast', href: '/forecast', icon: LineChart },
      { name: 'Plan Generator', href: '/plan', icon: Zap },
      { name: 'Proposals', href: '/proposals', icon: List },
      { name: 'Approval Flow', href: '/approval', icon: ClipboardCheck },
      { name: 'Map View', href: '/map', icon: MapIcon },
    ]},
    { label: 'ANALYTICS', items: [
      { name: 'Grid Analytics', href: '/grid', icon: Activity },
      { name: 'ROI Benchmark', href: '/roi', icon: IndianRupee },
      { name: 'Baseline Compare', href: '/baseline', icon: GitCompareArrows },
      { name: 'Community Score', href: '/community', icon: Users },
      { name: 'Load Alerts', href: '/alerts', icon: AlertTriangle },
      { name: 'Slot Booking', href: '/booking', icon: Calendar },
    ]},
    { label: 'RESEARCH', items: [
      { name: 'RL Scheduling', href: '/rl', icon: Brain },
      { name: 'Solar Synergy', href: '/solar', icon: Sun },
      { name: 'V2G Degradation', href: '/v2g', icon: Battery },
      { name: 'GNN Placement', href: '/gnn', icon: Network },
      { name: 'PINN Forecast', href: '/pinn', icon: FlaskConical },
    ]},
  ]

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-900 text-slate-200 font-sans">
      
      {/* Mobile Header Bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-600/50 relative z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/20 p-1.5 rounded-lg text-brand"><ZapIcon size={18} /></div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">ChargeSense AI</h1>
            <p className="text-[9px] text-brand font-medium">MPPKVVCL · Indore</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 bg-dark-700 hover:bg-dark-600 text-slate-200 rounded-lg border border-dark-600/50 transition-colors"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Dimmed Overlay Backdrop for Mobile when Sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={clsx(
        "bg-dark-800 border-r border-dark-600/50 flex flex-col shadow-2xl shrink-0 transition-transform duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50 w-60 md:relative md:translate-x-0 md:flex",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand/20 p-2 rounded-lg text-brand"><ZapIcon size={22} /></div>
            <div>
              <h1 className="font-bold text-base text-white tracking-wide">ChargeSense AI</h1>
              <p className="text-[10px] text-brand font-medium">MPPKVVCL · Indore</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {sections.map(section => (
            <div key={section.label}>
              <div className="text-[10px] font-semibold text-slate-500 tracking-wider px-3 mb-1.5">{section.label}</div>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link key={item.name} to={item.href} className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                      isActive ? 'bg-brand/10 text-brand border border-brand/20' : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                    )}>
                      <item.icon size={16} className={clsx(isActive ? 'text-brand' : 'text-slate-500')} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-dark-600/50 font-medium">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg text-xs transition-colors">
            <ZapIcon size={12} />
            <span>View 3D Landing Page</span>
          </Link>
          <div className="text-[10px] text-slate-500 text-center mt-2">MPPKVVCL · Indore Grid</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/plan" element={<PlanGenerator />} />
              <Route path="/proposals" element={<ProposalsList />} />
              <Route path="/approval" element={<ApprovalWorkflow />} />
              <Route path="/map" element={<MapViewer />} />
              <Route path="/grid" element={<GridAnalytics />} />
              <Route path="/roi" element={<ROIBenchmark />} />
              <Route path="/baseline" element={<BaselineComparison />} />
              <Route path="/community" element={<CommunityScore />} />
              <Route path="/alerts" element={<LoadSheddingAlerts />} />
              <Route path="/booking" element={<SlotBooking />} />
              <Route path="/rl" element={<RLScheduling />} />
              <Route path="/solar" element={<SolarSynergy />} />
              <Route path="/v2g" element={<V2GDegradation />} />
              <Route path="/gnn" element={<GNNPlacement />} />
              <Route path="/pinn" element={<PINNForecast />} />
            </Routes>
          </div>
        </div>
        <GeminiChat />
      </main>
    </div>
  )
}
