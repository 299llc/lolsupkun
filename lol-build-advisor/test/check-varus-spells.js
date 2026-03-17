const d = require('C:/Users/music/AppData/Roaming/lol-build-advisor/patch-cache/spells.json')
const v = d._data?.Varus
if (!v) { console.log('no Varus data'); process.exit() }

const healRegex = /回復|ヒール|体力を.*回復|ライフスティール/

console.log('=== Passive ===')
console.log(v.passive.desc)
if (healRegex.test(v.passive.desc)) console.log('*** PASSIVE MATCH ***')

v.spells.forEach(s => {
  console.log(`\n=== ${s.key} (${s.name}) ===`)
  console.log(s.desc)
  if (healRegex.test(s.desc)) console.log('*** MATCH ***')
})
