import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function TeamList({ label, players, isAlly, myName, ddragon }) {
  const storageKey = `teamlist-${isAlly ? 'ally' : 'enemy'}-open`
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved !== null ? saved === 'true' : true
  })
  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)
    localStorage.setItem(storageKey, String(next))
  }
  const borderColor = isAlly ? 'border-lol-blue/30' : 'border-lol-red/30'
  const labelColor = isAlly ? 'text-lol-blue' : 'text-lol-red'

  const flagLabels = { fed: 'Fed', tank: 'Tank', healer: 'Heal', cc: 'CC', shield: 'Shield' }
  const flagColors = {
    fed: 'bg-red-600/80', tank: 'bg-gray-500/80', healer: 'bg-green-600/80',
    cc: 'bg-yellow-600/80', shield: 'bg-cyan-600/80'
  }

  return (
    <div className={`rounded border ${borderColor} bg-lol-surface/80`}>
      <div
        className={`flex items-center justify-between px-3 py-1 border-b ${borderColor} cursor-pointer select-none`}
        onClick={toggle}
      >
        <span className={`font-heading text-xs tracking-widest ${labelColor}`}>
          {label}
        </span>
        <ChevronDown
          size={14}
          className={`${labelColor} transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="divide-y divide-lol-surface-light/30">
            {(players || []).map((player, i) => {
              const isMe = player.summonerName === myName
              const k = player.scores?.kills ?? 0
              const d = player.scores?.deaths ?? 0
              const a = player.scores?.assists ?? 0
              const enName = player.enName || player.championName || '???'
              const iconUrl = ddragon ? `${ddragon}/img/champion/${enName}.png` : ''

              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2 py-1.5 ${isMe ? (isAlly ? 'border-l-2 border-lol-blue bg-lol-blue/5' : 'border-l-2 border-lol-red bg-lol-red/5') : ''}`}
                >
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={enName}
                      className="w-7 h-7 rounded-sm"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${isMe ? 'text-lol-gold' : 'text-lol-text-light'}`}>
                      {player.championName || enName}
                    </span>
                  </div>

                  {player.flags?.length > 0 && (
                    <div className="flex gap-0.5">
                      {player.flags.map(f => (
                        <span key={f} className={`text-[10px] px-1 rounded text-white font-bold ${flagColors[f] || 'bg-gray-500/80'}`}>
                          {flagLabels[f] || f}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="font-heading text-[13px] tabular-nums">
                    <span className="text-lol-text-light">{k}</span>
                    <span className="text-lol-text">/</span>
                    <span className={d >= 5 ? 'text-lol-red' : 'text-lol-text-light'}>{d}</span>
                    <span className="text-lol-text">/</span>
                    <span className="text-lol-text-light">{a}</span>
                  </div>

                  <div className="w-7 text-right">
                    <span className="text-xs text-lol-gold-dim">Lv{player.level}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
