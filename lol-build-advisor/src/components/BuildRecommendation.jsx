import { Loader2, BarChart3, Target } from 'lucide-react'
import { ItemTooltip } from './ItemTooltip'

export function BuildRecommendation({ suggestion, loading, ddragon }) {
  const buildItems = suggestion?.build_goal_names || suggestion?.build_goal || []
  const buildImages = suggestion?.build_goal_images || []
  const buildIds = suggestion?.build_goal || []

  return (
    <div className="rounded border border-lol-gold/30 bg-lol-surface/80">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-lol-gold/20">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={14} className="text-lol-blue" />
          <span className="font-heading text-xs tracking-widest text-lol-gold">
            CORE BUILD
          </span>
          <span className="text-[11px] text-lol-text px-1 py-0.5 rounded bg-lol-blue/10 border border-lol-blue/20">
            OP.GG
          </span>
        </div>
        {loading && <Loader2 size={14} className="text-lol-gold animate-spin" />}
      </div>

      <div className="p-3 space-y-3">
        {loading && !suggestion && (
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 size={16} className="text-lol-gold animate-spin" />
            <span className="text-sm text-lol-text">コアビルド取得中...</span>
          </div>
        )}

        {suggestion && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Target size={13} className="text-lol-gold" />
              <span className="text-xs text-lol-gold font-medium tracking-wide">
                BUILD GOAL
              </span>
            </div>
            <div className="space-y-0.5">
              {buildItems.map((item, i) => {
                const imgFile = buildImages[i]
                const imgUrl = ddragon && imgFile ? `${ddragon}/img/item/${imgFile}` : null
                const itemId = buildIds[i]

                return (
                  <ItemTooltip key={i} itemId={itemId}>
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-lol-surface-light/50 cursor-default">
                      <span className="text-xs text-lol-gold-dim w-4">{i + 1}.</span>
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={item}
                          className="w-6 h-6 rounded-sm"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      )}
                      <span className="text-sm text-lol-text-light flex-1">{item}</span>
                    </div>
                  </ItemTooltip>
                )
              })}
            </div>
          </div>
        )}

        {!suggestion && !loading && (
          <p className="text-sm text-lol-text text-center py-4">
            試合が始まるとOP.GGからコアビルドを自動取得します
          </p>
        )}
      </div>
    </div>
  )
}
