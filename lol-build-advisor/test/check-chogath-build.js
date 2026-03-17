const { fetchChampionBuild, buildCoreBuildIds } = require('../electron/api/opggClient')
const { getItemById, setCacheDir, initPatchData } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  // Gragas mid
  const analysis = await fetchChampionBuild("Gragas", 'mid')
  if (!analysis) { console.log('No data'); return }

  console.log('=== Roles ===')
  analysis.roles.forEach(r => console.log(`  ${r.name} rate:${r.roleRate}% win:${r.winRate}%`))

  console.log('\n=== Core Items (all sets) ===')
  analysis.coreItems.forEach((c, i) => {
    const names = c.ids.map(id => getItemById(id)?.jaName || id)
    console.log(`  Set${i+1}: ${names.join(' + ')} ids:[${c.ids}] (pick:${c.pickRate}% win:${c.winRate}%)`)
  })

  console.log('\n=== Boots ===')
  analysis.boots.forEach(b => {
    const names = b.ids.map(id => getItemById(id)?.jaName || id)
    console.log(`  ${names.join(',')} ids:[${b.ids}] (pick:${b.pickRate}% win:${b.winRate}%)`)
  })

  console.log('\n=== 4th Items ===')
  ;(analysis.fourthItems || []).slice(0, 5).forEach(it => {
    const name = getItemById(it.ids[0])?.jaName || it.names[0]
    console.log(`  ${name} id:${it.ids[0]} (pick:${it.pickRate}% win:${it.winRate}%)`)
  })

  console.log('\n=== 5th Items ===')
  ;(analysis.fifthItems || []).slice(0, 5).forEach(it => {
    const name = getItemById(it.ids[0])?.jaName || it.names[0]
    console.log(`  ${name} id:${it.ids[0]} (pick:${it.pickRate}% win:${it.winRate}%)`)
  })

  console.log('\n=== 6th Items ===')
  ;(analysis.sixthItems || []).slice(0, 5).forEach(it => {
    const name = getItemById(it.ids[0])?.jaName || it.names[0]
    console.log(`  ${name} id:${it.ids[0]} (pick:${it.pickRate}% win:${it.winRate}%)`)
  })

  console.log('\n=== Built Core Build (6 items) ===')
  const ids = buildCoreBuildIds(analysis)
  ids.forEach(id => {
    const item = getItemById(id)
    console.log(`  ${id}: ${item?.jaName || 'Unknown'}`)
  })
}

main().catch(e => console.error(e))
