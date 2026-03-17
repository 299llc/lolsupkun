const { fetchChampionBuild } = require('../electron/api/opggClient')

async function main() {
  const analysis = await fetchChampionBuild('Ashe', 'adc')
  if (!analysis) { console.log('No data'); return }

  console.log('coreItems count:', analysis.coreItems.length)
  console.log('boots count:', analysis.boots.length)
  console.log('starterItems count:', analysis.starterItems.length)
  console.log('lastItems count:', analysis.lastItems.length)
  console.log('fourthItems count:', (analysis.fourthItems || []).length)
  console.log('fifthItems count:', (analysis.fifthItems || []).length)
  console.log('sixthItems count:', (analysis.sixthItems || []).length)

  console.log('\n=== ALL 4th Items ===')
  ;(analysis.fourthItems || []).forEach((it, i) =>
    console.log(`  ${i+1}. ${it.names.join(',')} ids:${it.ids} pick:${it.pickRate}%`))

  console.log('\n=== ALL 5th Items ===')
  ;(analysis.fifthItems || []).forEach((it, i) =>
    console.log(`  ${i+1}. ${it.names.join(',')} ids:${it.ids} pick:${it.pickRate}%`))

  console.log('\n=== ALL 6th Items ===')
  ;(analysis.sixthItems || []).forEach((it, i) =>
    console.log(`  ${i+1}. ${it.names.join(',')} ids:${it.ids} pick:${it.pickRate}%`))

  console.log('\n=== ALL Last Items ===')
  ;(analysis.lastItems || []).forEach((it, i) =>
    console.log(`  ${i+1}. ${it.names.join(',')} ids:${it.ids} pick:${it.pickRate}%`))
}

main().catch(e => console.error(e))
