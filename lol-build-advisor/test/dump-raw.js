// ActivePlayerの生データをダンプして構造確認
const https = require('https');

function fetch(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://127.0.0.1:2999${path}`,
      { rejectUnauthorized: false },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function run() {
  const ap = await fetch('/liveclientdata/activeplayer');
  console.log('=== ActivePlayer keys ===');
  console.log(Object.keys(ap));
  console.log('\n=== champion関連 ===');
  for (const [k, v] of Object.entries(ap)) {
    if (typeof v === 'string' || typeof v === 'number') {
      console.log(`  ${k}: ${v}`);
    }
  }

  const players = await fetch('/liveclientdata/playerlist');
  console.log('\n=== PlayerList[0] keys ===');
  console.log(Object.keys(players[0]));
  console.log('\n=== Player[0] 詳細 ===');
  const p = players[0];
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      console.log(`  ${k}: ${v}`);
    }
  }

  console.log('\n=== 全チャンピオン名一覧 ===');
  players.forEach(p => console.log(`  ${p.championName} / rawChampionName: ${p.rawChampionName}`));
}

run().catch(e => console.log('Error:', e.message));
