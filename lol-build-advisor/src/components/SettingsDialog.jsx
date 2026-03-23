import { useState, useEffect } from 'react'
import { X, Loader2, RefreshCw, FolderOpen, Zap, FileText, Scale, Crown, Wrench } from 'lucide-react'
import { LegalDialog } from './LegalDialog'

export function SettingsDialog({ onClose, isDev }) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState(null)
  const [legalPage, setLegalPage] = useState(null) // 'privacy' | 'disclaimer' | null

  // デバッグ設定
  const [skipTimeLimit, setSkipTimeLimit] = useState(false)

  useEffect(() => {
    if (isDev) {
      window.electronAPI?.getDebugSettings?.().then(s => {
        if (s?.skipTimeLimit) setSkipTimeLimit(true)
      })
    }
  }, [isDev])

  const handleSkipTimeLimitChange = async (checked) => {
    setSkipTimeLimit(checked)
    await window.electronAPI?.setDebugSettings?.({ skipTimeLimit: checked })
  }

  // TODO: 課金基盤整備後に実ロジックへ差し替え（現在はスタブ）
  const planType = 'free' // 'free' | 'paid'
  const freeUsed = 0
  const freeLimit = 5

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-lol-surface border border-lol-gold/30 rounded-lg w-[360px] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-lol-gold/20">
          <span className="font-heading text-xs text-lol-gold tracking-wider">SETTINGS</span>
          <button onClick={onClose} className="text-lol-text hover:text-lol-text-light">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* ── プラン状態表示 ── */}
          <div className="space-y-2 p-3 rounded bg-lol-bg border border-lol-blue/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-lol-text-light flex items-center gap-1.5">
                <Zap size={12} className="text-lol-blue" />
                AI プラン
              </span>
            </div>

            {planType === 'paid' ? (
              <div className="flex items-center gap-2 py-2">
                <Crown size={14} className="text-lol-gold" />
                <span className="text-xs text-lol-gold">有料プラン契約済み</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-lol-text-light">本日の残り回数</span>
                  <span className={`text-xs font-medium ${freeLimit - freeUsed <= 1 ? 'text-lol-red' : 'text-lol-blue'}`}>
                    残り {freeLimit - freeUsed}/{freeLimit} 回
                  </span>
                </div>
                <div className="w-full bg-lol-surface-light rounded-full h-1.5">
                  <div
                    className="bg-lol-blue h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((freeLimit - freeUsed) / freeLimit) * 100}%` }}
                  />
                </div>
                {freeUsed >= freeLimit && (
                  <div className="text-center py-2 space-y-1">
                    <p className="text-[11px] text-lol-red">本日の無料枠を使い切りました</p>
                    <button className="px-3 py-1.5 text-[11px] rounded bg-lol-gold/20 text-lol-gold border border-lol-gold/30 hover:bg-lol-gold/30 transition-colors">
                      有料プランに登録
                    </button>
                  </div>
                )}
              </div>
            )}
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

          {/* ── 開発者メニュー（デバッグ時のみ） ── */}
          {isDev && (
            <div className="space-y-2 p-3 rounded bg-lol-bg border border-lol-red/20">
              <span className="text-xs text-lol-red flex items-center gap-1.5">
                <Wrench size={12} />
                開発者メニュー
              </span>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-lol-text-light">15分待たずにビルド提案を開始</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={skipTimeLimit}
                  onClick={() => handleSkipTimeLimitChange(!skipTimeLimit)}
                  className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${skipTimeLimit ? 'bg-lol-blue' : 'bg-lol-surface-light'}`}
                >
                  <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${skipTimeLimit ? 'translate-x-3.5 ml-0' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          )}

          {/* バージョン情報 & 法的情報 */}
          <div className="pt-2 border-t border-lol-gold-dim/20 text-center space-y-2">
            <p className="text-[10px] text-lol-text/50">
              ろるさぽくん v{__APP_VERSION__}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setLegalPage('privacy')}
                className="text-[10px] text-lol-text/40 hover:text-lol-blue transition-colors flex items-center gap-1"
              >
                <FileText size={10} />
                プライバシーポリシー
              </button>
              <span className="text-lol-text/20">|</span>
              <button
                onClick={() => setLegalPage('disclaimer')}
                className="text-[10px] text-lol-text/40 hover:text-lol-blue transition-colors flex items-center gap-1"
              >
                <Scale size={10} />
                免責事項
              </button>
            </div>
            <p className="text-[9px] text-lol-text/30 leading-relaxed">
              ろるさぽくん isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
            </p>
          </div>
        </div>
      </div>

      {legalPage && (
        <LegalDialog page={legalPage} onClose={() => setLegalPage(null)} />
      )}
    </div>
  )
}
