// OP.GG MCP の生レスポンスを確認
const { spawn } = require('child_process')

// MCP直接呼び出し（opggClientのmcpCall相当）
function mcpCall(tool, args) {
  return new Promise((resolve, reject) => {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    const child = spawn(npx, ['-y', '@anthropic-ai/claude-code', 'mcp', 'call', 'op.gg', tool, JSON.stringify(args)], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let out = ''
    let err = ''
    child.stdout.on('data', d => out += d)
    child.stderr.on('data', d => err += d)
    child.on('close', code => {
      if (code !== 0) reject(new Error(`MCP exit ${code}: ${err}`))
      else resolve(out)
    })
  })
}

async function main() {
  console.log('Calling MCP lol_get_champion_analysis for Ashe ADC...')
  const raw = await mcpCall('lol_get_champion_analysis', {
    champion: 'ASHE',
    position: 'adc',
    game_mode: 'ranked'
  })

  // 生データをファイルに保存して確認
  const fs = require('fs')
  fs.writeFileSync('test/ashe-raw-response.txt', raw, 'utf-8')
  console.log('Raw response saved to test/ashe-raw-response.txt')
  console.log('Length:', raw.length, 'chars')

  // CoreItems の出現回数を数える
  const coreItemMatches = raw.match(/CoreItems\(/g)
  console.log('CoreItems() occurrences:', coreItemMatches ? coreItemMatches.length : 0)

  // 配列グループ [...] の数を確認
  // fourth_items, fifth_items, sixth_items のセクションを探す
  const sections = ['core_items', 'boots', 'starter_items', 'last_items', 'fourth_items', 'fifth_items', 'sixth_items']
  sections.forEach(s => {
    const idx = raw.indexOf(s)
    console.log(`${s}: found at index ${idx}`)
  })
}

main().catch(e => console.error(e.message))
