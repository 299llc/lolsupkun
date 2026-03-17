const MCP_ENDPOINT = 'https://mcp-api.op.gg/mcp'
let requestId = 0

async function mcpCall(toolName, args) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++requestId,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  })
  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.result?.content) {
        for (const c of parsed.result.content) {
          if (c.type === 'text') return c.text
        }
      }
    } catch (e) { /* skip */ }
  }
  return null
}

async function main() {
  const raw = await mcpCall('lol_get_champion_analysis', {
    champion: 'GRAGAS',
    position: 'mid',
    game_mode: 'ranked'
  })

  // CoreItems部分だけ抽出して見やすく表示
  const coreMatches = [...raw.matchAll(/CoreItems\(\[([^\]]*)\],\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)/g)]
  console.log(`=== All CoreItems found: ${coreMatches.length} ===\n`)
  coreMatches.forEach((m, i) => {
    const ids = m[1]
    const names = m[2]
    const play = m[3]
    const win = m[4]
    const pickRate = m[5]
    console.log(`#${i+1}: ids=[${ids}] names=[${names}] play=${play} win=${win} pick=${pickRate}`)
  })

  // 配列グループも確認
  console.log('\n=== Array groups ===')
  const arrayGroupRegex = /\[(CoreItems\([^)]+\)(?:,CoreItems\([^)]+\))*)\]/g
  let groupIdx = 0
  let gm
  while ((gm = arrayGroupRegex.exec(raw)) !== null) {
    groupIdx++
    console.log(`\nGroup ${groupIdx} (pos ${gm.index}):`)
    const itemRegex = /CoreItems\(\[([^\]]*)\],\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)/g
    let im
    while ((im = itemRegex.exec(gm[1])) !== null) {
      console.log(`  ids=[${im[1]}] names=[${im[2]}] play=${im[3]} pick=${im[5]}`)
    }
  }
}

main().catch(console.error)
