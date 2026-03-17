const d = require('C:/Users/music/AppData/Roaming/lol-build-advisor/patch-cache/spells.json')
const data = d._data

const healRegex = /回復|ヒール|体力を.*回復|ライフスティール/
const antiHealRegex = /回復.*低下|回復.*減少|回復.*阻害|回復.*無効|自己回復.*低下|体力自動回復.*低下/
const hasHeal = (text) => healRegex.test(text) && !antiHealRegex.test(text)

// Check specific champions
const check = ['Varus', 'Katarina', 'Kled', 'MissFortune', 'Soraka', 'Aatrox', 'Nami', 'Fiora']
for (const name of check) {
  const v = data[name]
  if (!v) continue
  const allText = [v.passive.desc, ...v.spells.map(s => s.desc)].join(' ')
  const sources = []
  if (hasHeal(v.passive.desc)) sources.push('Passive')
  v.spells.forEach(s => { if (hasHeal(s.desc)) sources.push(s.key) })

  const oldMatch = healRegex.test(allText)
  const newMatch = sources.length > 0
  if (oldMatch !== newMatch) {
    console.log(`${name}: OLD=${oldMatch} NEW=${newMatch} ${sources.length ? sources.join(',') : '(none)'}`)
  } else if (newMatch) {
    console.log(`${name}: heal(${sources.join(',')})`)
  }
}

// Find all false positives (old=true, new=false)
console.log('\n=== False positives fixed ===')
for (const [name, v] of Object.entries(data)) {
  const allText = [v.passive.desc, ...v.spells.map(s => s.desc)].join(' ')
  const oldMatch = healRegex.test(allText)
  const sources = []
  if (hasHeal(v.passive.desc)) sources.push('Passive')
  v.spells.forEach(s => { if (hasHeal(s.desc)) sources.push(s.key) })
  const newMatch = sources.length > 0
  if (oldMatch && !newMatch) {
    console.log(`  ${name}: was false positive`)
  }
}
