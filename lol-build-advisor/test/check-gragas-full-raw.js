const MCP_ENDPOINT = 'https://mcp-api.op.gg/mcp'
let requestId = 0

async function main() {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++requestId,
      method: 'tools/call',
      params: { name: 'lol_get_champion_analysis', arguments: { champion: 'GRAGAS', position: 'mid', game_mode: 'ranked' } }
    })
  })
  const text = await res.text()
  console.log(text)
}

main().catch(console.error)
