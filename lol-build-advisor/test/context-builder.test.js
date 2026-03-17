const { ContextBuilder } = require('../electron/api/contextBuilder');
const cb = new ContextBuilder();

const mockGameData = {
  activePlayer: {
    summonerName: 'TestPlayer',
    championName: 'Jinx',
    level: 11,
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

try {
  const context = cb.build(mockGameData);
  console.log('✅ ContextBuilder.build() 成功');
  console.log('出力文字数:', context.length);
  console.log('---');
  console.log(context.substring(0, 500));
  console.log('...');

  const checks = ['Jinx', 'Zed', 'フェーズ'];
  checks.forEach(k => {
    if (context.includes(k)) console.log('✅ 含む: ' + k);
    else console.log('⚠️  不足: ' + k);
  });
} catch (e) {
  console.log('❌ ContextBuilder失敗:', e.message, e.stack);
}
