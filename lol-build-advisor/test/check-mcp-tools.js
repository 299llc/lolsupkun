// OP.GG MCP で利用可能なツール一覧を取得
async function main() {
  const res = await fetch('https://mcp-api.op.gg/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    })
  })
  const data = await res.json()
  if (data.result && data.result.tools) {
    data.result.tools.forEach(t => {
      console.log(`\n=== ${t.name} ===`)
      console.log(`  ${t.description}`)
      if (t.inputSchema && t.inputSchema.properties) {
        console.log('  Params:', Object.keys(t.inputSchema.properties).join(', '))
        for (const [k, v] of Object.entries(t.inputSchema.properties)) {
          console.log(`    ${k}: ${v.description || v.type || ''}`)
        }
      }
    })
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

main().catch(e => console.error(e))
