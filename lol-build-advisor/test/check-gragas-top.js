const { fetchChampionBuild, buildCoreBuildIds } = require('../electron/api/opggClient')
const { getItemById, setCacheDir, initPatchData } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  const analysis = await fetchChampionBuild('Gragas', 'top')
  if (!analysis) { console.log('No data'); return }

  console.log('=== Roles ===')
  analysis.roles.forEach(r => console.log(`  ${r.name} rate:${r.roleRate}% win:${r.winRate}%`))

  console.log('\n=== Core Items ===')
  analysis.coreItems.forEach((c, i) => {
    const names = c.ids.map(id => getItemById(id)?.jaName || id)
    console.log(`  Set${i+1}: ${names.join(' + ')} (pick:${c.pickRate}% win:${c.winRate}%)`)
  })

  console.log('\n=== Built Core Build (6 items) ===')
  const ids = buildCoreBuildIds(analysis)
  ids.forEach(id => {
    const item = getItemById(id)
    console.log(`  ${id}: ${item?.jaName || 'Unknown'}`)
  })
}

main().catch(console.error)
