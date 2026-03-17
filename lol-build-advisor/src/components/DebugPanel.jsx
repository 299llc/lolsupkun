import { useState, useEffect } from 'react'
import { X, RefreshCw, Trash2, ChevronDown, ChevronRight, Copy, Check, Info } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={handleCopy} className="text-lol-text hover:text-lol-gold" title="Copy">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
    </button>
  )
}

function LogSection({ label, text, color = 'text-lol-blue' }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-1"
      >
        <div className="flex items-center gap-1">
          {open ? <ChevronDown size={10} className="text-lol-text" /> : <ChevronRight size={10} className="text-lol-text" />}
          <span className={`text-[10px] font-heading tracking-wider ${color}`}>{label}</span>
        </div>
        <CopyButton text={text} />
      </button>
      {open && (
        <pre className="text-[10px] text-lol-text-light bg-lol-surface rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto select-text cursor-text">
          {text}
        </pre>
      )}
    </div>
  )
}

export function DebugPanel({ onClose }) {
  const [logs, setLogs] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [debugState, setDebugState] = useState(null)

  const refresh = async () => {
    const data = await window.electronAPI?.getAiLogs()
    setLogs(data || [])
  }

  const clear = async () => {
    await window.electronAPI?.clearAiLogs()
    setLogs([])
  }

  const fetchState = async () => {
    const state = await window.electronAPI?.getDebugState()
    setDebugState(state || null)
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-lol-surface border border-lol-gold/30 rounded-lg w-[95%] max-w-[600px] h-[80%] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-lol-gold/20 shrink-0">
          <span className="font-heading text-xs text-lol-gold tracking-wider">AI DEBUG LOG</span>
          <div className="flex items-center gap-2">
            <button onClick={fetchState} className="text-lol-text hover:text-lol-gold" title="Current State">
              <Info size={14} />
            </button>
            <button onClick={refresh} className="text-lol-text hover:text-lol-blue" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={clear} className="text-lol-text hover:text-lol-red" title="Clear">
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="text-lol-text hover:text-lol-text-light">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Current State */}
          {debugState && (
            <div className="rounded border border-lol-gold/50 bg-lol-bg">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[10px] font-heading tracking-wider text-lol-gold">CURRENT STATE</span>
                <div className="flex items-center gap-2">
                  <CopyButton text={JSON.stringify(debugState, null, 2)} />
                  <button onClick={() => setDebugState(null)} className="text-lol-text hover:text-lol-text-light">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <pre className="text-[10px] text-lol-text-light bg-lol-surface rounded mx-2 mb-2 p-2 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto select-text cursor-text">
                {JSON.stringify(debugState, null, 2)}
              </pre>
            </div>
          )}

          {logs.length === 0 && !debugState && (
            <p className="text-xs text-lol-text text-center py-8">ログなし — AI提案をONにして試合を開始してください</p>
          )}

          {[...logs].reverse().map((log, i) => {
            const isOpen = expanded === i
            const hasError = !!log.error
            return (
              <div key={i} className={`rounded border ${hasError ? 'border-lol-red/30' : 'border-lol-gold-dim/30'} bg-lol-bg`}>
                {/* Summary */}
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left"
                >
                  {isOpen ? <ChevronDown size={12} className="text-lol-text shrink-0" /> : <ChevronRight size={12} className="text-lol-text shrink-0" />}
                  <span className="text-[10px] text-lol-text shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-[10px] shrink-0 ${hasError ? 'text-lol-red' : 'text-lol-blue'}`}>
                    {hasError ? 'ERROR' : `${log.durationMs}ms`}
                  </span>
                  {log.tokens && (
                    <span className="text-[10px] text-lol-text shrink-0">
                      in:{log.tokens.input} out:{log.tokens.output} cache:{log.tokens.cache_read}
                    </span>
                  )}
                  <span className="text-[10px] text-lol-text-light truncate">
                    {hasError ? log.error : (log.response?.substring(0, 50) + '...')}
                  </span>
                </button>

                {/* Detail */}
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    {/* System Prompt */}
                    <LogSection label="SYSTEM PROMPT" text={log.system} color="text-purple-400" />

                    {/* Static Context (cached) */}
                    <LogSection label="STATIC CONTEXT (cached)" text={log.staticContext} color="text-lol-blue" />

                    {/* User Message (dynamic) */}
                    <LogSection label="USER MESSAGE (dynamic)" text={log.userMessage || log.request} color="text-cyan-400" />

                    {/* Response */}
                    {log.response && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-lol-gold font-heading tracking-wider">RESPONSE</span>
                          <CopyButton text={log.response} />
                        </div>
                        <pre className="text-[10px] text-lol-text-light bg-lol-surface rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto select-text cursor-text">
                          {log.response}
                        </pre>
                      </div>
                    )}

                    {/* Error */}
                    {log.error && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-lol-red font-heading tracking-wider">ERROR</span>
                          <CopyButton text={log.error} />
                        </div>
                        <pre className="text-[10px] text-lol-red/80 bg-lol-surface rounded p-2 whitespace-pre-wrap select-text cursor-text">
                          {log.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
