const { setCacheDir, initPatchData, getCompletedItems, getAllItems } = require('../electron/api/patchData')
const path = require('path')
const os = require('os')

async function main() {
  setCacheDir(path.join(os.homedir(), 'AppData/Roaming/lol-build-advisor/patch-cache'))
  await initPatchData()

  const items = getCompletedItems()
  const allItems = getAllItems()

  // 防御ステータスを持つアイテム (Armor, MR, HP>200)
  const defenseItems = items.filter(it => {
    const item = allItems[it.id]
    if (!item) return false
    const stats = item.stats || {}
    return stats.FlatArmorMod > 0 || stats.FlatSpellBlockMod > 0 || stats.FlatHPPoolMod > 200
  })

  console.log(`=== 防御ステータス持ちアイテム (${defenseItems.length}件) ===\n`)

  defenseItems.forEach(it => {
    const item = allItems[it.id]
    const stats = item.stats || {}
    const parts = []
    if (stats.FlatArmorMod) parts.push(`AR:${stats.FlatArmorMod}`)
    if (stats.FlatSpellBlockMod) parts.push(`MR:${stats.FlatSpellBlockMod}`)
    if (stats.FlatHPPoolMod) parts.push(`HP:${stats.FlatHPPoolMod}`)
    if (stats.FlatPhysicalDamageMod) parts.push(`AD:${stats.FlatPhysicalDamageMod}`)
    if (stats.FlatMagicDamageMod) parts.push(`AP:${stats.FlatMagicDamageMod}`)
    if (stats.PercentAttackSpeedMod) parts.push(`AS:${Math.round(stats.PercentAttackSpeedMod*100)}%`)
    if (stats.FlatCritChanceMod) parts.push(`Crit:${Math.round(stats.FlatCritChanceMod*100)}%`)
    console.log(`  ${it.id}: ${it.jaName}  [${parts.join(', ')}]`)
  })
}

main().catch(e => console.error(e))
