/**
 * GameLogger — 試合ごとの詳細デバッグログをファイル出力
 *
 * console.log / console.warn / console.error をフックし、
 * 試合開始〜終了までのログを1ファイルにまとめて出力する。
 *
 * 保存先: {userData}/game-logs/game_YYYY-MM-DD_HH-mm-ss.log
 */

const fs = require('fs')
const path = require('path')

class GameLogger {
  constructor(userDataPath) {
    this.userDataPath = userDataPath
    this.logDir = path.join(userDataPath, 'game-logs')
    this.lines = []
    this.active = false
    this.startTime = null
    this.filePath = null

    // 元の console メソッドを保持
    this._origLog = console.log
    this._origWarn = console.warn
    this._origError = console.error
    this._hooked = false
  }

  /**
   * console.log/warn/error をフックして記録開始
   * アプリ起動時に1回だけ呼ぶ
   */
  hook() {
    if (this._hooked) return
    this._hooked = true

    const self = this

    console.log = function (...args) {
      self._origLog.apply(console, args)
      self._capture('LOG', args)
    }
    console.warn = function (...args) {
      self._origWarn.apply(console, args)
      self._capture('WARN', args)
    }
    console.error = function (...args) {
      self._origError.apply(console, args)
      self._capture('ERR', args)
    }
  }

  /**
   * 試合開始 — ログ蓄積を開始
   */
  startGame() {
    this.lines = []
    this.startTime = Date.now()
    this.active = true

    const now = new Date()
    const stamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\.\d+Z/, '')
    this.filePath = path.join(this.logDir, `game_${stamp}.log`)

    this._write('INFO', ['=== Game session started ==='])
  }

  /**
   * 試合終了 — ログをファイルに書き出し
   * @returns {string|null} 保存先パス
   */
  endGame() {
    if (!this.active) return null
    this._write('INFO', ['=== Game session ended ==='])
    this.active = false

    if (this.lines.length === 0) return null

    // ディレクトリ作成
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }

    const content = this.lines.join('\n') + '\n'
    try {
      fs.writeFileSync(this.filePath, content, 'utf-8')
      this._origLog(`[GameLogger] Saved ${this.lines.length} lines to ${this.filePath}`)
      return this.filePath
    } catch (err) {
      this._origError(`[GameLogger] Failed to save: ${err.message}`)
      return null
    }
  }

  /**
   * 記録中かどうか
   */
  isActive() {
    return this.active
  }

  /**
   * ログファイル一覧を取得
   */
  listLogs() {
    if (!fs.existsSync(this.logDir)) return []
    return fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse()
      .map(f => ({
        name: f,
        path: path.join(this.logDir, f),
        size: fs.statSync(path.join(this.logDir, f)).size,
      }))
  }

  /**
   * ログファイルの内容を読む
   */
  readLog(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  // ── 内部メソッド ──

  _capture(level, args) {
    if (!this.active) return
    this._write(level, args)
  }

  _write(level, args) {
    const elapsed = this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(1) : '0.0'
    const time = new Date().toISOString().substring(11, 23) // HH:mm:ss.SSS
    const msg = args.map(a => {
      if (typeof a === 'string') return a
      try { return JSON.stringify(a) } catch { return String(a) }
    }).join(' ')
    this.lines.push(`[${time}][+${elapsed}s][${level}] ${msg}`)
  }
}

module.exports = { GameLogger }
