import { GraduationCap, Loader2, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

const GRADE_COLORS = {
  S: 'text-lol-gold bg-lol-gold/15 border-lol-gold/40',
  A: 'text-green-400 bg-green-400/10 border-green-400/30',
  B: 'text-lol-blue bg-lol-blue/10 border-lol-blue/30',
  C: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  D: 'text-lol-red bg-lol-red/10 border-lol-red/30',
}

function getScoreInfo(score) {
  if (score >= 9) return { color: 'text-lol-gold', bg: 'bg-lol-gold/10 border-lol-gold/30', label: '素晴らしい' }
  if (score >= 7) return { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', label: '良い' }
  if (score >= 5) return { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', label: '普通' }
  if (score >= 3) return { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', label: '改善必要' }
  return { color: 'text-lol-red', bg: 'bg-lol-red/10 border-lol-red/30', label: '要練習' }
}

function ScoreCircle({ score, label }) {
  const info = getScoreInfo(score)
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${info.bg}`}>
      <div className={`text-2xl font-heading font-bold ${info.color}`}>{score}</div>
      <div className="flex flex-col">
        <div className="text-[10px] text-lol-text">{label}</div>
        <div className={`text-[10px] font-medium ${info.color}`}>{info.label}</div>
      </div>
    </div>
  )
}

export function CoachingPanel({ coaching, loading }) {
  if (loading) {
    return (
      <div className="rounded border border-lol-gold/30 bg-lol-surface/80">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-lol-gold/20">
          <GraduationCap size={14} className="text-lol-gold" />
          <span className="font-heading text-xs tracking-widest text-lol-gold">
            AI COACHING
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 p-4">
          <Loader2 size={16} className="text-lol-gold animate-spin" />
          <span className="text-sm text-lol-text-light">試合を分析中...</span>
        </div>
      </div>
    )
  }

  if (!coaching) return null

  return (
    <div className="rounded border border-lol-gold/30 bg-lol-surface/80">
      {/* ヘッダー */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-lol-gold/20">
        <GraduationCap size={14} className="text-lol-gold" />
        <span className="font-heading text-xs tracking-widest text-lol-gold">
          AI COACHING
        </span>
      </div>

      <div className="p-2 space-y-2">
        {/* スコア */}
        <div className="flex justify-center gap-6 py-1">
          <ScoreCircle score={coaching.overall_score} label="総合" />
          <ScoreCircle score={coaching.build_score} label="ビルド" />
        </div>

        {/* セクション */}
        {coaching.sections?.map((section, i) => (
          <div key={i} className="rounded bg-lol-surface-light/30 border border-lol-surface-light/20">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-lol-text-light font-medium">{section.title}</span>
              {section.grade && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-heading ${GRADE_COLORS[section.grade] || GRADE_COLORS.C}`}>
                  {section.grade}
                </span>
              )}
            </div>
            <p className="text-xs text-lol-text px-2 pb-1.5 leading-relaxed">{section.content}</p>
          </div>
        ))}

        {/* 良かった点 */}
        {coaching.good_points?.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 px-1">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-[11px] text-green-400 font-medium">GOOD</span>
            </div>
            {coaching.good_points.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded bg-green-400/5 border border-green-400/15">
                <ChevronRight size={10} className="text-green-400 shrink-0 mt-0.5" />
                <p className="text-xs text-lol-text-light">{p}</p>
              </div>
            ))}
          </div>
        )}

        {/* 改善点 */}
        {coaching.improve_points?.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 px-1">
              <TrendingDown size={12} className="text-lol-red" />
              <span className="text-[11px] text-lol-red font-medium">IMPROVE</span>
            </div>
            {coaching.improve_points.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded bg-lol-red/5 border border-lol-red/15">
                <ChevronRight size={10} className="text-lol-red shrink-0 mt-0.5" />
                <p className="text-xs text-lol-text-light">{p}</p>
              </div>
            ))}
          </div>
        )}

        {/* 次の試合へのアドバイス */}
        {coaching.next_game_advice && (
          <div className="px-2 py-1.5 rounded bg-lol-gold/5 border border-lol-gold/20">
            <p className="text-xs text-lol-text-light leading-relaxed">
              <span className="text-lol-gold font-medium">NEXT: </span>
              {coaching.next_game_advice}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
