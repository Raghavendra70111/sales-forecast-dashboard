import { useState } from 'react'
import axios from 'axios'
import { useSalesData } from '../context/SalesDataContext'

const API_BASE = 'http://127.0.0.1:5000/api'

export default function AIAssistantPage() {
  const { yearFilter } = useSalesData()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '🤖 Ask about your data — totals, trends, categories, or forecasts.',
    },
  ])
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const { data } = await axios.post(`${API_BASE}/ai-chat`, {
        message: text,
        yearFilter: yearFilter || 'all',
      })

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'No response from AI assistant',
          },
        ])
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: e.response?.data?.error || 'Server error. Make sure backend is running.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">🤖 Smart Sales Assistant</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask questions about your sales data. Year filter is applied automatically. Backend:{' '}
          <code className="text-cyan-400/90">/api/ai-chat</code> (Free AI)
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 h-80 overflow-y-auto space-y-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'assistant' ? 'text-cyan-100' : 'text-white'}>
            <span className="font-semibold text-slate-500">
              {m.role === 'assistant' ? 'Assistant' : 'You'}:
            </span>{' '}
            {m.content}
          </div>
        ))}
        {loading && <div className="text-slate-500">Thinking…</div>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="e.g. Total sales in 2014"
          className="flex-1 rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}