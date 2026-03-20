import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink } from 'lucide-react'

const ROTATION_INTERVAL_MS = 30_000 // 30秒でローテーション

export function AdBanner({ className = '' }) {
  const [ad, setAd] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const fetchAd = useCallback(async () => {
    try {
      const data = await window.electronAPI?.getAd()
      if (data) setAd(data)
    } catch {}
  }, [])

  useEffect(() => {
    // Proユーザーチェック
    window.electronAPI?.getLicenseStatus().then(s => {
      if (s?.tier === 'pro') setIsPro(true)
    })
  }, [])

  useEffect(() => {
    if (isPro) return

    fetchAd()
    const timer = setInterval(fetchAd, ROTATION_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isPro, fetchAd])

  if (isPro || dismissed || !ad) return null

  const handleClick = () => {
    if (ad.linkUrl) {
      window.electronAPI?.openExternal(ad.linkUrl)
    }
  }

  // テキスト広告（セルフプロモ等）
  if (!ad.imageUrl) {
    return (
      <div className={`relative rounded border border-lol-gold-dim/20 bg-lol-surface/80 p-3 ${className}`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 p-0.5 text-lol-text/30 hover:text-lol-text/60 transition-colors"
          title="閉じる"
        >
          <X size={12} />
        </button>
        <div className="text-center">
          {ad.title && (
            <p className="text-xs font-heading text-lol-gold tracking-wider mb-1">{ad.title}</p>
          )}
          {ad.text && (
            <p className="text-[11px] text-lol-text-light leading-relaxed">{ad.text}</p>
          )}
        </div>
        <p className="text-[9px] text-lol-text/30 text-center mt-1">AD</p>
      </div>
    )
  }

  // 画像バナー広告
  return (
    <div className={`relative group ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1 right-1 z-10 p-0.5 bg-black/60 rounded text-white/40 hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100"
        title="閉じる"
      >
        <X size={12} />
      </button>
      <div
        onClick={handleClick}
        className={`rounded border border-lol-gold-dim/10 overflow-hidden ${ad.linkUrl ? 'cursor-pointer' : ''}`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.alt || ''}
          className="w-full h-auto block"
          loading="lazy"
        />
        {ad.linkUrl && (
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={10} className="text-white/50" />
          </div>
        )}
      </div>
      <p className="text-[9px] text-lol-text/30 text-right mt-0.5">AD</p>
    </div>
  )
}
