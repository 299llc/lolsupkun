// Claude APIのJSONパースロジックをテスト（実際のAPI呼び出しなし）
let pass = 0, fail = 0;
function test(name, result, expected) {
  const ok = !!result === expected;
  if (ok) { console.log('✅ ' + name); pass++; }
  else { console.log('❌ ' + name + ' (got: ' + JSON.stringify(result) + ')'); fail++; }
}

// パースロジック抽出
function parseSuggestion(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try { return JSON.parse(jsonMatch[0]); } catch { return null; }
}

// テスト1: 正常JSON
const r1 = parseSuggestion('{"buy_now":"Infinity Edge","full_build":["Phantom Dancer","Lord Dominik\'s Regards"],"reasoning":"テスト","tips":"テスト"}');
test('正常JSONパース', r1 && r1.buy_now === 'Infinity Edge', true);

// テスト2: JSON前後にテキスト
const r2 = parseSuggestion('Here is my suggestion:\n{"buy_now":"Zhonya","full_build":[],"reasoning":"test","tips":"test"}\nDone.');
test('前後テキスト付きJSON', r2 && r2.buy_now === "Zhonya", true);

// テスト3: 空テキスト
test('空テキスト→null', parseSuggestion(''), false);

// テスト4: 不正JSON
test('不正JSON→null', parseSuggestion('{buy_now: broken}'), false);

// テスト5: ネストJSON
const r5 = parseSuggestion('{"buy_now":"GA","full_build":["IE","PD"],"reasoning":"Zedがフェッド","tips":"集団戦ではGAを温存"}');
test('ネストJSON', r5 && r5.full_build.length === 2, true);

// テスト6: 改行含むJSON
const r6 = parseSuggestion(`{
  "buy_now": "Mortal Reminder",
  "full_build": ["IE", "PD", "LDR", "BT"],
  "reasoning": "回復阻害が必要",
  "tips": "ソラカにフォーカス"
}`);
test('改行含むJSON', r6 && r6.buy_now === 'Mortal Reminder', true);

console.log('\n結果: ' + pass + '/' + (pass + fail) + ' passed');
