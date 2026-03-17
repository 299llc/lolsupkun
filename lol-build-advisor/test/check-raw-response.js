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
  console.log('=== Vayne ADC raw response ===\n')
  const raw = await mcpCall('lol_get_champion_analysis', {
    champion: 'VAYNE',
    position: 'adc',
    game_mode: 'ranked'
  })
  console.log(raw)
}

main().catch(console.error)
