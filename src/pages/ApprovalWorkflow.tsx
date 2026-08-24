import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOCK_DB } from '../data/mock-db'
import { formatInr, categoryLabel } from '../lib/utils'
import { CheckCircle2, XCircle, Clock, Eye, ChevronRight, MessageSquare, Sparkles, Loader2 } from 'lucide-react'
import { askGemini } from '../lib/gemini'

const STAGES = ['AI-Generated', 'Engineer-Reviewed', 'Supervisor-Approved', 'Deployment-Scheduled'] as const

export default function ApprovalWorkflow() {
  const { proposals } = MOCK_DB

  const [workflowState, setWorkflowState] = useState(() =>
    proposals.map((p, i) => ({
      ...p,
      currentStage: i < 2 ? 3 : i < 4 ? 2 : i < 7 ? 1 : 0,
      reviewerNotes: i < 2 ? 'All parameters verified. Grid impact within limits.' : i < 4 ? 'Feeder headroom confirmed by field team.' : '',
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 86400000),
    }))
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const selected = workflowState.find(w => w.id === selectedId)

  const [aiRationales, setAiRationales] = useState<Record<string, string>>({})
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({})

  async function generateAiRationale(proposal: any) {
    if (aiRationales[proposal.id]) return
    setLoadingAi(prev => ({ ...prev, [proposal.id]: true }))
    try {
      const prompt = `Write a professional 1-paragraph technical rationale for selecting the EV charging site at ${proposal.pincode.area} (pincode: ${proposal.pincode.pincode}), Indore. Composite Site Score: ${(proposal.siteScore * 100).toFixed(0)}%. V2G score: ${(proposal.v2gPotentialScore * 100).toFixed(0)}%. Payback period: ${proposal.paybackMonths} months. Keep it compact and suitable for an MPPKVVCL (Indore Discom) supervisor reviewing it.`
      const explanation = await askGemini(prompt)
      setAiRationales(prev => ({ ...prev, [proposal.id]: explanation }))
    } catch (e) {
      setAiRationales(prev => ({ ...prev, [proposal.id]: 'Failed to generate AI analysis.' }))
    } finally {
      setLoadingAi(prev => ({ ...prev, [proposal.id]: false }))
    }
  }

  function advanceStage(id: string) {
    setWorkflowState(prev => prev.map(w =>
      w.id === id && w.currentStage < 3 ? { ...w, currentStage: w.currentStage + 1, lastUpdated: new Date(), reviewerNotes: noteInput || w.reviewerNotes } : w
    ))
    setNoteInput('')
  }

  function rejectProposal(id: string) {
    setWorkflowState(prev => prev.map(w =>
      w.id === id ? { ...w, status: 'REJECTED', reviewerNotes: noteInput || 'Rejected by reviewer', lastUpdated: new Date() } : w
    ))
    setNoteInput('')
  }

  const stageCounts = [0, 0, 0, 0]
  workflowState.forEach(w => { if (w.status !== 'REJECTED') stageCounts[w.currentStage]++ })

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Four-Stage Approval Workflow</h1>
        <p className="text-slate-400 mt-1">Track every proposal from AI generation to deployment scheduling</p>
      </motion.div>

      {/* Pipeline visualization */}
      <motion.div variants={item} className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${i === 0 ? 'border-blue-400 bg-blue-400/10 text-blue-400' : i === 1 ? 'border-amber-400 bg-amber-400/10 text-amber-400' : i === 2 ? 'border-brand bg-brand/10 text-brand' : 'border-purple-400 bg-purple-400/10 text-purple-400'}`}>
                  {stageCounts[i]}
                </div>
                <div className="text-xs text-slate-400 mt-2 text-center font-medium">{stage}</div>
              </div>
              {i < 3 && <ChevronRight size={20} className="text-dark-600 mx-1 shrink-0" />}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposals list */}
        <motion.div variants={item} className="lg:col-span-2 space-y-3">
          {workflowState.map(w => (
            <div
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              className={`glass-card rounded-xl p-4 cursor-pointer ${selectedId === w.id ? 'border-brand/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white truncate">{w.pincode.area}</h3>
                    <span className="text-xs text-slate-500">{w.pincode.pincode}</span>
                    {w.status === 'REJECTED' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Rejected</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.currentStage === 3 ? 'bg-purple-500/20 text-purple-400' : w.currentStage === 2 ? 'bg-brand/20 text-brand' : w.currentStage === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {STAGES[w.currentStage]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Score: {(w.siteScore * 100).toFixed(0)}% · {categoryLabel(w.category)} · {formatInr(w.estimatedRevenueInrPerMonth)}/mo
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {/* Stage progress dots */}
                  {STAGES.map((_, si) => (
                    <div key={si} className={`w-2.5 h-2.5 rounded-full ${w.status === 'REJECTED' ? 'bg-red-500/30' : si <= w.currentStage ? 'bg-brand' : 'bg-dark-700'}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Detail panel */}
        <motion.div variants={item} className="glass-panel rounded-xl p-6 sticky top-8 self-start">
          {selected ? (
            <div className="space-y-5">
              <h3 className="font-semibold text-white text-lg">{selected.pincode.area}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Pincode</span><span className="text-white">{selected.pincode.pincode}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="text-white">{categoryLabel(selected.category)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Score</span><span className="text-brand font-bold">{(selected.siteScore * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Monthly Revenue</span><span className="text-white">{formatInr(selected.estimatedRevenueInrPerMonth)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payback</span><span className="text-white">{selected.paybackMonths} months</span></div>
                <div className="flex justify-between"><span className="text-slate-400">V2G Revenue</span><span className="text-purple-400">{formatInr(selected.annualV2gRevenueInr)}/yr</span></div>
              </div>

              {/* Stage progress */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium">Approval Progress</div>
                {STAGES.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${selected.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : i <= selected.currentStage ? 'bg-brand/20 text-brand' : 'bg-dark-700 text-slate-500'}`}>
                      {i <= selected.currentStage ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm ${i <= selected.currentStage ? 'text-white' : 'text-slate-500'}`}>{stage}</span>
                  </div>
                ))}
              </div>

              {/* Feature 2: Smart AI Analysis for Approval Panel */}
              <div className="space-y-2">
                <button
                  onClick={() => generateAiRationale(selected)}
                  disabled={loadingAi[selected.id]}
                  className="w-full py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold rounded-lg border border-brand/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={12} />
                  {loadingAi[selected.id] ? 'Generating...' : aiRationales[selected.id] ? 'AI Site Analysis Ready' : '✨ AI Site Analysis'}
                </button>
                {aiRationales[selected.id] && (
                  <div className="p-3 bg-dark-900/50 rounded-lg border border-dark-700/50 text-[11px] text-slate-300 leading-normal">
                    {aiRationales[selected.id]}
                  </div>
                )}
              </div>

              {selected.reviewerNotes && (
                <div className="p-3 bg-dark-900 rounded-lg border border-dark-700">
                  <div className="flex items-center gap-2 mb-1"><MessageSquare size={12} className="text-slate-400" /><span className="text-xs text-slate-400">Reviewer Notes</span></div>
                  <p className="text-sm text-slate-300">{selected.reviewerNotes}</p>
                </div>
              )}

              {selected.status !== 'REJECTED' && selected.currentStage < 3 && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)}
                    placeholder="Add reviewer note..."
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => advanceStage(selected.id)} className="flex-1 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-light flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => rejectProposal(selected.id)} className="flex-1 py-2 bg-dark-700 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 flex items-center justify-center gap-1.5 border border-dark-600 hover:border-red-500/30">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Eye size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Select a proposal to review</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
