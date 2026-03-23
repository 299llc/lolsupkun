// ── AI ビルド提案機能 ───────────────────────────────
// 設計書 6.3 に基づくイベント駆動トリガー

const { getItemById } = require('../api/patchData')
const { RECALL_GOLD_THRESHOLDS, isCompletedItem } = require('../core/config')

const SUGGESTION_DEBOUNCE_MS = 90000  // 90秒デバウンス
const SUGGESTION_FALLBACK_MS = 90000  // 90秒安全弁

let state = null
let broadcast = null
let syncInteractionSessionsFromClient = null

// トリガー用内部状態
const triggerState = {
  lastCallTime: 0,
  lastDeathCount: 0,
  lastMyItemHash: '',
  lastEnemyItemHash: '',
  lastKillDiff: 0,
  prevGold: 0,
}

function init(stateRef, broadcastFn) {
  state = stateRef
  broadcast = broadcastFn
  syncInteractionSessionsFromClient = stateRef._syncInteractionSessionsFromClient
}

function resetTriggerState() {
  triggerState.lastCallTime = 0
  triggerState.lastDeathCount = 0
  triggerState.lastMyItemHash = ''
  triggerState.lastEnemyItemHash = ''
  triggerState.lastKillDiff = 0
  triggerState.prevGold = 0
}

// ── トリガー判定 ──
// 設計書 6.3: プロの「ビルドを考え直す瞬間」に合わせたイベント駆動
function detectTrigger(gameData, gameState) {
  const now = Date.now()
  const timeSinceLast = now - triggerState.lastCallTime
  if (timeSinceLast < SUGGESTION_DEBOUNCE_MS && triggerState.lastCallTime > 0) return null

  const me = gameState.me
  const events = gameData.events?.Events || []

  // 1. 自分のアイテム完成: 次の購入先を提案
  const myItemHash = me.items.map(i => i.id).sort().join(',')
  if (myItemHash !== triggerState.lastMyItemHash && triggerState.lastMyItemHash !== '') {
    triggerState.lastMyItemHash = myItemHash
    return 'my_item_completed'
  }
  triggerState.lastMyItemHash = myItemHash

  // 2. デス後: 何に殺されたかを踏まえた方針再考
  const myDeaths = me.kda ? me.kda[1] : 0
  if (myDeaths > triggerState.lastDeathCount && triggerState.lastDeathCount > 0) {
    triggerState.lastDeathCount = myDeaths
    return 'my_death'
  }
  triggerState.lastDeathCount = myDeaths

  // 3. 敵パワースパイク: 敵の完成品アイテム購入を検出
  const enemyItemHash = gameState.enemies.map(e =>
    e.items.map(i => i.id).sort().join(',')
  ).join('|')
  if (enemyItemHash !== triggerState.lastEnemyItemHash && triggerState.lastEnemyItemHash !== '') {
    triggerState.lastEnemyItemHash = enemyItemHash
    return 'enemy_item_change'
  }
  triggerState.lastEnemyItemHash = enemyItemHash

  // 4. リコール判断: ゴールド閾値超え
  const currGold = me.gold || 0
  const prevGold = triggerState.prevGold
  triggerState.prevGold = currGold
  for (const t of RECALL_GOLD_THRESHOLDS) {
    if (prevGold < t && currGold >= t && prevGold > 0) {
      return `gold_threshold_${t}`
    }
  }

  // 5. テンポ変化: キル差が大きく動いた直後
  const allyKills = gameState.ally?.kills || 0
  const enemyKills = gameState.enemy?.kills || 0
  const killDiff = allyKills - enemyKills
  if (Math.abs(killDiff - triggerState.lastKillDiff) >= 3 && triggerState.lastKillDiff !== 0) {
    triggerState.lastKillDiff = killDiff
    return 'tempo_shift'
  }
  triggerState.lastKillDiff = killDiff

  // 6. 安全弁: 90秒間上記イベントがなければ1回
  if (timeSinceLast >= SUGGESTION_FALLBACK_MS) {
    return 'fallback_90s'
  }

  return null
}

// ── メイン処理 ──
function handleAiSuggestion(gameData) {
  if (!state.currentMatchAiAllowed) return

  // 15分未満はAI提案しない（1〜3品目はコアビルドで十分）
  const gameTime = gameData.gameData?.gameTime || 0
  if (gameTime < 900) return

  if (state.aiPending || !state.aiClient || !state.aiEnabled || !state.currentCoreBuild) return

  const gameState = state.currentGameState
  if (!gameState) return

  // イベント駆動トリガー判定
  const trigger = detectTrigger(gameData, gameState)

  // 初回は trigger がなくてもまだ提案がなければ実行
  if (!trigger && state.lastSuggestion) return

  // 前処理: 構造化入力を生成
  const coreBuild = state.currentCoreBuild.ids.map((id, i) => ({ id, name: state.currentCoreBuild.names[i] }))
  const substituteItems = state.aiClient.getSubstituteItems() || []
  const structuredInput = state.preprocessor.buildItemInput(gameState, coreBuild, substituteItems)
  const candidateIds = structuredInput.candidates.map(c => c.id)

  // 重複スキップ: 候補リスト+状況が前回と同じならAPI呼び出しを省略
  const suggFingerprint = `${candidateIds.join(',')}|${structuredInput.situation}|${structuredInput.me?.level || 0}|${(structuredInput.me?.items || []).map(i => i.id).join(',')}`
  if (suggFingerprint === state._lastSuggFingerprint && state.lastSuggestion) {
    return
  }
  state._lastSuggFingerprint = suggFingerprint

  triggerState.lastCallTime = Date.now()
  console.log(`[Pipeline] Item input: trigger=${trigger || 'initial'} candidates=[${candidateIds.join(',')}] situation=${structuredInput.situation}`)

  state.aiPending = true
  broadcast('ai:loading', true)
  state.aiClient.getSuggestion(structuredInput).then(rawResult => {
    syncInteractionSessionsFromClient()
    // 後処理
    const previousResult = state.postprocessor.lastItemResult
    const processedResult = state.postprocessor.processItemResult(rawResult, candidateIds, previousResult)

    if (processedResult) {
      // 次回フィードバック用に保存
      state.preprocessor.setItemAdvice(processedResult)

      // UIに送るデータを整形
      const s = { ...processedResult }
      if (s.recommended) {
        s.recommended = s.recommended.map(r => {
          const item = getItemById(String(r.id))
          return { ...r, name: item?.jaName || r.id, image: item?.image || '' }
        })
      }
      s.gameTime = gameData.gameData?.gameTime || 0
      s.history = rawResult?.history || {}
      s.totalCalls = rawResult?.totalCalls || 0
      state.lastSuggestion = s
      const recNames = (s.recommended || []).map(r => r.name || r.id).join(', ')
      console.log(`[Pipeline] Item processed: t=${Math.floor(s.gameTime)}s trigger=${trigger || 'initial'} recommended=[${recNames}] reason=${(s.reasoning || '').substring(0, 80)}`)
      broadcast('ai:suggestion', s)
    }
    state.aiPending = false
    broadcast('ai:loading', false)
  }).catch(err => {
    state.aiPending = false
    broadcast('ai:loading', false)
    if (err.authError) {
      console.error('[AiSuggestion] Auth error - stopping. Check provider settings.')
      state.aiEnabled = false
      broadcast('ai:error', { type: 'auth', message: 'APIキーが無効またはプロバイダー未設定です。' })
    } else {
      broadcast('ai:suggestion', { error: err.message })
    }
  })
}

module.exports = {
  init,
  handleAiSuggestion,
  resetTriggerState,
}
