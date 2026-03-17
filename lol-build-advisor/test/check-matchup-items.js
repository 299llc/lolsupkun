const fs = require('fs')

async function mcpCall(tool, args) {
  const res = await fetch('https://mcp-api.op.gg/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'tools/call',
      params: { name: tool, arguments: args }
    })
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

async function main() {
  // 1. matchup guide にアイテム情報あるか
  console.log('=== lol_get_lane_matchup_guide: Ashe vs Jinx ===')
  const matchup = await mcpCall('lol_get_lane_matchup_guide', {
    my_champion: 'ASHE', opponent_champion: 'JINX', position: 'adc', lang: 'ja_JP'
  })
  if (matchup) {
    fs.writeFileSync('test/ashe-vs-jinx.txt', matchup, 'utf-8')
    console.log('Length:', matchup.length)
    // アイテム関連の部分だけ抜粋
    if (matchup.includes('item') || matchup.includes('Item') || matchup.includes('アイテム')) {
      console.log('Contains item info')
    }
    // 最初の500文字だけ表示
    console.log(matchup.substring(0, 800))
  }

  // 2. lol_list_items でどのくらい返ってくるか（最初だけ）
  console.log('\n\n=== lol_list_items ===')
  const itemList = await mcpCall('lol_list_items', { lang: 'ja_JP', map: 'SUMMONERS_RIFT' })
  if (itemList) {
    console.log('Length:', itemList.length)
    // CoreItems の数を数える
    const itemMatches = itemList.match(/Item\(/g) || itemList.match(/id=/g) || []
    console.log('Item entries:', itemMatches.length)
    // 最初の500文字
    console.log(itemList.substring(0, 500))
  }
}

main().catch(e => console.error(e))
