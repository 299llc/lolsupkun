import { useState } from 'react'
import { Swords, ChevronDown, ChevronUp, AlertTriangle, Zap, Crosshair } from 'lucide-react'

export function MatchupTip({ tip }) {
  const [expanded, setExpanded] = useState(true)

  if (!tip) return null

  return (
    <div className="rounded bg-lol-surface-light/50 border border-lol-blue/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-lol-surface-light/30 transition-colors"
      >
        <Swords size={14} className="text-lol-blue shrink-0" />
        <span className="font-heading text-xs text-lol-blue tracking-wider">
          VS {tip.opponent?.toUpperCase()}
        </span>
        <span className="flex-1" />
        {expanded
          ? <ChevronUp size={12} className="text-lol-text-dim shrink-0" />
          : <ChevronDown size={12} className="text-lol-text-dim shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          {/* Summary */}
          {tip.summary && (
            <p className="text-xs text-lol-text-light leading-snug">{tip.summary}</p>
          )}

          {/* Tips */}
          {tip.tips?.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {tip.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-lol-text-light">
                  <span className="text-lol-blue shrink-0 mt-0.5">-</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Playstyle / 勝ち筋 */}
          {tip.playstyle && (
            <div className="flex items-start gap-1.5 text-xs px-1.5 py-1 rounded bg-lol-blue/8 border border-lol-blue/15">
              <Crosshair size={11} className="text-lol-blue shrink-0 mt-0.5" />
              <span className="text-lol-text-light">{tip.playstyle}</span>
            </div>
          )}

          {/* Danger + Power Spike */}
          <div className="flex flex-col gap-0.5 mt-0.5">
            {tip.danger && (
              <div className="flex items-start gap-1.5 text-xs">
                <AlertTriangle size={11} className="text-lol-red shrink-0 mt-0.5" />
                <span className="text-lol-red/90">{tip.danger}</span>
              </div>
            )}
            {tip.power_spike && (
              <div className="flex items-start gap-1.5 text-xs">
                <Zap size={11} className="text-lol-gold shrink-0 mt-0.5" />
                <span className="text-lol-gold/90">{tip.power_spike}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
