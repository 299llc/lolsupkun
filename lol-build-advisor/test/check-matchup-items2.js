const fs = require('fs')

const raw = fs.readFileSync('test/ashe-vs-jinx.txt', 'utf-8')
const data = JSON.parse(raw)
const d = data.data

console.log('=== Keys ===')
console.log(Object.keys(d))

console.log('\n=== core_items ===')
d.core_items?.forEach((c, i) => console.log(`  ${i+1}. ${JSON.stringify(c.ids_names || c.names)} pick:${c.pick_rate}`))

console.log('\n=== boots ===')
d.boots?.forEach((b, i) => console.log(`  ${i+1}. ${JSON.stringify(b.ids_names || b.names)} pick:${b.pick_rate}`))

console.log('\n=== last_items ===')
d.last_items?.forEach((it, i) => console.log(`  ${i+1}. id:${it.ids} ${JSON.stringify(it.ids_names || it.names)} pick:${it.pick_rate}`))

// fourth/fifth/sixth があるか
console.log('\n=== fourth_items ===', d.fourth_items?.length || 'N/A')
d.fourth_items?.forEach((it, i) => console.log(`  ${i+1}. id:${it.ids} ${JSON.stringify(it.ids_names || it.names)} pick:${it.pick_rate}`))

console.log('\n=== fifth_items ===', d.fifth_items?.length || 'N/A')
d.fifth_items?.forEach((it, i) => console.log(`  ${i+1}. id:${it.ids} ${JSON.stringify(it.ids_names || it.names)} pick:${it.pick_rate}`))

console.log('\n=== sixth_items ===', d.sixth_items?.length || 'N/A')
d.sixth_items?.forEach((it, i) => console.log(`  ${i+1}. id:${it.ids} ${JSON.stringify(it.ids_names || it.names)} pick:${it.pick_rate}`))
