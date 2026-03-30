#!/usr/bin/env node
/**
 * suggestion フローテスト
 * preprocessor.buildItemInput() の初回/2回目以降の出力差分を検証し、
 * Gemini API で実際にAI呼び出しが成功するかテストする
 */
const path = require('path')
const fs = require('fs')
const { Preprocessor } = require('../electron/core/preprocessor')
const { AiClient } = require('../electron/api/aiClient')
const { GeminiProvider } = require('../electron/api/providers/geminiProvider')

// .env 読み込み
const envPath = path.join(__dirname, '..', '.env')
const env = {}
try {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim()
  }
} catch { console.error('.env not found'); process.exit(1) }

// モック gameState
const mockGameState = {
  me: {
    champion: 'Jinx', enName: 'Jinx', position: 'BOTTOM',
    level: 11, items: [{ id: 3031 }, { id: 3085 }], gold: 1200, status: 'behind'
  },
  enemies: [
    { champion: 'ゼド', enName: 'Zed', items: [], level: 12 },
    { champion: 'アーリ', enName: 'Ahri', items: [], level: 11 },
    { champion: 'リーシン', enName: 'LeeSin', items: [], level: 11 },
    { champion: 'ジンクス', enName: 'Jinx', items: [], level: 10 },
    { champion: 'ラカン', enName: 'Rakan', items: [], level: 9 },
  ],
  enemy: {
    damageProfile: { ad: 40, ap: 60 },
    healerCount: 1,
    ccLevel: 'medium',
    threats: [{ champion: 'ゼド', reason: 'fed', level: 12 }],
  },
  situation: 'behind',
}

const mockCoreBuild = [
  { id: '3031', name: 'IE' },
  { id: '3085', name: 'ハリケーン' },
  { id: '3046', name: 'ファントムダンサー' },
]

const mockSubstituteItems = [
  { id: '3139', jaName: 'マーキュリアルシミター' },
  { id: '3156', jaName: 'マウ=モータス' },
  { id: '3036', jaName: 'ドミニクリガード' },
  { id: '3071', jaName: 'ブラッククリーバー' },
  { id: '3153', jaName: 'ルインドキング' },
]

async function main() {
  const preprocessor = new Preprocessor()

  // ── Test 1: 初回呼び出しのデータ構造確認 ──
  console.log('=== Test 1: 初回の buildItemInput ===')
  const first = preprocessor.buildItemInput(mockGameState, mockCoreBuild, mockSubstituteItems)

  const firstKeys = Object.keys(first).sort()
  console.log('Keys:', firstKeys.join(', '))
  console.log('candidates数:', first.candidates.length)
  console.log('candidates:', first.candidates.map(c => `${c.name}(${c.tag})`).join(', '))

  // 静的フィールドの存在チェック
  const staticFields = ['enemy_skills', 'enemy_damage_profile', 'enemy_healing', 'enemy_cc_level', 'core_build']
  const hasAllStatic = staticFields.every(f => f in first)
  console.log('静的フィールド (初回):', hasAllStatic ? 'OK - 全て存在' : 'NG')
  for (const f of staticFields) {
    console.log(`  ${f}: ${f in first ? '✓' : '✗'}`)
  }

  // effect フィールドが削除されているか
  const hasEffect = first.candidates.some(c => 'effect' in c)
  console.log('effect削除:', hasEffect ? 'NG - まだ残っている' : 'OK - 削除済み')

  // ── Test 2: 2回目呼び出し（previousItemAdvice設定後） ──
  console.log('\n=== Test 2: 2回目の buildItemInput ===')
  preprocessor.setItemAdvice({ recommended: [{ id: '3046', reason: 'test' }], reasoning: 'test' })

  const second = preprocessor.buildItemInput(mockGameState, mockCoreBuild, mockSubstituteItems)
  const secondKeys = Object.keys(second).sort()
  console.log('Keys:', secondKeys.join(', '))

  const hasNoStatic = staticFields.every(f => !(f in second))
  console.log('静的フィールド (2回目):', hasNoStatic ? 'OK - 全て省略' : 'NG')
  for (const f of staticFields) {
    console.log(`  ${f}: ${f in second ? '✗ (残っている)' : '✓ (省略)'}`)
  }

  // previous_advice の存在
  console.log('previous_advice:', second.previous_advice ? 'OK - 存在' : 'NG')

  // ── Test 3: トークン量比較 ──
  console.log('\n=== Test 3: トークン量比較 ===')
  const firstJson = JSON.stringify(first, null, 2)
  const secondJson = JSON.stringify(second, null, 2)
  console.log(`初回 user message: ${firstJson.length} 文字`)
  console.log(`2回目 user message: ${secondJson.length} 文字`)
  console.log(`削減: ${firstJson.length - secondJson.length} 文字 (${Math.round((1 - secondJson.length / firstJson.length) * 100)}%)`)

  // ── Test 4: Gemini API 実呼び出し ──
  if (!env.GEMINI_PROXY_URL) {
    console.log('\n=== Test 4: スキップ (GEMINI_PROXY_URL 未設定) ===')
    return
  }

  console.log('\n=== Test 4: Gemini API 初回呼び出し ===')
  const provider = new GeminiProvider(env.GEMINI_PROXY_URL, env.GEMINI_APP_SECRET || '')
  const ok = await provider.validate()
  if (!ok) { console.error('Provider validation failed'); return }

  const model = env.GEMINI_SUGGESTION_MODEL || env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
  const client = new AiClient(provider, { suggestionModel: model })

  // 初回
  const result1 = await client.getSuggestion(first)
  console.log('初回結果:', result1 ? 'OK' : 'NG (null)')
  if (result1) {
    console.log('  recommended:', (result1.recommended || []).map(r => `${r.id}(${r.reason})`).join(', '))
    console.log('  reasoning:', result1.reasoning)
    console.log('  totalCalls:', result1.totalCalls)
  }

  // 2回目
  console.log('\n=== Test 5: Gemini API 2回目呼び出し ===')
  const result2 = await client.getSuggestion(second)
  console.log('2回目結果:', result2 ? 'OK' : 'NG (null)')
  if (result2) {
    console.log('  recommended:', (result2.recommended || []).map(r => `${r.id}(${r.reason})`).join(', '))
    console.log('  reasoning:', result2.reasoning)
    console.log('  totalCalls:', result2.totalCalls)
  }

  // ログからトークン使用量確認
  console.log('\n=== トークン使用量 ===')
  for (const log of client.getLogs()) {
    console.log(`  [${log.type}] in=${log.tokens?.input || '?'} out=${log.tokens?.output || '?'} cache_read=${log.tokens?.cache_read || 0} duration=${log.durationMs}ms`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
