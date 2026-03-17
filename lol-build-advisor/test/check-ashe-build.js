const { fetchChampionBuild, buildCoreBuildIds } = require('../electron/api/opggClient')
const { getItemById, setCacheDir, initPatchData } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  // patchData初期化（アイテム名解決用）
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  const analysis = await fetchChampionBuild('Ashe', 'adc')
  if (!analysis) { console.log('No data'); return }

  console.log('=== Roles ===')
  analysis.roles.forEach(r => console.log(`  ${r.name} rate:${r.roleRate}% win:${r.winRate}%`))

  console.log('\n=== Core Items (top 3 sets) ===')
  analysis.coreItems.slice(0, 3).forEach((c, i) =>
    console.log(`  Set${i+1}: ${c.names.join(' + ')} (pick:${c.pickRate}% win:${c.winRate}%)`))

  console.log('\n=== Boots ===')
  analysis.boots.slice(0, 3).forEach(b =>
    console.log(`  ${b.names.join(',')} (pick:${b.pickRate}% win:${b.winRate}%)`))

  console.log('\n=== 4th Items ===')
  ;(analysis.fourthItems || []).slice(0, 5).forEach(it =>
    console.log(`  ${it.names.join(',')} ids:${it.ids} (pick:${it.pickRate}% win:${it.winRate}%)`))

  console.log('\n=== 5th Items ===')
  ;(analysis.fifthItems || []).slice(0, 5).forEach(it =>
    console.log(`  ${it.names.join(',')} ids:${it.ids} (pick:${it.pickRate}% win:${it.winRate}%)`))

  console.log('\n=== 6th Items ===')
  ;(analysis.sixthItems || []).slice(0, 5).forEach(it =>
    console.log(`  ${it.names.join(',')} ids:${it.ids} (pick:${it.pickRate}% win:${it.winRate}%)`))

  console.log('\n=== Last Items (人気アイテム) ===')
  ;(analysis.lastItems || []).slice(0, 10).forEach(it =>
    console.log(`  ${it.names.join(',')} ids:${it.ids} (pick:${it.pickRate}% win:${it.winRate}%)`))

  console.log('\n=== Built Core Build (6 items) ===')
  const ids = buildCoreBuildIds(analysis)
  ids.forEach(id => {
    const item = getItemById(id)
    console.log(`  ${id}: ${item?.jaName || 'Unknown'}`)
  })
}

main().catch(e => console.error(e))
