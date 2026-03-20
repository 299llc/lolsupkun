// LoLリアルデータをブラウザにストリーミングする簡易サーバー
// node test/live-preview-server.js → http://localhost:3456

const http = require('http');
const https = require('https');
const { ContextBuilder, extractEnName } = require('../electron/api/contextBuilder');
const { DiffDetector } = require('../electron/api/diffDetector');
const { LcuClient } = require('../electron/api/lcuClient');
const { initPatchData, getVersion, getChampionById, getItemById, loadSpellsForMatch, getSpells } = require('../electron/api/patchData');
const { AiClient } = require('../electron/api/aiClient');

// APIキー（テスト用直接指定）
const API_KEY = 'REPLACE_WITH_YOUR_KEY';
const claude = new AiClient(API_KEY);

const cb = new ContextBuilder();
const dd = new DiffDetector();
dd.debounceMs = 0;
const lcu = new LcuClient();

let DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/16.5.1';

// 起動時にパッチデータ一括読み込み
initPatchData().then(info => {
  if (info) {
    DDRAGON = `https://ddragon.leagueoflegends.com/cdn/${info.version}`;
    console.log(`DDRAGON CDN updated to v${info.version}`);
  }
});

function fetchLoL(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://127.0.0.1:2999${endpoint}`,
      { rejectUnauthorized: false },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

const HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LoL Build Advisor</title>
<link href="https://fonts.googleapis.com/css2?family=Beaufort+for+LOL:wght@700&family=Spiegel:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --gold: #C8AA6E;
    --gold-light: #F0E6D2;
    --gold-dark: #785A28;
    --blue: #0AC8B9;
    --red: #E84057;
    --bg-deep: #010A13;
    --bg-card: #0A1428;
    --bg-surface: #0E1E33;
    --text-primary: #F0E6D2;
    --text-secondary: #A09B8C;
    --text-muted: #5B5A56;
    --border: #1E2A40;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Noto Sans JP', 'Spiegel', sans-serif;
    max-width: 780px;
    margin: 0 auto;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background:
      radial-gradient(ellipse at 20% 0%, #C8AA6E08 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, #0AC8B908 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(180deg, #0A1428 0%, #0A1428ee 80%, transparent 100%);
    padding: 16px 20px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid var(--border);
  }

  .status-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-green { background: #0ACF83; box-shadow: 0 0 8px #0ACF83, 0 0 20px #0ACF8344; }
  .dot-yellow { background: #F5A623; box-shadow: 0 0 8px #F5A623; animation: pulse 2s infinite; }
  .dot-red { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .dot-gray { background: #5B5A56; box-shadow: 0 0 8px #5B5A5644; }
  .dot-blue { background: #3B82F6; box-shadow: 0 0 8px #3B82F6, 0 0 20px #3B82F644; animation: pulse 2s infinite; }

  .ended-banner {
    text-align: center;
    padding: 8px;
    background: linear-gradient(90deg, transparent, #C8AA6E22, transparent);
    border-bottom: 1px solid var(--gold-dark);
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .title {
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--gold);
    text-transform: uppercase;
  }

  .timer {
    margin-left: auto;
    font-family: 'Orbitron', sans-serif;
    font-size: 24px;
    font-weight: 900;
    color: var(--gold-light);
    letter-spacing: 2px;
    text-shadow: 0 0 20px #C8AA6E44;
  }

  .phase-badge {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .phase-early { background: #0AC8B922; color: #0AC8B9; border: 1px solid #0AC8B944; }
  .phase-mid { background: #F5A62322; color: #F5A623; border: 1px solid #F5A62344; }
  .phase-late { background: #E8405722; color: #E84057; border: 1px solid #E8405744; }
  .phase-pick { background: #3B82F622; color: #6BA4F7; border: 1px solid #3B82F644; }

  /* === TEAM SECTIONS === */
  .section {
    padding: 14px 16px;
    position: relative;
    z-index: 1;
  }

  .section-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title.enemy { color: var(--red); }
  .section-title.enemy::before {
    content: '';
    display: inline-block;
    width: 20px; height: 2px;
    background: linear-gradient(90deg, var(--red), transparent);
  }
  .section-title.ally { color: var(--blue); }
  .section-title.ally::before {
    content: '';
    display: inline-block;
    width: 20px; height: 2px;
    background: linear-gradient(90deg, var(--blue), transparent);
  }

  /* === PLAYER ROW === */
  .player {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 6px;
    margin-bottom: 4px;
    transition: background 0.2s;
    position: relative;
  }
  .player:hover { background: #ffffff08; }

  .player.me {
    background: linear-gradient(90deg, #C8AA6E12, transparent);
    border-left: 3px solid var(--gold);
    padding-left: 10px;
  }

  .champ-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 2px solid var(--border);
    object-fit: cover;
    background: var(--bg-surface);
  }
  .player.me .champ-icon { border-color: var(--gold); }
  .enemy-team .champ-icon { border-color: #E8405744; }
  .ally-team .champ-icon { border-color: #0AC8B944; }

  .player-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .player-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .champ-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player.me .champ-name { color: var(--gold); }

  .role-tag {
    font-size: 9px;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .flags-row {
    display: flex;
    gap: 4px;
  }

  .flag {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 2px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .flag-fed { background: #E8405733; color: #FF6B7A; }
  .flag-tank { background: #3B82F633; color: #6BA4F7; }
  .flag-heal { background: #0ACF8333; color: #3DE8A5; }
  .flag-cc { background: #F5A62333; color: #FFCA5C; }

  .player-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  .kda {
    font-size: 16px;
    font-weight: 700;
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 1px;
  }
  .kda-good { color: var(--blue); }
  .kda-bad { color: var(--red); }
  .kda-neutral { color: var(--text-secondary); }

  .level {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* === KILL DIFF BAR === */
  .kill-diff {
    margin: 8px 16px 0;
    padding: 10px 14px;
    background: var(--bg-card);
    border-radius: 6px;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
  }
  .kill-diff-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  .kill-bar-wrap {
    flex: 1;
    height: 6px;
    background: #1a1a2e;
    border-radius: 3px;
    overflow: hidden;
    display: flex;
  }
  .kill-bar-ally {
    height: 100%;
    background: linear-gradient(90deg, var(--blue), #0AC8B9aa);
    transition: width 0.5s;
  }
  .kill-bar-enemy {
    height: 100%;
    background: linear-gradient(90deg, #E84057aa, var(--red));
    transition: width 0.5s;
  }
  .kill-score {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .kill-ally { color: var(--blue); }
  .kill-enemy { color: var(--red); }

  /* === BUILD SECTION === */
  .build-section {
    padding: 14px 16px;
    position: relative;
    z-index: 1;
  }

  .buy-now {
    background: linear-gradient(135deg, var(--bg-surface), var(--bg-card));
    border: 1px solid var(--gold-dark);
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
  }
  .buy-now::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .buy-now-label {
    font-size: 10px;
    text-transform: uppercase;
    color: var(--gold);
    letter-spacing: 2px;
    font-family: 'Orbitron', sans-serif;
  }
  .buy-now-item {
    font-size: 22px;
    color: var(--gold-light);
    font-weight: 700;
    margin-top: 4px;
  }

  .build-list { margin: 8px 0; }
  .build-list-title {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 6px;
    font-family: 'Orbitron', sans-serif;
  }
  .build-item {
    font-size: 14px;
    color: var(--text-secondary);
    padding: 3px 0;
    padding-left: 16px;
    position: relative;
  }
  .build-item::before {
    content: '›';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-size: 18px;
    line-height: 1;
  }

  .reasoning {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 8px 0;
    padding: 10px 14px;
    background: var(--bg-card);
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .tips {
    font-size: 13px;
    color: #3DE8A5;
    padding: 10px 14px;
    background: #0ACF8308;
    border-radius: 6px;
    border: 1px solid #0ACF8322;
    border-left: 3px solid #0ACF83;
  }

  /* === CONTEXT DEBUG === */
  .context-debug {
    padding: 12px 16px;
    font-size: 11px;
    color: var(--text-muted);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    position: relative;
    z-index: 1;
  }

  /* === WAITING === */
  .waiting {
    text-align: center;
    padding: 140px 20px;
    position: relative;
    z-index: 1;
  }
  .waiting-text {
    font-size: 16px;
    color: var(--text-muted);
    margin-top: 24px;
    letter-spacing: 1px;
  }
  .spinner {
    width: 44px; height: 44px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* === LEFT-RIGHT TEAM LAYOUT === */
  .teams-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 20px;
    position: relative;
    z-index: 1;
  }
  .teams-grid {
    padding: 0 8px;
    position: relative;
    z-index: 1;
  }
  .match-row {
    display: grid;
    grid-template-columns: 1fr 30px 1fr;
    align-items: center;
    margin-bottom: 2px;
  }
  .match-vs {
    text-align: center;
    font-size: 9px;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .match-cell { min-height: 48px; }

  /* LEFT-RIGHT PLAYER ROW */
  .row-lr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 6px;
    border-radius: 6px;
    gap: 6px;
    width: 100%;
  }
  .row-lr:hover { background: #ffffff08; }
  .ally-left .ally-row.me {
    background: linear-gradient(90deg, #C8AA6E12, transparent);
    border-left: 3px solid var(--gold);
  }
  .ally-right .ally-row.me {
    background: linear-gradient(270deg, #C8AA6E12, transparent);
    border-right: 3px solid var(--gold);
  }
  .ally-row.me .champ-name { color: var(--gold); }
  .ally-row.me .champ-icon { border-color: var(--gold); }

  .lr-info {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lr-name-col {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .lr-stats {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 70px;
  }
  /* Enemy(左): KDA左寄せ, name右寄せ */
  .enemy-side .lr-stats { align-items: flex-start; }
  .enemy-side .lr-name-col { text-align: right; }
  /* Ally(右): name左寄せ, KDA右寄せ */
  .ally-side .lr-stats { align-items: flex-end; }
  .ally-side .lr-name-col { text-align: left; }

  .ally-side .champ-icon { border-color: #0AC8B944; }
  .enemy-side .champ-icon { border-color: #E8405744; }

  #error { color: var(--red); padding: 10px 16px; font-size: 12px; display: none; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
</style>
</head>
<body>
<div class="header">
  <div class="status-dot dot-yellow" id="statusDot"></div>
  <div class="title">Build Advisor</div>
  <div id="phaseBadge"></div>
  <div class="timer" id="timer">--:--</div>
</div>
<div id="content">
  <div class="waiting">
    <div class="spinner"></div>
    <div class="waiting-text">試合待機中...</div>
  </div>
</div>
<div id="error"></div>

<script>
const DDRAGON = '${DDRAGON}';

function iconUrl(enName) {
  if (!enName) return '';
  return DDRAGON + '/img/champion/' + enName + '.png';
}

async function pollChampSelect() {
  try {
    const res = await fetch('/api/champselect');
    const json = await res.json();
    if (json.active) {
      document.getElementById('statusDot').className = 'status-dot dot-blue';
      document.getElementById('phaseBadge').innerHTML = '<span class="phase-badge phase-pick">PICK/BAN</span>';
      renderChampSelect(json);
      return true;
    }
  } catch {}
  return false;
}

function renderChampSelect(data) {
  const timer = Math.ceil(data.timer?.adjustedTimeLeftInPhase / 1000 || 0);
  document.getElementById('timer').textContent = timer + 's';

  let html = '<div class="ended-banner" style="border-color:#3B82F6;color:#6BA4F7">CHAMPION SELECT</div>';

  // My Team
  html += '<div class="section ally-team"><div class="section-title ally">MY TEAM</div>';
  (data.myTeam || []).forEach(p => {
    const meClass = p.isMe ? ' me' : '';
    const name = p.picked ? p.jaName : '選択中...';
    const icon = p.picked ? iconUrl(p.enName) : '';
    const pos = p.assignedPosition ? p.assignedPosition.toUpperCase() : '';
    html += '<div class="player' + meClass + '">';
    if (icon) html += '<img class="champ-icon" src="' + icon + '" alt="" onerror="this.style.display=\\'none\\'">';
    else html += '<div class="champ-icon" style="display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted)">?</div>';
    html += '<div class="player-info"><div class="player-name-row">';
    html += '<span class="champ-name">' + name + '</span>';
    if (pos) html += '<span class="role-tag">' + pos + '</span>';
    html += '</div></div>';
    html += '<div class="player-stats"><span class="level" style="font-size:13px">' + (p.picked ? '✓' : '...') + '</span></div>';
    html += '</div>';
  });
  html += '</div>';

  // Enemy Team
  html += '<div class="section enemy-team"><div class="section-title enemy">ENEMY</div>';
  (data.theirTeam || []).forEach(p => {
    const name = p.picked ? p.jaName : '???';
    const icon = p.picked ? iconUrl(p.enName) : '';
    const pos = p.assignedPosition ? p.assignedPosition.toUpperCase() : '';
    html += '<div class="player">';
    if (icon) html += '<img class="champ-icon" src="' + icon + '" alt="" onerror="this.style.display=\\'none\\'">';
    else html += '<div class="champ-icon" style="display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text-muted)">?</div>';
    html += '<div class="player-info"><div class="player-name-row">';
    html += '<span class="champ-name">' + name + '</span>';
    if (pos) html += '<span class="role-tag">' + pos + '</span>';
    html += '</div></div>';
    html += '<div class="player-stats"><span class="level" style="font-size:13px">' + (p.picked ? '✓' : '...') + '</span></div>';
    html += '</div>';
  });
  html += '</div>';

  // Bans
  if (data.bans && data.bans.length) {
    html += '<div class="section"><div class="section-title" style="color:var(--text-muted)">BANNED</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    data.bans.forEach(b => {
      html += '<div style="display:flex;align-items:center;gap:4px;padding:3px 8px;background:#E8405711;border-radius:4px;border:1px solid #E8405733">';
      html += '<img class="champ-icon" style="width:24px;height:24px" src="' + iconUrl(b.enName) + '" onerror="this.style.display=\\'none\\'">';
      html += '<span style="font-size:11px;color:var(--red)">' + b.jaName + '</span></div>';
    });
    html += '</div></div>';
  }

  document.getElementById('content').innerHTML = html;
}

async function poll() {
  try {
    const res = await fetch('/api/gamedata');
    const json = await res.json();
    if (!json.gameData) {
      // ゲーム外 → チャンピオンセレクト中かチェック
      const inChampSelect = await pollChampSelect();
      if (inChampSelect) return;
      document.getElementById('content').innerHTML = '<div class="waiting"><div class="spinner"></div><div class="waiting-text">試合待機中...</div></div>';
      document.getElementById('statusDot').className = 'status-dot dot-yellow';
      document.getElementById('phaseBadge').innerHTML = '';
      return;
    }
    if (json.ended) {
      // 試合終了後 → チャンプセレクト始まってたらそっちを優先
      const inChampSelect = await pollChampSelect();
      if (inChampSelect) return;
      document.getElementById('statusDot').className = 'status-dot dot-gray';
      render(json, true);
    } else {
      document.getElementById('statusDot').className = 'status-dot dot-green';
      render(json, false);
    }
  } catch (e) {
    document.getElementById('statusDot').className = 'status-dot dot-red';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = e.message;
  }
}

function sortByRole(players) {
  const order = { TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4 };
  return [...players].sort((a, b) => (order[a.position] ?? 9) - (order[b.position] ?? 9));
}

function kdaClass(p) {
  const k = p.scores.kills, d = p.scores.deaths, a = p.scores.assists;
  if (d >= 5) return 'kda-bad';
  if (k >= 5 || (k + a) / Math.max(d, 1) >= 3) return 'kda-good';
  return 'kda-neutral';
}

function buildFlags(p) {
  if (!p.flags || !p.flags.length) return '';
  const f = [];
  if (p.flags.includes('fed')) f.push('<span class="flag flag-fed">F</span>');
  if (p.flags.includes('tank')) f.push('<span class="flag flag-tank">T</span>');
  if (p.flags.includes('healer')) f.push('<span class="flag flag-heal">H</span>');
  if (p.flags.includes('cc')) f.push('<span class="flag flag-cc">C</span>');
  return f.length ? '<div class="flags-row">' + f.join('') + '</div>' : '';
}

function renderPlayerAlly(p, isMe) {
  const kda = p.scores.kills + '/' + p.scores.deaths + '/' + p.scores.assists;
  const cls = kdaClass(p);
  const meClass = isMe ? ' me' : '';
  const name = p.championName || p.enName || '???';
  // Ally(右側): icon+name(左寄せ) → KDA(右寄せ)
  let html = '<div class="row-lr ally-row' + meClass + '">';
  html += '<div class="lr-info">';
  html += '<img class="champ-icon" src="' + iconUrl(p.enName) + '" alt="" onerror="this.style.visibility=\\'hidden\\'">';
  html += '<div class="lr-name-col"><span class="champ-name">' + name + '</span>' + buildFlags(p) + '</div>';
  html += '</div>';
  html += '<div class="lr-stats"><span class="kda ' + cls + '">' + kda + '</span><span class="level">Lv' + p.level + '</span></div>';
  html += '</div>';
  return html;
}

function renderPlayerEnemy(p) {
  const kda = p.scores.kills + '/' + p.scores.deaths + '/' + p.scores.assists;
  const cls = kdaClass(p);
  const name = p.championName || p.enName || '???';
  // Enemy(左側): KDA(左寄せ) → name+icon(右寄せ)
  let html = '<div class="row-lr enemy-row">';
  html += '<div class="lr-stats"><span class="kda ' + cls + '">' + kda + '</span><span class="level">Lv' + p.level + '</span></div>';
  html += '<div class="lr-info">';
  html += '<div class="lr-name-col"><span class="champ-name">' + name + '</span>' + buildFlags(p) + '</div>';
  html += '<img class="champ-icon" src="' + iconUrl(p.enName) + '" alt="" onerror="this.style.visibility=\\'hidden\\'">';
  html += '</div>';
  html += '</div>';
  return html;
}

function render(data, isEnded) {
  const { gameData, players, context, suggestion, triggered } = data;
  const totalSec = gameData.gameTime || 0;
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = min + ':' + sec;

  // phase badge
  let phase, phaseClass;
  if (totalSec < 900) { phase = '序盤'; phaseClass = 'phase-early'; }
  else if (totalSec < 1500) { phase = '中盤'; phaseClass = 'phase-mid'; }
  else { phase = '終盤'; phaseClass = 'phase-late'; }
  document.getElementById('phaseBadge').innerHTML = '<span class="phase-badge ' + phaseClass + '">' + phase + '</span>';

  const me = players.me;
  const allies = players.allies;
  const enemies = players.enemies;

  let html = '';
  if (isEnded) {
    html += '<div class="ended-banner">GAME ENDED — 最終成績</div>';
  }

  const sortedAllies = sortByRole([me, ...allies]);
  const sortedEnemies = sortByRole(enemies);

  // ORDER=青(左), CHAOS=赤(右) → 自分のチームに合わせて配置
  const allyIsLeft = (data.myTeamSide === 'ORDER');
  const leftTeam = allyIsLeft ? sortedAllies : sortedEnemies;
  const rightTeam = allyIsLeft ? sortedEnemies : sortedAllies;
  const leftLabel = allyIsLeft ? 'ALLY' : 'ENEMY';
  const rightLabel = allyIsLeft ? 'ENEMY' : 'ALLY';
  const leftClass = allyIsLeft ? 'ally' : 'enemy';
  const rightClass = allyIsLeft ? 'enemy' : 'ally';

  // Kill diff bar
  const allyKills = [me, ...allies].reduce((s, p) => s + (p.scores?.kills || 0), 0);
  const enemyKills = enemies.reduce((s, p) => s + (p.scores?.kills || 0), 0);
  const total = allyKills + enemyKills || 1;
  const leftKills = allyIsLeft ? allyKills : enemyKills;
  const rightKills = allyIsLeft ? enemyKills : allyKills;
  const leftKillClass = allyIsLeft ? 'kill-ally' : 'kill-enemy';
  const rightKillClass = allyIsLeft ? 'kill-enemy' : 'kill-ally';
  const leftBarClass = allyIsLeft ? 'kill-bar-ally' : 'kill-bar-enemy';
  const rightBarClass = allyIsLeft ? 'kill-bar-enemy' : 'kill-bar-ally';
  html += '<div class="kill-diff">';
  html += '<span class="kill-score ' + leftKillClass + '">' + leftKills + '</span>';
  html += '<div class="kill-bar-wrap"><div class="' + leftBarClass + '" style="width:' + (leftKills/total*100) + '%"></div><div class="' + rightBarClass + '" style="width:' + (rightKills/total*100) + '%"></div></div>';
  html += '<span class="kill-score ' + rightKillClass + '">' + rightKills + '</span>';
  html += '</div>';

  // 左右テーブル
  html += '<div class="teams-header"><span class="section-title ' + leftClass + '" style="margin:0">' + leftLabel + '</span><span class="section-title ' + rightClass + '" style="margin:0">' + rightLabel + '</span></div>';
  html += '<div class="teams-grid ' + (allyIsLeft ? 'ally-left' : 'ally-right') + '">';
  const rows = Math.max(leftTeam.length, rightTeam.length);
  for (let i = 0; i < rows; i++) {
    html += '<div class="match-row">';
    html += '<div class="match-cell ' + (allyIsLeft ? 'ally-side' : 'enemy-side') + '">';
    if (leftTeam[i]) {
      if (allyIsLeft) html += renderPlayerAlly(leftTeam[i], leftTeam[i] === me);
      else html += renderPlayerEnemy(leftTeam[i]);
    }
    html += '</div>';
    html += '<div class="match-vs">vs</div>';
    html += '<div class="match-cell ' + (allyIsLeft ? 'enemy-side' : 'ally-side') + '">';
    if (rightTeam[i]) {
      if (allyIsLeft) html += renderPlayerEnemy(rightTeam[i]);
      else html += renderPlayerAlly(rightTeam[i], rightTeam[i] === me);
    }
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Build
  html += '<div class="build-section">';
  if (suggestion) {
    html += '<div class="buy-now"><div class="buy-now-label">Next Buy</div><div class="buy-now-item">' + suggestion.buy_now + '</div></div>';
    html += '<div class="build-list"><div class="build-list-title">Full Build</div>';
    (suggestion.full_build || []).forEach(item => { html += '<div class="build-item">' + item + '</div>'; });
    html += '</div>';
    html += '<div class="reasoning">' + suggestion.reasoning + '</div>';
    html += '<div class="tips">' + suggestion.tips + '</div>';
  } else {
    html += '<div class="reasoning">AI提案待ち... (トリガー: ' + (triggered ? 'あり' : 'なし') + ')</div>';
  }
  html += '</div>';

  html += '<div class="context-debug">' + context.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
  document.getElementById('content').innerHTML = html;
}

setInterval(poll, 3000);
poll();
</script>
</body>
</html>`;

let lastSuggestion = null;
let lastGameSnapshot = null; // 試合終了後も最終データを保持
let spellsLoadedForGame = false; // 試合ごとに1回だけスキル取得
let aiPending = false; // Claude API呼び出し中フラグ

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/gamedata') {
    const gameData = await fetchLoL('/liveclientdata/allgamedata');
    if (!gameData) {
      // 試合終了 → 最終スナップショットがあればそれを返す
      if (lastGameSnapshot) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...lastGameSnapshot, ended: true }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ gameData: null }));
      return;
    }

    const context = cb.build(gameData);
    const triggered = dd.check(gameData);

    // 初回 or トリガー発火 → Claude APIにビルド提案をリクエスト（非同期・ノンブロッキング）
    if ((triggered || !lastSuggestion) && !aiPending) {
      aiPending = true;
      console.log('[AI] トリガー発火 → Claude API呼び出し中...');
      claude.getSuggestion(context).then(s => {
        if (s) {
          lastSuggestion = s;
          console.log('[AI] 提案取得:', s.buy_now);
        }
        aiPending = false;
      }).catch(() => { aiPending = false; });
    }

    const me = gameData.allPlayers.find(p =>
      p.summonerName === gameData.activePlayer.summonerName ||
      p.riotIdGameName === gameData.activePlayer.riotIdGameName
    ) || gameData.allPlayers[0];

    const myTeam = me.team;
    const allies = gameData.allPlayers.filter(p => p.team === myTeam && p !== me);
    const enemies = gameData.allPlayers.filter(p => p.team !== myTeam);

    // enName付与 + フラグ付与
    const allWithEn = gameData.allPlayers.map(p => {
      const en = extractEnName(p);
      p.enName = en;
      return p;
    });

    // 試合開始時に1回だけ10体のスキル情報を取得
    if (!spellsLoadedForGame) {
      spellsLoadedForGame = true;
      const names = allWithEn.map(p => p.enName).filter(Boolean);
      loadSpellsForMatch(names).catch(() => {});
    }

    enemies.forEach(e => {
      const en = e.enName;
      e.flags = [];
      if ((e.scores?.kills || 0) >= 5) e.flags.push('fed');
      // Data Dragon tags でタンク判定
      const champInfo = getChampionById(e.championId || 0);
      if (champInfo.tags?.includes('Tank')) e.flags.push('tank');
      // スキル説明から回復・CC判定
      const spells = getSpells(en);
      if (spells) {
        const allText = [spells.passive.desc, ...spells.spells.map(s => s.desc)].join(' ');
        if (/回復|ヒール|体力を.*回復|ライフスティール/.test(allText)) e.flags.push('healer');
        if (/スタン|スネア|ノックアップ|ノックバック|サイレンス|フィアー|拘束|束縛|打ち上げ|引き寄せ|チャーム|魅了|挑発|スリープ|変身させ|サプレッション|エアボーン/.test(allText)) e.flags.push('cc');
        if (/シールド/.test(allText)) e.flags.push('shield');
      }
    });

    // meにもフラグなし・enNameを付与
    me.enName = extractEnName(me);
    me.flags = me.flags || [];
    allies.forEach(a => { a.enName = extractEnName(a); a.flags = a.flags || []; });

    const snapshot = {
      gameData: gameData.gameData,
      activePlayer: gameData.activePlayer,
      players: { me, allies, enemies },
      myTeamSide: me.team, // "ORDER"(青/左) or "CHAOS"(赤/右)
      context,
      triggered,
      suggestion: lastSuggestion,
      ended: false
    };
    lastGameSnapshot = snapshot; // 常に最新を保存
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(snapshot));
  } else if (req.url === '/api/champselect') {
    // LCU APIからチャンピオンセレクト情報を取得
    const session = await lcu.getChampSelect();
    if (!session || session.errorCode) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ active: false }));
      return;
    }

    // 新しい試合のピック画面 → 前の試合のスナップショットをクリア
    lastGameSnapshot = null;
    spellsLoadedForGame = false;
    const myCellId = session.localPlayerCellId;

    // myTeam / theirTeam をパース
    const parseTeam = (team) => (team || []).map(p => {
      const champ = getChampionById(p.championId);
      return {
        cellId: p.cellId,
        championId: p.championId,
        enName: champ.enName,
        jaName: champ.jaName,
        spell1Id: p.spell1Id,
        spell2Id: p.spell2Id,
        assignedPosition: p.assignedPosition || '',
        isMe: p.cellId === myCellId,
        picked: p.championId > 0
      };
    });

    // BAN情報
    const bans = { myTeam: session.bans?.myTeamBans || [], theirTeam: session.bans?.theirTeamBans || [] };
    const banChamps = [...bans.myTeam, ...bans.theirTeam]
      .filter(id => id > 0)
      .map(id => getChampionById(id));

    // 現在のフェーズ (actions配列から判定)
    let currentPhase = 'waiting';
    for (const actionGroup of (session.actions || [])) {
      for (const action of actionGroup) {
        if (!action.completed && action.isInProgress) {
          currentPhase = action.type; // 'ban' or 'pick'
          break;
        }
      }
      if (currentPhase !== 'waiting') break;
    }

    const timer = session.timer || {};

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      active: true,
      phase: currentPhase,
      timer: { adjustedTimeLeftInPhase: timer.adjustedTimeLeftInPhase, phase: timer.phase },
      myTeam: parseTeam(session.myTeam),
      theirTeam: parseTeam(session.theirTeam),
      bans: banChamps,
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
  }
});

server.listen(3456, () => {
  console.log('Live Preview: http://localhost:3456');
  console.log('LoLの試合中にブラウザで開いてください');
});
