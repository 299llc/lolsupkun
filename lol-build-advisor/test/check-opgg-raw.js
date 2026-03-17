// OP.GG MCP の生レスポンスを確認するテスト
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
    } catch {}
  }
  return null
}

async function main() {
  const champ = process.argv[2] || 'ASHE'
  const pos = process.argv[3] || 'adc'

  console.log(`=== ${champ} ${pos} ===\n`)
  const raw = await mcpCall('lol_get_champion_analysis', {
    champion: champ,
    position: pos,
    game_mode: 'ranked'
  })

  if (!raw) {
    console.log('No data returned')
    return
  }

  // 生データ全体
  console.log(raw)
}

main().catch(console.error)
