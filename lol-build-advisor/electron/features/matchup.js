// ── マッチアップ機能（Tip + アイテム）──────────────
// main.js から切り出した handleMatchupTip, handleMatchupItems,
// findLaneOpponent, injectCounterItems, buildFallbackSubstituteItems, useFallbackSubstituteItems

const { getItemById, getSpells } = require('../api/patchData')
const { fetchMatchupItems, fetchMatchupWinRate } = require('../api/opggClient')
const { isCompletedItem } = require('../core/config')

let state = null
let broadcast = null

function init(stateRef, broadcastFn) {
  state = stateRef
  broadcast = broadcastFn
}

// ── 対面チャンプ検索 ──
function findLaneOpponent(enemies, position, logTag) {
  let opponent = enemies.find(e => e.position === position)
  if (!opponent?.enName) {
    opponent = enemies.find(e => e.enName)
    if (opponent) {
      console.log(`[${logTag}] No exact lane match for ${position}, using ${opponent.enName} as fallback`)
    }
  }
  return opponent?.enName ? opponent : null
}

// ── ブーツ候補抽出 ──
function extractBootsCandidates(analysis, coreIds, seen) {
  const boots = []
  for (const entry of (analysis?.boots || [])) {
    for (const id of (entry.ids || [])) {
      const idStr = String(id)
      if (seen.has(idStr) || coreIds.has(idStr)) continue
      seen.add(idStr)
      const patchItem = getItemById(idStr)
      if (!patchItem) continue
      boots.push({ id: idStr, jaName: patchItem.jaName || idStr, desc: patchItem.fullDesc || patchItem.description || '' })
    }
  }
  return boots
}

// ── フォールバック候補 ──
function buildFallbackSubstituteItems() {
  const analysis = state.currentAnalysis
  if (!analysis) return []

  const seen = new Set()
  const coreIds = new Set((state.currentCoreBuild?.ids || []).map(String))
  const items = extractBootsCandidates(analysis, coreIds, seen)

  const sources = [
    ...(analysis.fourthItems || []),
    ...(analysis.fifthItems || []),
    ...(analysis.sixthItems || []),
    ...(analysis.lastItems || [])
  ]

  for (const entry of sources) {
    for (const id of (entry.ids || [])) {
      const idStr = String(id)
      if (seen.has(idStr) || coreIds.has(idStr)) continue
      seen.add(idStr)
      const patchItem = getItemById(idStr)
      if (!isCompletedItem(patchItem)) continue
      items.push({ id: idStr, jaName: patchItem.jaName || idStr, desc: patchItem.fullDesc || patchItem.description || '' })
    }
  }
  return items.slice(0, 15)
}

function useFallbackSubstituteItems() {
  const fallback = buildFallbackSubstituteItems()
  if (fallback.length > 0) {
    if (state.aiClient) state.aiClient.setSubstituteItems(fallback)
    const candidatesForUI = fallback.map(it => {
      const patchItem = getItemById(it.id)
      return { id: it.id, name: it.jaName, image: patchItem?.image || null }
    })
    broadcast('substitute:items', candidatesForUI)
    console.log(`[MatchupItems] Fallback: ${fallback.length} items from OP.GG analysis`)
  } else {
    broadcast('substitute:error', 'マッチアップデータを取得できませんでした')
  }
}

// ── マッチアップアイテム ──
function handleMatchupItems(me, resolvedPosition, enemies) {
  if (state.matchupItemsLoaded || !me.enName || !resolvedPosition || !state.aiClient || !state.currentCoreBuild) return

  const laneOpponent = findLaneOpponent(enemies, resolvedPosition, 'MatchupItems')
  if (!laneOpponent) return

  state.matchupItemsLoaded = true
  fetchMatchupItems(me.enName, laneOpponent.enName, resolvedPosition).then(items => {
    if (items && items.length > 0) {
      const coreIds = new Set((state.currentCoreBuild?.ids || []).map(String))
      const seen = new Set()
      const bootsItems = extractBootsCandidates(state.currentAnalysis, coreIds, seen)

      const completed = items.reduce((acc, it) => {
        if (acc.length >= 15 || coreIds.has(String(it.id)) || seen.has(String(it.id))) return acc
        seen.add(String(it.id))
        const patchItem = getItemById(it.id)
        if (!patchItem) { acc.push(it); return acc }
        if (isCompletedItem(patchItem)) {
          acc.push({ ...it, desc: patchItem.fullDesc || patchItem.description || '' })
        }
        return acc
      }, [])
      const allItems = [...bootsItems, ...completed]
      state.aiClient.setSubstituteItems(allItems)
      const candidatesForUI = allItems.map(it => ({
        id: it.id, name: it.jaName, image: getItemById(it.id)?.image || null
      }))
      broadcast('substitute:items', candidatesForUI)
      console.log(`[MatchupItems] ${me.enName} vs ${laneOpponent.enName}: ${allItems.length} items (boots: ${bootsItems.length})`)
    } else {
      console.warn('[MatchupItems] No data returned, using fallback')
      useFallbackSubstituteItems()
    }
  }).catch(err => {
    console.error('[MatchupItems] Error:', err.message)
    useFallbackSubstituteItems()
  })
}

// ── マッチアップTip ──
function handleMatchupTip(me, resolvedPosition, enemies) {
  if (!state.currentMatchAiAllowed) return
  if (state.matchupTipLoaded || !me.enName || !resolvedPosition || !state.aiClient || !state.aiEnabled || !state.currentCoreBuild) {
    if (!state.matchupTipLoaded && me.enName && resolvedPosition) {
      console.log(`[MatchupTip] Waiting... claude=${!!state.aiClient} ai=${state.aiEnabled} coreBuild=${!!state.currentCoreBuild}`)
    }
    return
  }

  const laneOpponent = findLaneOpponent(enemies, resolvedPosition, 'MatchupTip')
  if (!laneOpponent) return

  state.matchupTipLoaded = true

  const gameState = state.currentGameState
  if (!gameState) {
    console.warn('[Pipeline] MatchupTip: no gameState available, will retry')
    state.matchupTipLoaded = false
    return
  }

  // 前処理: 構造化入力を生成
  const spellData = getSpells(laneOpponent.enName)
  const structuredInput = state.preprocessor.buildMatchupInput(gameState, spellData)
  console.log(`[Pipeline] MatchupTip input: ${me.enName} vs ${structuredInput.opponent?.champion || '?'} (${resolvedPosition})`)

  broadcast('matchup:loading', { loading: true, opponent: laneOpponent.championName, opponentPartner: structuredInput.opponent_partner?.champion || null })

  // マッチアップ勝率を取得してからAI呼び出し
  fetchMatchupWinRate(me.enName, laneOpponent.enName, resolvedPosition).catch(() => null).then(winRate => {
    if (winRate !== null) {
      structuredInput.matchup_winrate = Math.round(winRate * 1000) / 10 // パーセント（小数点1桁）
    }
    return state.aiClient.getMatchupTip(structuredInput)
  }).then(rawTip => {
    // 後処理
    const tip = state.postprocessor.processMatchupResult(rawTip, structuredInput.opponent)

    if (tip) {
      tip.opponent = laneOpponent.championName
      tip.opponentPartner = structuredInput.opponent_partner?.champion || null
      tip.myChampion = me.championName
      tip.mySkills = structuredInput.me?.skills || null
      tip.opponentSkills = structuredInput.opponent?.skills || null
      broadcast('matchup:loading', false)
      broadcast('matchup:tip', tip)
      console.log(`[Pipeline] MatchupTip processed: ${me.enName} vs ${laneOpponent.enName}: ${tip.summary}`)
    } else {
      broadcast('matchup:loading', false)
      console.warn('[Pipeline] MatchupTip postprocessor returned null, will retry')
      state.matchupTipLoaded = false
    }
  }).catch(err => {
    broadcast('matchup:loading', false)
    if (err.authError) {
      console.error('[MatchupTip] Auth error - stopping retries. Check provider settings.')
      state.aiEnabled = false
      broadcast('ai:error', { type: 'auth', message: 'APIキーが無効またはプロバイダー未設定です。' })
    } else {
      console.error('[MatchupTip] Error:', err.message, '- will retry')
      state.matchupTipLoaded = false
    }
  })
}

module.exports = {
  init,
  handleMatchupTip,
  handleMatchupItems,
  useFallbackSubstituteItems,
}
