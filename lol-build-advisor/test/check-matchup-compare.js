async function mcpCall(tool, args) {
  const res = await fetch('https://mcp-api.op.gg/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args } })
  })
  const text = await res.text()
  for (const line of text.split('\n').filter(l => l.trim())) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.result?.content) {
        for (const c of parsed.result.content) {
          if (c.type === 'text') return c.text
        }
      }
    } catch {}
  }
  return null
}

async function getLastItems(opponent) {
  const raw = await mcpCall('lol_get_lane_matchup_guide', {
    my_champion: 'ASHE', opponent_champion: opponent, position: 'adc', lang: 'ja_JP'
  })
  if (!raw) return []
  const data = JSON.parse(raw)
  return (data.data?.last_items || []).map(it => ({
    id: it.ids?.[0] || it.ids,
    name: (it.ids_names || it.names)?.[0],
    pick: it.pick_rate
  }))
}

async function main() {
  const opponents = ['JINX', 'CAITLYN', 'SYNDRA']
  for (const opp of opponents) {
    console.log(`\n=== vs ${opp} last_items ===`)
    const items = await getLastItems(opp)
    items.forEach((it, i) => console.log(`  ${i+1}. ${it.id}: ${it.name} (${it.pick})`))
    console.log(`  Total: ${items.length}`)
  }
}

main().catch(e => console.error(e))
