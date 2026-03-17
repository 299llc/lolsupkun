/**
 * OP.GG MCP Client
 *
 * OP.GG が公開している MCP Server (MIT ライセンス) から
 * チャンピオン別コアビルドを取得する。
 * AI不要、HTTPリクエストのみ。コスト0。
 */

const MCP_ENDPOINT = 'https://mcp-api.op.gg/mcp'

let requestId = 0

async function mcpCall(toolName, args) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: ++requestId,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    })
  })

  if (!res.ok) {
    throw new Error(`OP.GG MCP HTTP ${res.status}`)
  }

  const text = await res.text()
  // Streamable HTTP may return multiple JSON-RPC lines
  const lines = text.split('\n').filter(l => l.trim())
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.result?.content) {
        for (const c of parsed.result.content) {
          if (c.type === 'text') return c.text
        }
      }
      if (parsed.error) {
        throw new Error(parsed.error.message || JSON.stringify(parsed.error))
      }
    } catch (e) {
      if (e.message.includes('OP.GG')) throw e
    }
  }
  return null
}

// ポジション名を OP.GG 形式に変換
function normalizePosition(position) {
  const map = {
    'TOP': 'top', 'JUNGLE': 'jungle', 'MIDDLE': 'mid', 'MID': 'mid',
    'BOTTOM': 'adc', 'ADC': 'adc', 'UTILITY': 'support', 'SUPPORT': 'support',
    'top': 'top', 'jungle': 'jungle', 'middle': 'mid', 'mid': 'mid',
    'bottom': 'adc', 'adc': 'adc', 'utility': 'support', 'support': 'support'
  }
  return map[position] || 'mid'
}

// チャンピオン名を OP.GG 形式 (UPPER_SNAKE_CASE) に変換
// 例: "Aurelion Sol" → "AURELION_SOL", "Kai'Sa" → "KAISA"
function normalizeChampionName(name) {
  return name
    .replace(/['\s.-]/g, match => match === ' ' ? '_' : '')
    .toUpperCase()
}

/**
 * チャンピオン分析データを取得
 * @param {string} championName - チャンピオン英語名 (例: "Azir")
 * @param {string} position - ポジション (例: "MID", "TOP")
 * @returns {object|null} コアビルド情報
 */
async function fetchChampionBuild(championName, position) {
  const champKey = normalizeChampionName(championName)
  const pos = normalizePosition(position)

  console.log(`[OP.GG] Fetching build: ${champKey} ${pos}`)

  try {
    const raw = await mcpCall('lol_get_champion_analysis', {
      champion: champKey,
      position: pos,
      game_mode: 'ranked'
    })

    if (!raw) {
      console.error('[OP.GG] No data returned')
      return null
    }

    return parseChampionAnalysis(raw, pos)
  } catch (err) {
    console.error(`[OP.GG] Error: ${err.message}`)
    return null
  }
}

/**
 * MCP レスポンス(テキスト)をパースしてコアビルド情報を抽出
 * レスポンスは Kotlin-like クラス表現で返ってくる
 *
 * データ構造 (classヘッダ順):
 *   core_items, mythic_items, boots, starter_items,
 *   last_items, fourth_items, fifth_items, sixth_items, ...
 *
 * CoreItems の並び:
 *   CoreItems([ids],[names],play,win,pick_rate)
 *   - core_items: ids.length >= 2 (コア3アイテムセット)
 *   - boots: ids.length === 1, ブーツID
 *   - starter_items: ids.length >= 1, 複数アイテムセット
 *   - 4th/5th/6th: 配列の中に CoreItems が並ぶ (各 ids.length === 1)
 */
function parseChampionAnalysis(text, requestedPosition) {
  const result = {
    roles: [],          // [{ name: string, winRate, roleRate }]
    coreItems: [],      // [{ ids, names, pickRate, winRate }]
    boots: [],
    starterItems: [],
    lastItems: [],      // 全人気アイテム (ロール混合)
    fourthItems: [],    // 4th slot candidates
    fifthItems: [],     // 5th slot candidates
    sixthItems: [],     // 6th slot candidates
    summonerSpells: [],  // [{ids, names, pickRate, winRate}]
    runes: null,
    skills: null,
    winRate: 0,
    pickRate: 0,
    tier: 0
  }

  try {
    // ロール情報: リクエストしたポジションの Position(...) ブロックからのみ抽出
    // Position("TOP",Stats(...,[Role("TANK",Stats1(...)),Role("MAGE",Stats1(...))],...)
    const posNameMap = { top: 'TOP', jungle: 'JUNGLE', mid: 'MID', adc: 'BOTTOM', support: 'UTILITY' }
    const posKey = posNameMap[requestedPosition] || requestedPosition?.toUpperCase() || ''
    // 該当ポジションの Position(...) を探してその中の Role のみ取得
    const posPattern = new RegExp(`Position\\("${posKey}"[^)]*\\)`)
    const posMatch = posPattern.exec(text)
    let roleSearchText = text
    if (posMatch) {
      // Position の開始位置から次の Position または ] までのテキストを切り出し
      const startIdx = posMatch.index
      const nextPosIdx = text.indexOf('Position("', startIdx + 1)
      const endIdx = nextPosIdx > 0 ? nextPosIdx : text.indexOf('],', startIdx)
      roleSearchText = text.substring(startIdx, endIdx > 0 ? endIdx : startIdx + 500)
    }
    const roleMatches = roleSearchText.matchAll(/Role\("([^"]+)",Stats1\(([\d.]+),([\d.]+),(\d+),(\d+)\)\)/g)
    for (const m of roleMatches) {
      result.roles.push({
        name: m[1],
        winRate: parseFloat(m[2]),
        roleRate: parseFloat(m[3]),
        play: parseInt(m[4]),
        win: parseInt(m[5])
      })
    }

    // CoreItems パーサーヘルパー
    function parseCoreItem(m) {
      const ids = m[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      const names = m[2].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || []
      const play = parseInt(m[3])
      const win = parseInt(m[4])
      const pickRate = parseFloat(m[5])
      return { ids, names, play, winRate: play > 0 ? Math.round(win / play * 100) : 0, pickRate }
    }

    // データ構造 (classヘッダ順):
    //   core_items, mythic_items, boots, starter_items,
    //   last_items, fourth_items, fifth_items, sixth_items, summoner_spells, ...
    //
    // 配列グループ `[CoreItems(...),CoreItems(...)]` を検出して
    // last_items / fourth / fifth / sixth を正しく分離する

    // 1) 配列グループ内の CoreItems を検出 (4th/5th/6th/last)
    const arrayGroupRegex = /\[(CoreItems\([^)]+\)(?:,CoreItems\([^)]+\))*)\]/g
    const arrayGroups = []
    let groupMatch
    while ((groupMatch = arrayGroupRegex.exec(text)) !== null) {
      const groupText = groupMatch[1]
      const items = []
      const itemRegex = /CoreItems\(\[([^\]]*)\],\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)/g
      let im
      while ((im = itemRegex.exec(groupText)) !== null) {
        items.push(parseCoreItem(im))
      }
      if (items.length > 0) {
        arrayGroups.push(items)
      }
    }

    // 配列グループは順に: last_items, fourth_items, fifth_items, sixth_items
    // (mythic_items は空配列 [] のことが多い)
    // last_items: play数が大きい (全体の人気アイテム)
    // fourth以降: play数が小さくなる (スロット固有)
    // → 非空グループを last, 4th, 5th, 6th に割り当て
    if (arrayGroups.length >= 4) {
      result.lastItems = arrayGroups[0]   // 全人気アイテム (ロール混合)
      result.fourthItems = arrayGroups[1]
      result.fifthItems = arrayGroups[2]
      result.sixthItems = arrayGroups[3]
    } else if (arrayGroups.length === 3) {
      result.fourthItems = arrayGroups[0]
      result.fifthItems = arrayGroups[1]
      result.sixthItems = arrayGroups[2]
    } else if (arrayGroups.length === 2) {
      result.fourthItems = arrayGroups[0]
      result.fifthItems = arrayGroups[1]
    } else if (arrayGroups.length === 1) {
      result.fourthItems = arrayGroups[0]
    }

    // 2) 配列グループ外の standalone CoreItems を検出 (core, boots, starter)
    // 配列グループの位置を除外してパース
    const groupPositions = []
    arrayGroupRegex.lastIndex = 0
    while ((groupMatch = arrayGroupRegex.exec(text)) !== null) {
      groupPositions.push({ start: groupMatch.index, end: groupMatch.index + groupMatch[0].length })
    }

    const standaloneRegex = /CoreItems\(\[([^\]]*)\],\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)/g
    let sm
    while ((sm = standaloneRegex.exec(text)) !== null) {
      // 配列グループ内の CoreItems はスキップ
      const pos = sm.index
      if (groupPositions.some(g => pos >= g.start && pos < g.end)) continue

      const item = parseCoreItem(sm)

      if (item.ids.length >= 3) {
        // コア3アイテムセット or スターター
        const hasConsumable = item.ids.some(id => (id >= 2003 && id <= 2055) || id === 1056 || id === 1054 || id === 1055 || id === 1082 || id === 1083)
        if (hasConsumable) {
          result.starterItems.push(item)
        } else {
          result.coreItems.push(item)
        }
      } else if (item.ids.length === 2) {
        // サモナースペル (ID < 100) or コアアイテムセット or スターター
        if (item.ids.every(id => id < 100)) {
          // サモナースペル
          result.summonerSpells.push(item)
        } else {
          const hasConsumable = item.ids.some(id => (id >= 2003 && id <= 2055))
          if (hasConsumable) {
            result.starterItems.push(item)
          } else {
            result.coreItems.push(item)
          }
        }
      } else if (item.ids.length === 1) {
        const id = item.ids[0]
        const isBoot = (id >= 3005 && id <= 3200) || id === 2422
        if (isBoot) {
          result.boots.push(item)
        }
      }
    }

    // 勝率・ティア
    const avgMatch = text.match(/AverageStats\((\d+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),(\d+),(\d+)/)
    if (avgMatch) {
      result.winRate = parseFloat(avgMatch[2])
      result.pickRate = parseFloat(avgMatch[3])
      result.tier = parseInt(avgMatch[6])
    }

    // スキルオーダー
    const skillMatch = text.match(/Skills\(\[([^\]]*)\],(\d+),(\d+),([\d.]+)\)/)
    if (skillMatch) {
      const raw = skillMatch[1].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || []
      // raw は15要素（Rを除く）。Rを6,11,16に挿入して18レベル分に展開
      const tree = []
      let ri = 0
      for (let lv = 1; lv <= 18; lv++) {
        if (lv === 6 || lv === 11 || lv === 16) {
          tree.push('R')
        } else if (ri < raw.length) {
          tree.push(raw[ri++])
        }
      }
      // 優先度順（Q/W/Eのmax順）
      const counts = { Q: 0, W: 0, E: 0 }
      for (const s of raw) { if (counts[s] !== undefined) counts[s]++ }
      const order = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k)
      result.skills = { order, tree, pickRate: parseFloat(skillMatch[4]) }
    }

    // Runes
    const runeMatch = text.match(/Runes\((\d+),(\d+),"([^"]*)",\[([^\]]*)\],\[([^\]]*)\],(\d+),"([^"]*)",\[([^\]]*)\],\[([^\]]*)\]/)
    if (runeMatch) {
      result.runes = {
        primaryPage: runeMatch[3],
        primaryRunes: runeMatch[5].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || [],
        secondaryPage: runeMatch[7],
        secondaryRunes: runeMatch[9].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || []
      }
    }
  } catch (err) {
    console.error(`[OP.GG] Parse error: ${err.message}`)
  }

  return result
}

/**
 * コアビルドID配列を返す（ピック率1位のコアアイテムセット + ブーツ）
 */
function buildCoreBuildIds(analysis) {
  if (!analysis) return []
  const ids = []
  if (analysis.coreItems.length > 0) {
    ids.push(...analysis.coreItems[0].ids)
  }
  if (analysis.boots.length > 0) {
    ids.push(analysis.boots[0].ids[0])
  }
  return ids
}

/**
 * マッチアップ別の候補アイテムを取得
 * @returns {Array<{id: string, jaName: string}>|null}
 */
async function fetchMatchupItems(myChampion, opponentChampion, position) {
  const myKey = normalizeChampionName(myChampion)
  const oppKey = normalizeChampionName(opponentChampion)
  const pos = normalizePosition(position)

  console.log(`[OP.GG] Fetching matchup items: ${myKey} vs ${oppKey} ${pos}`)

  try {
    const raw = await mcpCall('lol_get_lane_matchup_guide', {
      my_champion: myKey,
      opponent_champion: oppKey,
      position: pos,
      lang: 'ja_JP'
    })
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const lastItems = parsed?.data?.last_items || parsed?.last_items
    if (!Array.isArray(lastItems)) return null

    const seen = new Set()
    const result = []
    for (const entry of lastItems) {
      const id = entry.ids?.[0]
      const name = entry.ids_names?.[0]
      if (!id || !name || seen.has(id)) continue
      seen.add(id)
      result.push({ id: String(id), jaName: name })
    }

    console.log(`[OP.GG] Matchup items: ${result.length} items`)
    return result
  } catch (err) {
    console.error(`[OP.GG] Matchup items error: ${err.message}`)
    return null
  }
}

module.exports = { fetchChampionBuild, buildCoreBuildIds, normalizeChampionName, normalizePosition, fetchMatchupItems }
