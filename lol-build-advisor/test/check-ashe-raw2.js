// OP.GG MCP の生レスポンスを直接取得して保存
const fs = require('fs')

async function main() {
  const res = await fetch('https://mcp-api.op.gg/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'lol_get_champion_analysis', arguments: { champion: 'ASHE', position: 'adc', game_mode: 'ranked' } }
    })
  })

  const text = await res.text()
  fs.writeFileSync('test/ashe-raw-response.txt', text, 'utf-8')
  console.log('Saved raw response (' + text.length + ' chars)')

  // パースしてcontent.textだけ取り出す
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.result && parsed.result.content) {
        for (const c of parsed.result.content) {
          if (c.type === 'text') {
            fs.writeFileSync('test/ashe-content.txt', c.text, 'utf-8')
            console.log('Saved content text (' + c.text.length + ' chars)')

            // CoreItems の出現回数
            const matches = c.text.match(/CoreItems\(/g)
            console.log('CoreItems() occurrences:', matches ? matches.length : 0)

            // 配列グループを探す
            const arrayGroups = c.text.match(/\[CoreItems\(/g)
            console.log('[CoreItems( occurrences:', arrayGroups ? arrayGroups.length : 0)
          }
        }
      }
    } catch {}
  }
}

main().catch(e => console.error(e))
