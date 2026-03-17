const { initPatchData, getAllChampions } = require('../electron/api/patchData')

async function main() {
  await initPatchData()
  const champMap = getAllChampions()

  // 問題のチャンプの info を確認
  const targets = ['Riven', 'Vi', 'Smolder', 'Aurora', 'Bard', 'Katarina', 'Teemo', 'Corki', 'Mordekaiser', 'Ahri', 'Zed', 'Ashe', 'Lux', 'Leona', 'Vayne']
  for (const name of targets) {
    const champ = Object.values(champMap).find(c => c.enName === name)
    if (champ) {
      console.log(`${name} | tags=${champ.tags.join(',')} | stats.info?=${JSON.stringify(champ.stats)}`.substring(0, 120))
    }
  }
}
main()
