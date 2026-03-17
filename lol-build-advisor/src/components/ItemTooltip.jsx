import { useState, useRef, useEffect, useCallback } from 'react'

export function ItemTooltip({ itemId, children }) {
  const [detail, setDetail] = useState(null)
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  const handleClick = useCallback(async (e) => {
    if (show) {
      setShow(false)
      return
    }
    if (!itemId) return
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({ x: rect.left, y: rect.top })
    try {
      const d = await window.electronAPI?.getItemDetail(itemId)
      if (d) {
        setDetail(d)
        setShow(true)
      }
    } catch {}
  }, [itemId, show])

  // 外側クリックで閉じる
  useEffect(() => {
    if (!show) return
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShow(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [show])

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="relative cursor-pointer"
    >
      {children}
      {show && detail && (
        <div
          className="fixed z-50 w-56 p-2 rounded border border-lol-gold/30 bg-lol-bg/95 shadow-lg"
          style={{ left: pos.x, top: Math.max(pos.y - 80, 8) }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-lol-gold">{detail.jaName}</span>
            <span className="text-xs text-yellow-400">{detail.gold.toLocaleString()}G</span>
          </div>
          {detail.fullDesc && (
            <p className="text-[11px] text-lol-text-light leading-relaxed">{detail.fullDesc}</p>
          )}
        </div>
      )}
    </div>
  )
}
