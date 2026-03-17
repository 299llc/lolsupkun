// LoL Live Client Data API 接続テスト
// 使い方: LoLの試合中（練習モードでもOK）に実行
//   node test\lol-live-check.js

const https = require('https');

const ENDPOINTS = [
  { name: 'AllGameData', path: '/liveclientdata/allgamedata' },
  { name: 'ActivePlayer', path: '/liveclientdata/activeplayer' },
  { name: 'PlayerList', path: '/liveclientdata/playerlist' },
  { name: 'GameStats', path: '/liveclientdata/gamestats' },
];

function fetch(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://127.0.0.1:2999${path}`,
      { rejectUnauthorized: false },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, data }); }
        });
      }
    );
    req.on('error', (e) => reject(e));
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function run() {
  console.log('=== LoL Live Client Data API テスト ===\n');

  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep.path);
      console.log(`✅ ${ep.name} (${res.status})`);

      if (ep.name === 'ActivePlayer') {
        const p = res.data;
        console.log(`   チャンピオン: ${p.championName}`);
        console.log(`   レベル: ${p.level}`);
        console.log(`   ゴールド: ${p.currentGold}`);
        console.log(`   アイテム数: ${(p.items || []).length}`);
      }
      if (ep.name === 'PlayerList') {
        const players = res.data;
        console.log(`   プレイヤー数: ${players.length}`);
        players.forEach((p) => {
          const s = p.scores;
          console.log(`   ${p.team === 'ORDER' ? '味方' : '敵'} ${p.championName} ${s.kills}/${s.deaths}/${s.assists}`);
        });
      }
      if (ep.name === 'GameStats') {
        const g = res.data;
        const min = Math.floor(g.gameTime / 60);
        const sec = Math.floor(g.gameTime % 60);
        console.log(`   時間: ${min}分${sec}秒`);
        console.log(`   モード: ${g.gameMode}`);
      }
    } catch (e) {
      console.log(`❌ ${ep.name}: ${e.message}`);
    }
  }

  // ContextBuilderテスト
  try {
    const res = await fetch('/liveclientdata/allgamedata');
    if (res.status === 200) {
      const { ContextBuilder } = require('../electron/api/contextBuilder');
      const cb = new ContextBuilder();
      const context = cb.build(res.data);
      console.log('\n=== ContextBuilder出力 ===');
      console.log(context);
    }
  } catch (e) {
    console.log('\n⚠️  ContextBuilderテストスキップ:', e.message);
  }
}

run();
