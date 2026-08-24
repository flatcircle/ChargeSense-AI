import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { categoryLabel, formatInr, statusColor } from '../lib/utils'
import { CheckCircle2, XCircle, Search, Sparkles, FileText, Copy, Check, X, Loader2 } from 'lucide-react'
import { askGemini } from '../lib/gemini'

export default function ProposalsList() {
  const { proposals } = MOCK_DB
  const [searchTerm, setSearchTerm] = useState('')
  
  // Feature 2: Smart Proposal Rationale States
  const [explainingId, setExplainingId] = useState<string | null>(null)
  const [rationales, setRationales] = useState<Record<string, string>>({})
  const [loadingRationale, setLoadingRationale] = useState<Record<string, boolean>>({})

  // Feature 5: Policy Brief Generator States
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)
  const [briefs, setBriefs] = useState<Record<string, string>>({})
  const [loadingBrief, setLoadingBrief] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const filteredProposals = proposals.filter(p => 
    p.pincode.area.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.pincode.pincode.includes(searchTerm) ||
    p.status.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.siteScore - a.siteScore)

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

  async function handleAIExplain(proposal: any) {
    if (explainingId === proposal.id) {
      setExplainingId(null)
      return
    }
    setExplainingId(proposal.id)
    if (rationales[proposal.id]) return

    setLoadingRationale(prev => ({ ...prev, [proposal.id]: true }))
    try {
      const prompt = `Write a professional, concise 2-paragraph rationale explaining why the EV charging station site at ${proposal.pincode.area} (pincode: ${proposal.pincode.pincode}) was selected. Mention its site score of ${(proposal.siteScore*100).toFixed(0)}%, charger category ${categoryLabel(proposal.category)}, payback period of ${proposal.paybackMonths} months, estimated revenue of ${formatInr(proposal.estimatedRevenueInrPerMonth)}/month, and V2G capacity score of ${(proposal.v2gPotentialScore*100).toFixed(0)}%. Focus on its impact on the grid and proximity to transit.`
      const explanation = await askGemini(prompt)
      setRationales(prev => ({ ...prev, [proposal.id]: explanation }))
    } catch (error) {
      console.error(error)
      setRationales(prev => ({ ...prev, [proposal.id]: 'Failed to generate AI Rationale.' }))
    } finally {
      setLoadingRationale(prev => ({ ...prev, [proposal.id]: false }))
    }
  }

  async function handlePolicyBrief(proposal: any) {
    setActiveBriefId(proposal.id)
    if (briefs[proposal.id]) return

    setLoadingBrief(prev => ({ ...prev, [proposal.id]: true }))
    try {
      const prompt = `Generate a formal MPPKVVCL (Madhya Pradesh Paschim Kshetra Vidyut Vitaran Co. Ltd. / Indore West Discom) Policy Brief & Infrastructure Proposal for the recommended EV charging hub at ${proposal.pincode.area} (pincode: ${proposal.pincode.pincode}), Indore.
Include sections:
1. Executive Summary
2. Infrastructure Details (Ports: ${proposal.recommendedPorts}, Types: ${proposal.recommendedTypes}, Category: ${categoryLabel(proposal.category)})
3. Financial and Payback Projections (Payback: ${proposal.paybackMonths} months, monthly revenue: ${formatInr(proposal.estimatedRevenueInrPerMonth)})
4. Grid Impact & V2G Potential (${proposal.v2gPotentialScore} V2G score)
Format it with professional markdown headings, bullet points, and tables.`
      const brief = await askGemini(prompt)
      setBriefs(prev => ({ ...prev, [proposal.id]: brief }))
    } catch (error) {
      console.error(error)
      setBriefs(prev => ({ ...prev, [proposal.id]: 'Failed to generate Policy Brief.' }))
    } finally {
      setLoadingBrief(prev => ({ ...prev, [proposal.id]: false }))
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedBriefProposal = proposals.find(p => p.id === activeBriefId)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-white">All Proposals</h1>
          <p className="text-slate-400 mt-1">Review, approve, or reject generated charging sites with AI Rationales & Policy Briefs</p>
        </motion.div>
        <motion.div variants={item} className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by area or pincode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </motion.div>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4">
        {filteredProposals.map(p => (
          <div key={p.id} className="glass-card rounded-xl p-5 group flex flex-col gap-4 border border-dark-600/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-white group-hover:text-brand-light transition-colors">
                    {p.pincode.area}
                  </h3>
                  <span className="text-xs text-slate-500 bg-dark-900 px-2 py-0.5 rounded border border-dark-700">
                    {p.pincode.pincode}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === 'APPROVED' ? 'bg-brand/20 text-brand border border-brand/30' : 
                    p.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {p.status}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {p.rationale}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    {categoryLabel(p.category)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {p.recommendedPorts} Ports
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    V2G: {formatInr(p.annualV2gRevenueInr)}/yr
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:border-l md:border-dark-700 md:pl-6">
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Composite Score</div>
                  <div className="font-bold text-xl text-brand">{(p.siteScore * 100).toFixed(0)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Payback</div>
                  <div className="font-medium text-lg text-white">{p.paybackMonths}mo</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="p-2 bg-dark-700 hover:bg-brand/20 hover:text-brand text-slate-400 rounded-lg transition-colors border border-transparent hover:border-brand/30">
                    <CheckCircle2 size={18} />
                  </button>
                  <button className="p-2 bg-dark-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions for Gemini Features */}
            <div className="flex gap-3 border-t border-dark-700/50 pt-3">
              <button 
                onClick={() => handleAIExplain(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded-lg border border-brand/20 transition-all"
              >
                <Sparkles size={13} />
                {explainingId === p.id ? 'Hide AI Rationale' : '✨ AI Explain'}
              </button>
              
              <button 
                onClick={() => handlePolicyBrief(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-lg border border-purple-500/20 transition-all"
              >
                <FileText size={13} />
                Generate Policy Brief
              </button>
            </div>

            {/* Smart Proposal Rationale Expander (Feature 2) */}
            <AnimatePresence>
              {explainingId === p.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-dark-900/60 border border-dark-700/50 rounded-lg mt-2 text-xs text-slate-300 leading-relaxed">
                    {loadingRationale[p.id] ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 size={14} className="animate-spin text-brand" />
                        Generating Smart Site Rationale...
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{rationales[p.id]}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {/* Policy Brief Modal (Feature 5) */}
      <AnimatePresence>
        {activeBriefId && selectedBriefProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-dark-800 border border-dark-600/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-dark-600/50 flex justify-between items-center bg-dark-900/40">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-400" size={20} />
                  <div>
                    <h3 className="font-bold text-white text-base">MPPKVVCL Infrastructure Policy Brief</h3>
                    <p className="text-xs text-slate-400">{selectedBriefProposal.pincode.area} ({selectedBriefProposal.pincode.pincode})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveBriefId(null)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-300 font-sans leading-relaxed">
                {loadingBrief[activeBriefId] ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-purple-400" />
                    <p className="text-xs">Drafting formal MPPKVVCL infrastructure proposal via Gemini...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-xs whitespace-pre-wrap font-mono bg-dark-900/40 p-4 border border-dark-700/50 rounded-lg">
                    {briefs[activeBriefId]}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-dark-600/50 bg-dark-900/40 flex justify-end gap-2">
                {!loadingBrief[activeBriefId] && briefs[activeBriefId] && (
                  <button 
                    onClick={() => handleCopy(briefs[activeBriefId])}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-light transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied Brief!' : 'Copy to Clipboard'}
                  </button>
                )}
                <button 
                  onClick={() => setActiveBriefId(null)}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-dark-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
