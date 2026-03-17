const { DiffDetector } = require('../electron/api/diffDetector');

function makeData(items, kills, deaths) {
  return {
    activePlayer: { summonerName: 'Test', items: items.map(id => ({ itemID: id })) },
    allPlayers: [{ summonerName: 'Test', team: 'ORDER', scores: { kills, deaths, assists: 0 }, items: items.map(id => ({ itemID: id })) }],
    gameData: { gameTime: 100 }
  };
}

let pass = 0, fail = 0;
function test(name, result, expected) {
  const ok = !!result === expected;
  if (ok) { console.log('✅ ' + name); pass++; }
  else { console.log('❌ ' + name); fail++; }
}

// デバウンスを0にしてテスト
const dd = new DiffDetector();
dd.debounceMs = 0;

test('初回は常にtrigger', dd.check(makeData([3006], 0, 0)), true);
test('変化なし→no trigger', dd.check(makeData([3006], 0, 0)), false);
test('アイテム購入→trigger', dd.check(makeData([3006, 6672], 0, 0)), true);
test('キル増加→trigger', dd.check(makeData([3006, 6672], 2, 0)), true);
test('デス増加→trigger', dd.check(makeData([3006, 6672], 2, 1)), true);
test('変化なし2→no trigger', dd.check(makeData([3006, 6672], 2, 1)), false);

// デバウンステスト
const dd2 = new DiffDetector();
dd2.debounceMs = 100000; // 大きい値
dd2.check(makeData([3006], 0, 0)); // 初回
test('デバウンス中→no trigger', dd2.check(makeData([3006, 9999], 5, 5)), false);

console.log('\n結果: ' + pass + '/' + (pass + fail) + ' passed');
