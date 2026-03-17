const fs = require('fs');

const main = fs.readFileSync('electron/main.js', 'utf-8');
const preload = fs.readFileSync('electron/preload.js', 'utf-8');
console.log('✅ main.js (' + main.length + ' bytes)');
console.log('✅ preload.js (' + preload.length + ' bytes)');

const mainHandlers = [...main.matchAll(/ipcMain\.(on|handle)\(['"](.+?)['"]/g)].map(m => ({ type: m[1], ch: m[2] }));
const preloadInvokes = [...preload.matchAll(/invoke\(['"](.+?)['"]/g)].map(m => m[1]);
const preloadOns = [...preload.matchAll(/\.on\(['"](.+?)['"]/g)].map(m => m[1]);
const mainSends = [...main.matchAll(/send\(['"](.+?)['"]/g)].map(m => m[1]);

console.log('\n--- IPC Channels ---');
console.log('Main handlers:', mainHandlers.map(h => h.ch));
console.log('Main sends:', [...new Set(mainSends)]);
console.log('Preload invokes:', preloadInvokes);
console.log('Preload listeners:', preloadOns);

let errors = 0;
preloadInvokes.forEach(ch => {
  if (!mainHandlers.find(h => h.ch === ch)) {
    console.log('❌ preload invokes "' + ch + '" but no handler in main');
    errors++;
  }
});
preloadOns.forEach(ch => {
  if (!mainSends.includes(ch)) {
    console.log('❌ preload listens "' + ch + '" but main never sends it');
    errors++;
  }
});
if (errors === 0) console.log('✅ IPC channels全て整合');
