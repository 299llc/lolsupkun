#!/usr/bin/env node
/**
 * ゲームログからAPI使用量・コストを算出
 * Usage: node scripts/calc-cost.js <logfile>
 * Example: node scripts/calc-cost.js "%APPDATA%/lol-build-advisor/game-logs/game_2026-03-16_15-09-15.log"
 */

const fs = require('fs')
const path = require('path')

// Haiku 4.5 pricing (per million tokens)
const PRICING = {
  input:          1.00,   // $/MTok
  output:         5.00,   // $/MTok
  cache_write:    1.25,   // $/MTok
  cache_read:     0.10,   // $/MTok
}

const USD_TO_JPY = 150

function parseLog(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const calls = []
  const pattern = /\[Claude:(\w+)\] tokens: in=(\d+) out=(\d+) cache_read=(\d+) cache_create=(\d+)/

  for (const line of lines) {
    const m = line.match(pattern)
    if (m) {
      calls.push({
        type: m[1],
        input: parseInt(m[2]),
        output: parseInt(m[3]),
        cache_read: parseInt(m[4]),
        cache_create: parseInt(m[5]),
      })
    }
  }
  return calls
}

function calcCost(calls) {
  const byType = {}
  let totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheCreate = 0

  for (const c of calls) {
    if (!byType[c.type]) {
      byType[c.type] = { count: 0, input: 0, output: 0, cache_read: 0, cache_create: 0 }
    }
    const t = byType[c.type]
    t.count++
    // input_tokens = non-cached input (total - cache_read)
    const nonCachedInput = Math.max(0, c.input - c.cache_read)
    t.input += nonCachedInput
    t.output += c.output
    t.cache_read += c.cache_read
    t.cache_create += c.cache_create

    totalInput += nonCachedInput
    totalOutput += c.output
    totalCacheRead += c.cache_read
    totalCacheCreate += c.cache_create
  }

  const costInput = (totalInput / 1_000_000) * PRICING.input
  const costOutput = (totalOutput / 1_000_000) * PRICING.output
  const costCacheRead = (totalCacheRead / 1_000_000) * PRICING.cache_read
  const costCacheCreate = (totalCacheCreate / 1_000_000) * PRICING.cache_write
  const totalCost = costInput + costOutput + costCacheRead + costCacheCreate

  // キャッシュなしの場合のコスト
  const noCacheInput = totalInput + totalCacheRead
  const noCacheCostInput = (noCacheInput / 1_000_000) * PRICING.input
  const noCacheTotalCost = noCacheCostInput + costOutput

  return {
    byType,
    totals: { input: totalInput, output: totalOutput, cache_read: totalCacheRead, cache_create: totalCacheCreate },
    cost: { input: costInput, output: costOutput, cache_read: costCacheRead, cache_create: costCacheCreate, total: totalCost },
    noCache: { input: noCacheInput, total: noCacheTotalCost },
    savings: noCacheTotalCost - totalCost,
    callCount: calls.length,
  }
}

// Main
const logFile = process.argv[2]
if (!logFile) {
  // デフォルト: 最新のログファイルを探す
  const logDir = path.join(process.env.APPDATA || '', 'lol-build-advisor', 'game-logs')
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log')).sort().reverse()
    if (files.length > 0) {
      console.log(`Latest log: ${files[0]}`)
      run(path.join(logDir, files[0]))
    } else {
      console.error('No log files found in', logDir)
    }
  } else {
    console.error('Usage: node scripts/calc-cost.js <logfile>')
    console.error('   or: node scripts/calc-cost.js  (uses latest log)')
  }
} else {
  run(logFile)
}

function run(filePath) {
  console.log(`\n=== Game Cost Report ===`)
  console.log(`File: ${path.basename(filePath)}\n`)

  const calls = parseLog(filePath)
  if (calls.length === 0) {
    console.log('No Claude API calls found in log.')
    return
  }

  const r = calcCost(calls)

  // タイプ別
  console.log('--- API Calls by Type ---')
  for (const [type, t] of Object.entries(r.byType)) {
    const typeCost = ((t.input / 1e6) * PRICING.input) +
                     ((t.output / 1e6) * PRICING.output) +
                     ((t.cache_read / 1e6) * PRICING.cache_read) +
                     ((t.cache_create / 1e6) * PRICING.cache_write)
    console.log(`  ${type}: ${t.count} calls | in=${t.input} out=${t.output} cache_read=${t.cache_read} cache_create=${t.cache_create} | $${typeCost.toFixed(6)}`)
  }

  // トータル
  console.log(`\n--- Token Totals ---`)
  console.log(`  Total calls:    ${r.callCount}`)
  console.log(`  Input (fresh):  ${r.totals.input} tokens`)
  console.log(`  Output:         ${r.totals.output} tokens`)
  console.log(`  Cache read:     ${r.totals.cache_read} tokens`)
  console.log(`  Cache create:   ${r.totals.cache_create} tokens`)

  // コスト
  console.log(`\n--- Cost Breakdown ---`)
  console.log(`  Input:          $${r.cost.input.toFixed(6)}`)
  console.log(`  Output:         $${r.cost.output.toFixed(6)}`)
  console.log(`  Cache read:     $${r.cost.cache_read.toFixed(6)}`)
  console.log(`  Cache write:    $${r.cost.cache_create.toFixed(6)}`)
  console.log(`  ─────────────────────`)
  console.log(`  Total:          $${r.cost.total.toFixed(6)} (¥${Math.round(r.cost.total * USD_TO_JPY)})`)

  // キャッシュ効果
  console.log(`\n--- Cache Savings ---`)
  console.log(`  Without cache:  $${r.noCache.total.toFixed(6)} (¥${Math.round(r.noCache.total * USD_TO_JPY)})`)
  console.log(`  With cache:     $${r.cost.total.toFixed(6)} (¥${Math.round(r.cost.total * USD_TO_JPY)})`)
  console.log(`  Saved:          $${r.savings.toFixed(6)} (¥${Math.round(r.savings * USD_TO_JPY)}) = ${((r.savings / r.noCache.total) * 100).toFixed(1)}% off`)

  // 月間予測
  const gamesPerMonth = 30
  console.log(`\n--- Monthly Estimate (${gamesPerMonth} games) ---`)
  console.log(`  $${(r.cost.total * gamesPerMonth).toFixed(4)} (¥${Math.round(r.cost.total * gamesPerMonth * USD_TO_JPY)})`)
}
