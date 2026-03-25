#!/usr/bin/env node
/**
 * OP.GG実データからアイテム提案テストfixture を自動生成する
 *
 * 使い方:
 *   node test/generate-item-fixtures.js
 */
const path = require('path')
const fs = require('fs')
const { fetchChampionBuild, buildCoreBuildIds, fetchMatchupItems } = require('../electron/api/opggClient')
const { getItemById, initPatchData } = require('../electron/api/patchData')
const { isCompletedItem } = require('../electron/core/config')

// テストシナリオ定義
// coreOwned: コアビルドの先頭N品を所持済みとする（OP.GGから取得したコアビルドに基づく）
const SCENARIOS = [
  {
    name: '01-adc-behind-ap-heavy',
    me: { champion: 'Jinx', enName: 'Jinx', role: 'ADC', position: 'adc', level: 11, gold: 1200, status: 'behind' },
    opponent: 'Syndra',
    enemy: { damageProfile: { ad: 30, ap: 70 }, healerCount: 0, ccLevel: 'medium', threats: [{ champion: 'シンドラ', reason: 'fed', level: 13 }] },
    situation: 'behind',
    coreOwned: 2,
    expected: { must_include: null, must_not_include: null, _reason: 'ADC劣勢→コア完成優先。AP重めならMR系も妥当' },
  },
  {
    name: '02-top-ahead-ad-heavy',
    me: { champion: 'Darius', enName: 'Darius', role: 'TOP', position: 'top', level: 13, gold: 2000, status: 'fed' },
    opponent: 'Fiora',
    enemy: { damageProfile: { ad: 75, ap: 25 }, healerCount: 2, ccLevel: 'low', threats: [] },
    situation: 'ahead',
    coreOwned: 2,
    expected: { must_include: null, must_not_include: null, _reason: 'TOP優勢→コアで火力拡大。ヒーラーneeded→重傷も妥当' },
  },
  {
    name: '03-mid-even-healer-heavy',
    me: { champion: 'Syndra', enName: 'Syndra', role: 'MID', position: 'mid', level: 9, gold: 1300, status: 'normal' },
    opponent: 'Aatrox',
    enemy: { damageProfile: { ad: 50, ap: 50 }, healerCount: 3, ccLevel: 'medium', threats: [{ champion: 'エイトロックス', reason: '回復量が高い', level: 10 }] },
    situation: 'even',
    coreOwned: 1,
    expected: { must_include: null, must_not_include: null, _reason: '敵ヒーラーrequired→重傷アイテムが出るべき' },
  },
  {
    name: '04-sup-behind-cc-heavy',
    me: { champion: 'Lulu', enName: 'Lulu', role: 'SUP', position: 'support', level: 8, gold: 800, status: 'normal' },
    opponent: 'Leona',
    enemy: { damageProfile: { ad: 60, ap: 40 }, healerCount: 0, ccLevel: 'high', threats: [{ champion: 'レオナ', reason: 'CC連鎖', level: 9 }] },
    situation: 'behind',
    coreOwned: 1,
    expected: { must_include: null, must_not_include: null, _reason: 'SUP劣勢+CC重め→CC対策アイテムが妥当' },
  },
  {
    name: '05-jg-ahead-mixed',
    me: { champion: 'Vi', enName: 'Vi', role: 'JG', position: 'jungle', level: 12, gold: 1800, status: 'fed' },
    opponent: 'LeeSin',
    enemy: { damageProfile: { ad: 55, ap: 45 }, healerCount: 0, ccLevel: 'low', threats: [] },
    situation: 'ahead',
    coreOwned: 1,
    expected: { must_include: null, must_not_include: null, _reason: 'JG優勢・混合→HP系で効率的に耐久' },
  },
  {
    name: '06-adc-even-assassin-threat',
    me: { champion: 'Kaisa', enName: 'Kaisa', role: 'ADC', position: 'adc', level: 13, gold: 2200, status: 'normal' },
    opponent: 'Zed',
    enemy: { damageProfile: { ad: 65, ap: 35 }, healerCount: 0, ccLevel: 'medium', threats: [{ champion: 'ゼド', reason: 'fed assassin', level: 15 }] },
    situation: 'even',
    coreOwned: 3,
    expected: { must_include: null, must_not_include: null, _reason: 'ADCコア全品完成→次は状況対応。fedアサシン対策も考慮' },
  },
  {
    name: '07-top-behind-ad80-no-mr',
    me: { champion: 'Garen', enName: 'Garen', role: 'TOP', position: 'top', level: 10, gold: 900, status: 'behind' },
    opponent: 'Darius',
    enemy: { damageProfile: { ad: 80, ap: 20 }, healerCount: 0, ccLevel: 'low', threats: [{ champion: 'ダリウス', reason: 'fed', level: 12 }] },
    situation: 'behind',
    coreOwned: 1,
    expected: { must_not_include: null, _reason: 'AD80%→MRアイテムは不要。アーマー系が正解' },
  },
]

async function generateFixtures() {
  // パッチデータ初期化
  await initPatchData()
  console.log('パッチデータ読み込み完了\n')

  const fixtureDir = path.join(__dirname, 'fixtures', 'item')
  const expectedDir = path.join(__dirname, 'expected', 'item')
  fs.mkdirSync(fixtureDir, { recursive: true })
  fs.mkdirSync(expectedDir, { recursive: true })

  for (const sc of SCENARIOS) {
    console.log(`=== ${sc.name} ===`)
    console.log(`  ${sc.me.champion}(${sc.me.role}) vs ${sc.opponent} [${sc.situation}]`)

    // 1. OP.GG からコアビルド取得
    const buildData = await fetchChampionBuild(sc.me.enName, sc.me.position)
    let coreBuild = []
    if (buildData?.coreItems?.[0]) {
      const core = buildData.coreItems[0]
      coreBuild = core.ids.map((id, i) => ({
        id: String(id),
        name: core.names[i] || String(id)
      }))
    }
    console.log(`  コアビルド: ${coreBuild.map(c => c.name).join(', ') || 'なし'}`)

    // 2. OP.GG からマッチアップ入れ替え候補取得
    let substituteItems = await fetchMatchupItems(sc.me.enName, sc.opponent, sc.me.position) || []

    // ブーツ候補を追加（OP.GGのboots全件）
    const bootItems = []
    if (buildData?.boots) {
      for (const entry of buildData.boots) {
        const id = String(entry.ids?.[0])
        if (!id) continue
        const name = entry.names?.[0] || id
        bootItems.push({ id, jaName: name })
      }
    }

    // フォールバック: マッチアップ候補がなければ 4th/5th/6th から取得
    if (substituteItems.length === 0 && buildData) {
      const fallbackItems = [
        ...(buildData.fourthItems || []),
        ...(buildData.fifthItems || []),
        ...(buildData.sixthItems || []),
        ...(buildData.lastItems || []),
      ]
      const seen = new Set()
      for (const item of fallbackItems) {
        const id = String(item.ids?.[0] || item.id)
        if (!id || seen.has(id)) continue
        seen.add(id)
        const name = item.names?.[0] || item.jaName || id
        substituteItems.push({ id, jaName: name })
      }
      substituteItems = substituteItems.slice(0, 15)
      console.log(`  マッチアップ候補なし → フォールバック ${substituteItems.length} 件`)
    } else {
      console.log(`  マッチアップ候補: ${substituteItems.length} 件`)
    }

    // ブーツをsubstituteItemsの先頭に追加
    substituteItems = [...bootItems, ...substituteItems]
    console.log(`  ブーツ候補: ${bootItems.length} 件`)

    // 3. 所持アイテム = コアビルドの先頭N品（OP.GGコアビルド準拠）
    const ownedItems = coreBuild.slice(0, sc.coreOwned).map(c => Number(c.id))
    console.log(`  所持アイテム (コア${sc.coreOwned}品): ${ownedItems.map(id => {
      const item = getItemById(String(id)); return item?.jaName || id
    }).join(', ') || 'なし'}`)

    // 4. candidates 構築（preprocessor と同じロジック）
    const ownedItemIds = new Set(ownedItems.map(String))
    const candidates = []
    const coreIds = new Set(coreBuild.map(c => c.id))

    // core 未購入品
    for (const item of coreBuild) {
      if (ownedItemIds.has(item.id)) continue
      candidates.push({ id: item.id, name: item.name, tag: 'core' })
    }

    // situational: OP.GG入れ替え候補を全件追加
    // 完成品のみフィルタ + コアビルドと重複除外
    for (const item of substituteItems) {
      const itemId = String(item.id)
      if (ownedItemIds.has(itemId)) continue
      if (candidates.some(c => c.id === itemId)) continue
      if (coreIds.has(itemId)) continue
      const patchItem = getItemById(itemId)
      if (!patchItem) continue
      if (!isCompletedItem(patchItem)) continue
      candidates.push({ id: itemId, name: patchItem.jaName || item.jaName || itemId, tag: 'situational' })
    }

    console.log(`  candidates: ${candidates.length} 件`)
    for (const c of candidates) {
      console.log(`    ${c.tag}: ${c.name} (${c.id})`)
    }

    // 4. enemy_healing 判定
    let enemyHealing = 'none'
    if (sc.enemy.healerCount >= 3) enemyHealing = 'required'
    else if (sc.enemy.healerCount >= 2) enemyHealing = 'needed'

    // 5. fixture 出力
    const fixture = {
      me: {
        champion: sc.me.champion,
        role: sc.me.role,
        level: sc.me.level,
        items: ownedItems,
        gold: sc.me.gold,
        status: sc.me.status,
      },
      enemy_damage_profile: sc.enemy.damageProfile,
      enemy_healing: enemyHealing,
      enemy_cc_level: sc.enemy.ccLevel,
      situation: sc.situation,
      candidates,
      core_build: coreBuild,
      enemy_skills: [],
      enemy_threats: sc.enemy.threats,
      previous_advice: null,
    }

    const fixturePath = path.join(fixtureDir, `${sc.name}.json`)
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n')
    console.log(`  → ${fixturePath}`)

    // 6. expected 出力
    const validIds = candidates.map(c => c.id)
    const expected = {
      max_items: 3,
      valid_ids: validIds,
      ...(sc.expected.must_include && { must_include: sc.expected.must_include }),
      ...(sc.expected.must_not_include && { must_not_include: sc.expected.must_not_include }),
      _reason: sc.expected._reason,
    }

    const expectedPath = path.join(expectedDir, `${sc.name}.json`)
    fs.writeFileSync(expectedPath, JSON.stringify(expected, null, 2) + '\n')

    console.log('')
  }

  console.log('生成完了!')
}

generateFixtures().catch(err => { console.error(err); process.exit(1) })
