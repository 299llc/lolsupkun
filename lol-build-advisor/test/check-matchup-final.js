const { fetchMatchupItems } = require('../electron/api/opggClient')
const { setCacheDir, initPatchData, getItemById } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  // Ashe vs Jinx (ADC)
  const items = await fetchMatchupItems('Ashe', 'Jinx', 'BOTTOM')
  if (!items) { console.log('No data'); return }

  // 素材フィルタ
  const completed = items.filter(it => {
    const patchItem = getItemById(it.id)
    if (!patchItem) return true
    const isComplete = patchItem.gold?.total >= 2500
    const isBoot = (patchItem.tags || []).includes('Boots') && patchItem.gold?.total >= 900
    return isComplete || isBoot
  })

  console.log(`\nAshe vs Jinx: ${items.length} raw → ${completed.length} completed`)
  completed.forEach((it, i) => console.log(`  ${i+1}. ${it.id}: ${it.jaName}`))
}

main().catch(e => console.error(e))
