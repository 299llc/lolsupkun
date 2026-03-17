const https = require('https')

class LiveClientPoller {
  constructor(port = 2999) {
    this.baseUrl = `https://127.0.0.1:${port}`
  }

  fetchAllGameData() {
    return this._fetch('/liveclientdata/allgamedata')
  }

  fetchEventData() {
    return this._fetch('/liveclientdata/eventdata')
  }

  _fetch(path) {
    return new Promise(resolve => {
      https.get(
        `${this.baseUrl}${path}`,
        { rejectUnauthorized: false },
        res => {
          let data = ''
          res.on('data', c => data += c)
          res.on('end', () => {
            try { resolve(JSON.parse(data)) } catch { resolve(null) }
          })
        }
      ).on('error', () => resolve(null))
    })
  }
}

module.exports = { LiveClientPoller }
