import { useState, useEffect } from 'react'
import { X, Key, Check, Loader2, AlertCircle, Brain, Pin, RefreshCw, FolderOpen } from 'lucide-react'

export function SettingsDialog({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState('idle')
  const [saved, setSaved] = useState(false)
  const [aiOn, setAiOn] = useState(false)
  const [onTop, setOnTop] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState(null)

  useEffect(() => {
    window.electronAPI?.getApiKey().then(key => {
      if (key) { setApiKey(key); setStatus('valid') }
    })
    window.electronAPI?.getAiStatus().then(on => setAiOn(!!on))
    window.electronAPI?.getOnTopStatus().then(on => setOnTop(!!on))
  }, [])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setStatus('validating')
    const valid = await window.electronAPI?.validateApiKey(apiKey.trim())
    if (valid) {
      await window.electronAPI?.setApiKey(apiKey.trim())
      setStatus('valid')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setStatus('invalid')
    }
  }

  const handleAiToggle = async () => {
    const next = !aiOn
    await window.electronAPI?.toggleAi(next)
    setAiOn(next)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-lol-surface border border-lol-gold/30 rounded-lg w-[360px] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-lol-gold/20">
          <span className="font-heading text-xs text-lol-gold tracking-wider">SETTINGS</span>
          <button onClick={onClose} className="text-lol-text hover:text-lol-text-light">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 最前面 ON/OFF トグル */}
          <div className="flex items-center justify-between py-2 px-3 rounded bg-lol-bg border border-lol-gold-dim/30">
            <div className="flex items-center gap-2">
              <Pin size={14} className={onTop ? 'text-lol-gold' : 'text-lol-text'} />
              <span className="text-xs text-lol-text-light">常に最前面に表示</span>
            </div>
            <button
              onClick={async () => { const next = !onTop; await window.electronAPI?.toggleOnTop(next); setOnTop(next) }}
              className={`relative w-10 h-5 rounded-full transition-colors ${onTop ? 'bg-lol-gold' : 'bg-lol-surface-light'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${onTop ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* AI ON/OFF トグル */}
          <div className="flex items-center justify-between py-2 px-3 rounded bg-lol-bg border border-lol-gold-dim/30">
            <div className="flex items-center gap-2">
              <Brain size={14} className={aiOn ? 'text-lol-blue' : 'text-lol-text'} />
              <span className="text-xs text-lol-text-light">AIビルド提案</span>
            </div>
            <button
              onClick={handleAiToggle}
              className={`relative w-10 h-5 rounded-full transition-colors ${aiOn ? 'bg-lol-blue' : 'bg-lol-surface-light'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${aiOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* キャッシュ再取得 */}
          <div className="flex items-center justify-between py-2 px-3 rounded bg-lol-bg border border-lol-gold-dim/30">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-lol-text" />
                <span className="text-xs text-lol-text-light">データキャッシュ</span>
              </div>
              <span className="text-[10px] text-lol-text ml-6">チャンピオン・アイテム・スキル情報</span>
            </div>
            <button
              onClick={async () => {
                setRefreshing(true)
                setRefreshResult(null)
                const r = await window.electronAPI?.refreshCache()
                setRefreshing(false)
                setRefreshResult(r?.success ? `v${r.version} 取得完了` : '取得失敗')
                setTimeout(() => setRefreshResult(null), 3000)
              }}
              disabled={refreshing}
              className="px-2 py-1 text-xs rounded border border-lol-gold-dim/30 text-lol-text-light hover:bg-lol-gold/20 hover:text-lol-gold transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              {refreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {refreshing ? '取得中...' : '再取得'}
            </button>
          </div>
          {refreshResult && (
            <p className="text-[11px] text-lol-blue text-center">{refreshResult}</p>
          )}

          {/* APIキー */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs text-lol-text">
              <Key size={12} />
              Anthropic APIキー
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setStatus('idle') }}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 bg-lol-bg border border-lol-gold-dim/30 rounded text-sm text-lol-text-light placeholder:text-lol-text/30 focus:outline-none focus:border-lol-gold/50"
            />
            {status === 'invalid' && (
              <div className="flex items-center gap-1.5 text-[11px] text-lol-red">
                <AlertCircle size={12} />
                APIキーが無効です
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || status === 'validating'}
            className="w-full py-2 rounded font-medium text-sm bg-lol-gold/20 text-lol-gold border border-lol-gold/30 hover:bg-lol-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {status === 'validating' && <Loader2 size={14} className="animate-spin" />}
            {saved && <Check size={14} />}
            {saved ? '保存しました' : '検証して保存'}
          </button>

          <p className="text-[10px] text-lol-text leading-relaxed">
            APIキーはローカルに保存されます。外部サーバーには送信されません。
            キーは <a href="https://console.anthropic.com/" className="text-lol-blue underline">console.anthropic.com</a> で取得できます。
          </p>

          {/* ゲームログ */}
          <div className="flex items-center justify-between py-2 px-3 rounded bg-lol-bg border border-lol-gold-dim/30">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-lol-text" />
                <span className="text-xs text-lol-text-light">ゲームログ</span>
              </div>
              <span className="text-[10px] text-lol-text ml-6">試合ごとの詳細デバッグログ</span>
            </div>
            <button
              onClick={() => window.electronAPI?.openGameLogFolder()}
              className="px-2 py-1 text-xs rounded border border-lol-gold-dim/30 text-lol-text-light hover:bg-lol-gold/20 hover:text-lol-gold transition-colors flex items-center gap-1"
            >
              <FolderOpen size={12} />
              フォルダを開く
            </button>
          </div>

          {/* バージョン情報 & 免責表記 */}
          <div className="pt-2 border-t border-lol-gold-dim/20 text-center space-y-2">
            <p className="text-[10px] text-lol-text/50">
              ろるさぽくん v{__APP_VERSION__}
            </p>
            <p className="text-[9px] text-lol-text/30 leading-relaxed">
              ろるさぽくん isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
