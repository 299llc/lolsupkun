const { setCacheDir, initPatchData, getCompletedItems, getItemById, getAllChampions, getAllItems } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  const items = getCompletedItems()
  const allItems = getAllItems()

  // マーキュリーシミターを探す
  const mercurial = items.find(it => it.jaName.includes('マーキュリー') || it.jaName.includes('シミター'))
  console.log('マーキュリーシミター:', mercurial)
  if (mercurial) {
    const detail = allItems[mercurial.id]
    console.log('Stats:', JSON.stringify(detail.stats))
    console.log('Tags:', detail.tags)
    console.log('Description:', detail.description)
  }

  // Ashe (attack:7, magic:3) でフィルタ後に含まれるか確認
  const champs = getAllChampions()
  const ashe = Object.values(champs).find(c => c.enName === 'Ashe')
  console.log('\nAshe info:', JSON.stringify(ashe.info))
  const { attack = 5, magic = 5 } = ashe.info
  const isAD = attack >= magic
  const isAP = magic > attack
  const isMixed = Math.abs(attack - magic) <= 2

  if (mercurial) {
    const item = allItems[mercurial.id]
    const stats = item.stats || {}
    const tags = item.tags || []
    const hasDefense = stats.FlatArmorMod > 0 || stats.FlatSpellBlockMod > 0 || stats.FlatHPPoolMod > 200
    const isApItem = stats.FlatMagicDamageMod > 0 && !stats.FlatPhysicalDamageMod && !stats.FlatCritChanceMod
    const isAdCritItem = stats.FlatPhysicalDamageMod > 0 || stats.FlatCritChanceMod > 0 || stats.PercentAttackSpeedMod > 0

    console.log('\nFilter check:')
    console.log('  hasDefense:', hasDefense)
    console.log('  isApItem:', isApItem)
    console.log('  isAdCritItem:', isAdCritItem)
    console.log('  → included for Ashe:', hasDefense || tags.includes('Boots') || (isMixed ? true : !(isAD && isApItem)))
  }

  // QSS系アイテムも探す
  console.log('\n=== QSS/CC解除系アイテム ===')
  items.forEach(it => {
    const detail = allItems[it.id]
    if (it.jaName.includes('QSS') || it.jaName.includes('シミター') || it.jaName.includes('マーキュリー') ||
        (detail.description && detail.description.includes('解除'))) {
      console.log(`  ${it.id}: ${it.jaName} stats:${JSON.stringify(detail.stats)} tags:${detail.tags}`)
    }
  })
}

main().catch(e => console.error(e))
