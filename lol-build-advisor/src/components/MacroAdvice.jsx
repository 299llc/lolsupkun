import { Navigation, AlertTriangle, Target, Loader2, Clock } from 'lucide-react'

function formatGameTime(seconds) {
  if (seconds == null || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MacroAdvice({ advice, loading }) {
  const hasError = advice?.error
  const hasData = advice && !hasError

  return (
    <div className="rounded border border-lol-blue/30 bg-lol-surface/80">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-lol-blue/20">
        <div className="flex items-center gap-1.5">
          <Navigation size={14} className="text-lol-blue" />
          <span className="font-heading text-xs tracking-widest text-lol-blue">
            MACRO
          </span>
        </div>
        <div className="flex items-center gap-2">
          {advice?.gameTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-lol-text" />
              <span className="text-[10px] text-lol-text">{formatGameTime(advice.gameTime)}</span>
            </div>
          )}
          {loading && <Loader2 size={14} className="text-lol-blue animate-spin" />}
        </div>
      </div>

      {hasError ? (
        <div className="p-2">
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-lol-red/10 border border-lol-red/20">
            <AlertTriangle size={12} className="text-lol-red shrink-0 mt-0.5" />
            <p className="text-xs text-lol-red">AI エラー: {advice.error}</p>
          </div>
        </div>
      ) : hasData ? (
        <div className="p-2 space-y-1.5">
          {/* タイトル + 説明 */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-lol-blue/10 border border-lol-blue/20">
            <Target size={12} className="text-lol-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-lol-text-light font-medium leading-snug">{advice.title || advice.action_short || advice.action}</p>
              {advice.desc && (
                <p className="text-xs text-lol-text mt-0.5">{advice.desc}</p>
              )}
            </div>
          </div>

          {/* 警告 */}
          {advice.warning && (
            <div className="flex items-start gap-1.5 px-2 py-1 rounded bg-lol-red/5 border border-lol-red/15">
              <AlertTriangle size={11} className="text-lol-red shrink-0 mt-0.5" />
              <p className="text-xs text-lol-red/80">{advice.warning}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 text-center">
          <p className="text-xs text-lol-text">マクロアドバイスを分析中...</p>
        </div>
      )}
    </div>
  )
}
