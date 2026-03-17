const https = require('https')
const { initPatchData, getAllChampions } = require('../electron/api/patchData')

const agent = new https.Agent({ rejectUnauthorized: false })

https.get('https://127.0.0.1:2999/liveclientdata/allgamedata', { agent }, res => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', async () => {
    try {
      const game = JSON.parse(data)
      await initPatchData()
      const champMap = getAllChampions() || {}

      const me = game.allPlayers.find(p =>
        p.summonerName === game.activePlayer?.summonerName ||
        p.riotIdGameName === game.activePlayer?.riotIdGameName
      ) || game.allPlayers[0]
      const enemies = game.allPlayers.filter(p => p.team !== me.team)

      function extractEnName(player) {
        const raw = player.rawChampionName || ''
        if (raw.startsWith('game_character_displayname_')) return raw.replace('game_character_displayname_', '')
        const m = raw.match(/^Character_(\w+)_Name$/)
        if (m) return m[1]
        return raw
      }

      let ad = 0, ap = 0
      const details = []
      for (const p of enemies) {
        const enName = extractEnName(p)
        const champ = Object.values(champMap).find(c => c.enName === enName)
        const attack = champ?.info?.attack || 5
        const magic = champ?.info?.magic || 5
        ad += attack
        ap += magic
        details.push(`${p.championName} (${enName}) | atk=${attack} mag=${magic} | tags=${(champ?.tags||[]).join('/')}`)
      }
      const total = ad + ap || 1
      console.log('=== 敵チーム AD/AP 比率 (info.attack/magic ベース) ===')
      details.forEach(d => console.log('  ' + d))
      console.log('---')
      console.log(`合計: AD ${Math.round(ad / total * 100)}% / AP ${Math.round(ap / total * 100)}%`)
    } catch (e) {
      console.log('エラー:', e.message)
    }
  })
}).on('error', () => {
  console.log('試合中ではないか、APIに接続できません')
})
