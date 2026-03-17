export function KillBar({ leftKills, rightKills, allyIsLeft }) {
  const total = leftKills + rightKills || 1
  const leftPct = Math.round((leftKills / total) * 100)

  return (
    <div className="flex items-center gap-2">
      <span className={`font-heading text-base w-6 text-right ${allyIsLeft ? 'text-lol-blue' : 'text-lol-red'}`}>
        {leftKills}
      </span>
      <div className="flex-1 h-2 bg-lol-surface rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-500 ${allyIsLeft ? 'bg-lol-blue' : 'bg-lol-red'}`}
          style={{ width: `${leftPct}%` }}
        />
        <div
          className={`h-full transition-all duration-500 ${allyIsLeft ? 'bg-lol-red' : 'bg-lol-blue'}`}
          style={{ width: `${100 - leftPct}%` }}
        />
      </div>
      <span className={`font-heading text-base w-6 ${allyIsLeft ? 'text-lol-red' : 'text-lol-blue'}`}>
        {rightKills}
      </span>
    </div>
  )
}
