const { fetchChampionBuild } = require('../electron/api/opggClient')
const { getItemById, setCacheDir, initPatchData } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  const analysis = await fetchChampionBuild('Gragas', 'top')
  if (!analysis) { console.log('No data'); return }

  // 全フィールドをJSON形式で表示（名前解決付き）
  const resolve = (items) => (items || []).map(c => ({
    ids: c.ids,
    names: c.ids.map(id => getItemById(id)?.jaName || c.names?.[c.ids.indexOf(id)] || id),
    play: c.play,
    winRate: c.winRate,
    pickRate: c.pickRate
  }))

  const result = {
    roles: analysis.roles,
    coreItems: resolve(analysis.coreItems),
    boots: resolve(analysis.boots),
    starterItems: resolve(analysis.starterItems),
    lastItems: resolve(analysis.lastItems),
    fourthItems: resolve(analysis.fourthItems),
    fifthItems: resolve(analysis.fifthItems),
    sixthItems: resolve(analysis.sixthItems),
    winRate: analysis.winRate,
    pickRate: analysis.pickRate,
    tier: analysis.tier,
    skills: analysis.skills,
    runes: analysis.runes
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
