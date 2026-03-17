async function main() {
  const res = await fetch('https://mcp-api.op.gg/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'lol_list_champion_details', arguments: { champion_names: 'RIVEN,VI,SMOLDER,AURORA,BARD,KATARINA,TEEMO,CORKI,MORDEKAISER' } } })
  })
  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.result?.content) {
        for (const c of parsed.result.content) {
          if (c.type === 'text') {
            const t = c.text
            // Info(attack,defense,magic,difficulty) を各チャンプ付近から抽出
            const champRegex = /Champion\(\d+,"(\w+)","[^"]*","[^"]*","[^"]*",\[([^\]]*)\],"[^"]*","([^"]*)",Info\((\d+),(\d+),(\d+),(\d+)\)/g
            let m
            while ((m = champRegex.exec(t)) !== null) {
              const tags = m[2].replace(/"/g, '')
              console.log(`${m[1]} | tags=${tags} | partype=${m[3]} | atk=${m[4]} def=${m[5]} mag=${m[6]}`)
            }
          }
        }
      }
    } catch(e) {}
  }
}
main()
