class DiffDetector {
  constructor() {
    this.lastData = null
    this.lastCallTime = 0
    this.debounceMs = 10000 // 10秒デバウンス
  }

  check(gameData) {
    const now = Date.now()

    // デバウンス: 前回呼び出しから10秒以内はスキップ
    if (now - this.lastCallTime < this.debounceMs) return false

    if (!this.lastData) {
      // 初回 → トリガー発火
      this.lastData = this._snapshot(gameData)
      this.lastCallTime = now
      return true
    }

    const prev = this.lastData
    const curr = this._snapshot(gameData)

    const reasons = []

    // アイテム変化
    if (curr.itemHash !== prev.itemHash) reasons.push('item_change')

    // キル/デス変化
    if (curr.kills !== prev.kills) reasons.push(`kills:${prev.kills}->${curr.kills}`)
    if (curr.deaths !== prev.deaths) reasons.push(`deaths:${prev.deaths}->${curr.deaths}`)

    // 2分定期更新
    if (now - this.lastCallTime >= 120000) reasons.push('periodic_2min')

    if (reasons.length > 0) {
      console.log(`[DiffDetector] Triggered: ${reasons.join(', ')}`)
      this.lastData = curr
      this.lastCallTime = now
    }

    return reasons.length > 0
  }

  _snapshot(gameData) {
    const ap = gameData.activePlayer
    const me = gameData.allPlayers?.find(p =>
      p.summonerName === ap?.summonerName ||
      p.riotIdGameName === ap?.riotIdGameName
    ) || gameData.allPlayers?.[0]

    const items = (me?.items || []).map(i => i.itemID).sort().join(',')

    return {
      itemHash: items,
      kills: me?.scores?.kills || 0,
      deaths: me?.scores?.deaths || 0,
    }
  }
}

module.exports = { DiffDetector }
