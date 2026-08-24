import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Sparkles, Loader2, Minimize2 } from 'lucide-react'
import { askGeminiStream } from '../lib/gemini'
import { MOCK_DB } from '../data/mock-db'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am the ChargeSense AI assistant. Ask me anything about the MPPKVVCL (Indore) grid capacity, charging station proposals, or EV analytics database!'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Prepare database context once
  const dbContext = JSON.stringify({
    summary: {
      totalZones: MOCK_DB.pincodes.length,
      totalExistingStations: MOCK_DB.stations.length,
      totalProposals: MOCK_DB.proposals.length,
    },
    zones: MOCK_DB.pincodes.map(p => ({
      area: p.area,
      pincode: p.pincode,
      capacityHeadroomMW: (p.availableCapacityMW - p.peakDemandMW).toFixed(2),
      evAdoptionIndex: p.evAdoptionIndex
    })),
    proposals: MOCK_DB.proposals.map(pr => ({
      area: pr.pincode.area,
      score: (pr.siteScore * 100).toFixed(0) + '%',
      status: pr.status,
      payback: pr.paybackMonths + 'mo',
      revenue: pr.estimatedRevenueInrPerMonth
    })),
    existingStations: MOCK_DB.stations.slice(0, 10).map(s => ({
      name: s.name,
      operator: s.operator,
      utilization: (s.dailyUtilization * 100).toFixed(0) + '%'
    }))
  })

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const assistantMsgId = (Date.now() + 1).toString()
    const assistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const stream = askGeminiStream(input, dbContext)
      for await (const chunk of stream) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        )
      }
    } catch (err) {
      console.error(err)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId ? { ...msg, content: 'Sorry, I encountered an error answering that request.' } : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-brand-light transition-all hover:scale-105 duration-200"
          >
            <Sparkles size={24} className="animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="w-[calc(100vw-2rem)] sm:w-96 h-[500px] glass-panel border border-dark-600/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-dark-800 border-b border-dark-600/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-brand/20 p-1.5 rounded-lg text-brand">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                    ChargeSense AI Planning Assistant
                  </h3>
                  <span className="text-[10px] text-brand font-medium">Powered by Gemini 2.5 Flash</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900/30">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand text-white rounded-tr-none'
                        : 'bg-dark-800 text-slate-200 border border-dark-600/40 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-dark-800 text-slate-400 border border-dark-600/40 rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-brand" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-dark-800 border-t border-dark-600/50 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about areas, proposals, grid capacity..."
                className="flex-1 px-3 py-2 bg-dark-900 border border-dark-600/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-brand text-white rounded-xl hover:bg-brand-light transition-all disabled:opacity-50 disabled:hover:bg-brand"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
