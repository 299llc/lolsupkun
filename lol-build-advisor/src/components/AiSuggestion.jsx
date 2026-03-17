import { useState } from 'react'
import { Sparkles, Star, MessageCircle, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { ItemTooltip } from './ItemTooltip'

function StarRating({ count }) {
  return (
    <div className="flex gap-px shrink-0">
      {[...Array(count)].map((_, i) => (
        <Star key={i} size={10} className="text-lol-gold" fill="currentColor" />
      ))}
    </div>
  )
}

// 推薦率から星数を算出: >66%→3, >33%→2, >0→1
function getStars(count, total) {
  if (!count || !total) return 0
  const rate = count / total
  if (rate > 0.66) return 3
  if (rate > 0.33) return 2
  return 1
}

export function AiSuggestion({ suggestion, substituteItems, ownedItemIds, ddragon, loading, compact }) {
  const [showOthers, setShowOthers] = useState(false)
  const recommended = suggestion?.recommended || []
  const reasoning = suggestion?.reasoning || ''
  const history = suggestion?.history || {}
  const totalCalls = suggestion?.totalCalls || 0
  const recommendedIds = new Set(recommended.map(r => String(r.id)))

  // reason を引く（最新優先、なければ蓄積の lastReason）
  const reasonMap = {}
  for (const r of recommended) {
    reasonMap[String(r.id)] = r.reason
  }
  for (const [id, h] of Object.entries(history)) {
    if (!reasonMap[id] && h.lastReason) {
      reasonMap[id] = h.lastReason
    }
  }

  const notOwned = substituteItems.filter(item => !ownedItemIds?.has(String(item.id)))

  // 蓄積回数でソート（多い順）、AI呼び出し後は推薦歴ありのみ表示
  const sorted = [...notOwned]
    .sort((a, b) => {
      const countA = history[String(a.id)]?.count || 0
      const countB = history[String(b.id)]?.count || 0
      return countB - countA
    })
    .filter(item => totalCalls === 0 || (history[String(item.id)]?.count || 0) > 0)

  // AIが推薦していないアイテム（その他候補）
  const sortedIds = new Set(sorted.map(item => String(item.id)))
  const others = notOwned.filter(item => !sortedIds.has(String(item.id)))

  return (
    <div className="rounded border border-lol-gold/30 bg-lol-surface/80">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-lol-gold/20">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-lol-gold" />
          <span className="font-heading text-xs tracking-widest text-lol-gold">
            ITEM CANDIDATES
          </span>
          <span className="text-[11px] text-lol-text px-1 py-0.5 rounded bg-lol-gold/10 border border-lol-gold/20">
            OP.GG + AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          {suggestion?.gameTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-lol-text" />
              <span className="text-[10px] text-lol-text">
                {Math.floor(suggestion.gameTime / 60)}:{Math.floor(suggestion.gameTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          {loading && <Loader2 size={14} className="text-lol-gold animate-spin" />}
        </div>
      </div>

      <div className="p-2 space-y-1.5">
        {/* AI判断理由 */}
        {reasoning && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-lol-blue/5 border border-lol-blue/15">
            <MessageCircle size={12} className="text-lol-blue shrink-0 mt-0.5" />
            <p className="text-xs text-lol-text-light leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* 候補アイテム一覧 */}
        <div className="space-y-0.5">
          {(() => {
            // 星の多い順にソートしてトップ3のIDを特定
            const top3Ids = new Set(
              [...sorted]
                .filter(item => {
                  const count = history[String(item.id)]?.count || 0
                  return getStars(count, totalCalls) > 0
                })
                .sort((a, b) => {
                  const starsA = getStars(history[String(a.id)]?.count || 0, totalCalls)
                  const starsB = getStars(history[String(b.id)]?.count || 0, totalCalls)
                  if (starsB !== starsA) return starsB - starsA
                  return (history[String(b.id)]?.count || 0) - (history[String(a.id)]?.count || 0)
                })
                .slice(0, 3)
                .map(item => String(item.id))
            )

            return sorted.map(item => {
              const itemId = String(item.id)
              const count = history[itemId]?.count || 0
              const stars = getStars(count, totalCalls)
              const reason = reasonMap[itemId]
              const imgUrl = ddragon && item.image ? `${ddragon}/img/item/${item.image}` : null
              const isTop3 = top3Ids.has(itemId)

              return (
                <ItemTooltip key={item.id} itemId={item.id}>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded cursor-default transition-colors ${
                    isTop3
                      ? 'bg-lol-gold/10 border border-lol-gold/30'
                      : 'bg-lol-surface-light/30 hover:bg-lol-surface-light/50'
                  }`}>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className={`w-6 h-6 rounded-sm ${isTop3 ? '' : 'opacity-60'}`}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <span className={`text-sm flex-1 ${
                      isTop3 ? 'text-lol-gold font-medium' : 'text-lol-text'
                    }`}>
                      {item.name}
                    </span>
                    {stars > 0 && <StarRating count={stars} />}
                  </div>
                  {isTop3 && reason && (
                    <p className="text-xs text-lol-text px-2 pb-1 -mt-0.5">{reason}</p>
                  )}
                </ItemTooltip>
              )
            })
          })()}
        </div>

        {/* その他の候補アイテム（コンパクトモード時は非表示） */}
        {!compact && others.length > 0 && (
          <div>
            <button
              onClick={() => setShowOthers(v => !v)}
              className="flex items-center gap-1 text-[10px] text-lol-text hover:text-lol-text-light transition-colors w-full"
            >
              {showOthers ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              <span>その他の候補 ({others.length})</span>
            </button>
            {showOthers && (
              <div className="flex flex-wrap gap-1 mt-1">
                {others.map(item => {
                  const imgUrl = ddragon && item.image ? `${ddragon}/img/item/${item.image}` : null
                  return (
                    <ItemTooltip key={item.id} itemId={item.id}>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-lol-surface-light/20 cursor-default hover:bg-lol-surface-light/40 transition-colors">
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="w-4 h-4 rounded-sm opacity-50"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                        <span className="text-[10px] text-lol-text">{item.name}</span>
                      </div>
                    </ItemTooltip>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
