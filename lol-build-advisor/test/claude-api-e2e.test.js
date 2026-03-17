const { ClaudeApiClient } = require('../electron/api/claudeApi');
const { ContextBuilder } = require('../electron/api/contextBuilder');

const API_KEY = 'REPLACE_WITH_YOUR_KEY';

async function run() {
  const client = new ClaudeApiClient(API_KEY);

  // テスト1: APIキー検証
  console.log('--- APIキー検証 ---');
  const valid = await client.validate();
  console.log(valid ? '✅ APIキー有効' : '❌ APIキー無効');

  if (!valid) {
    console.log('APIキーが無効のため疎通テスト中止');
    return;
  }

  // テスト2: 実際のビルド提案取得
  console.log('\n--- ビルド提案テスト (Jinxシナリオ) ---');
  const cb = new ContextBuilder();
  const mockGameData = {
    activePlayer: {
      summonerName: 'TestPlayer', championName: 'Jinx', level: 11,
      currentGold: 1500,
      fullRunes: { primaryRuneTree: { displayName: 'Lethal Tempo' } },
      items: [
        { itemID: 3006, displayName: "Berserker's Greaves", count: 1 },
        { itemID: 6672, displayName: 'Kraken Slayer', count: 1 }
      ]
    },
    allPlayers: [
      { summonerName: 'TestPlayer', team: 'ORDER', championName: 'Jinx', scores: { kills: 3, deaths: 1, assists: 5, creepScore: 145 }, level: 11, items: [{ itemID: 3006 }, { itemID: 6672 }] },
      { summonerName: 'Ally1', team: 'ORDER', championName: 'Leona', scores: { kills: 1, deaths: 2, assists: 8, creepScore: 30 }, level: 10, items: [] },
      { summonerName: 'Ally2', team: 'ORDER', championName: 'Ahri', scores: { kills: 4, deaths: 0, assists: 3, creepScore: 160 }, level: 12, items: [] },
      { summonerName: 'Ally3', team: 'ORDER', championName: 'LeeSin', scores: { kills: 2, deaths: 3, assists: 4, creepScore: 110 }, level: 10, items: [] },
      { summonerName: 'Ally4', team: 'ORDER', championName: 'Garen', scores: { kills: 0, deaths: 4, assists: 2, creepScore: 120 }, level: 9, items: [] },
      { summonerName: 'Enemy1', team: 'CHAOS', championName: 'Zed', scores: { kills: 6, deaths: 1, assists: 2, creepScore: 155 }, level: 12, items: [] },
      { summonerName: 'Enemy2', team: 'CHAOS', championName: 'Malphite', scores: { kills: 1, deaths: 2, assists: 5, creepScore: 100 }, level: 10, items: [] },
      { summonerName: 'Enemy3', team: 'CHAOS', championName: 'Lux', scores: { kills: 3, deaths: 2, assists: 4, creepScore: 140 }, level: 11, items: [] },
      { summonerName: 'Enemy4', team: 'CHAOS', championName: 'Caitlyn', scores: { kills: 2, deaths: 3, assists: 3, creepScore: 150 }, level: 10, items: [] },
      { summonerName: 'Enemy5', team: 'CHAOS', championName: 'Thresh', scores: { kills: 0, deaths: 2, assists: 7, creepScore: 25 }, level: 9, items: [] }
    ],
    gameData: { gameTime: 900 }
  };

  const context = cb.build(mockGameData);
  console.log('Context送信中...');

  const suggestion = await client.getSuggestion(context);
  if (suggestion) {
    console.log('✅ レスポンス取得成功');
    console.log('buy_now:', suggestion.buy_now);
    console.log('full_build:', suggestion.full_build);
    console.log('reasoning:', suggestion.reasoning);
    console.log('tips:', suggestion.tips);

    // 構造チェック
    const hasAll = suggestion.buy_now && suggestion.full_build && suggestion.reasoning && suggestion.tips;
    console.log(hasAll ? '\n✅ レスポンス構造OK' : '\n⚠️  レスポンス構造に不足あり');
  } else {
    console.log('❌ レスポンス取得失敗');
  }
}

run().catch(e => console.log('❌ エラー:', e.message));
