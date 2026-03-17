const { fetchChampionBuild } = require('../electron/api/opggClient')
const { getItemById, setCacheDir, initPatchData } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function check(champ, pos) {
  const analysis = await fetchChampionBuild(champ, pos)
  if (!analysis) { console.log(`${champ} ${pos}: No data`); return }

  console.log(`\n=== ${champ} ${pos} : ${analysis.coreItems.length} core sets ===`)
  analysis.coreItems.forEach((c, i) => {
    const names = c.ids.map(id => getItemById(id)?.jaName || id)
    console.log(`  Set${i+1}: ${names.join(' + ')} (pick:${c.pickRate}% win:${c.winRate}% play:${c.play})`)
  })
}

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  await check('Gragas', 'top')
  await check('Vayne', 'adc')
  await check('Ashe', 'adc')
  await check('Ezreal', 'adc')
  await check('Ahri', 'mid')
}

main().catch(console.error)
