import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import './App.css'

// ---- アイコン (SVG インライン) ----
const IconSword = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" /><line x1="19" y1="21" x2="21" y2="19" />
  </svg>
)
const IconBrain = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.77-3.28A3 3 0 0 1 2 13a3 3 0 0 1 2.27-2.92A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.77-3.28A3 3 0 0 0 22 13a3 3 0 0 0-2.27-2.92A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)
const IconMap = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const IconShield = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconTrophy = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/>
    <path d="M17 5h3v4a3 3 0 0 1-3 3"/><path d="M7 5H4v4a3 3 0 0 0 3 3"/>
  </svg>
)
const IconZap = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconTarget = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconClock = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconBarChart = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconKey = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IconDownload = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IconCheck = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconArrowRight = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

// ---- Navbar ----
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(1,10,19,0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(200,170,110,0.2)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded" style={{ background: 'linear-gradient(135deg, #C8AA6E, #0AC8B9)' }} />
          <span className="font-orbitron font-bold text-lg text-gold tracking-wider">LoL Build Advisor</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#94a3b8' }}>
          <a href="#features" className="hover:text-gold transition-colors">機能</a>
          <a href="#how" className="hover:text-gold transition-colors">使い方</a>
          <a href="#pricing" className="hover:text-gold transition-colors">料金</a>
          <a href="#faq" className="hover:text-gold transition-colors">FAQ</a>
        </div>
        <Button className="font-orbitron text-xs tracking-wider gap-2" style={{ background: 'linear-gradient(135deg, #C8AA6E, #9a7c4a)', color: '#010A13', fontWeight: 700 }}>
          <IconDownload width={16} height={16} />
          ダウンロード
        </Button>
      </div>
    </nav>
  )
}

// ---- Hero ----
function Hero() {
  return (
    <section className="hero-bg min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: '#0AC8B9' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: '#C8AA6E' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <Badge className="mb-6 px-4 py-1.5 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(10,200,185,0.15)', color: '#0AC8B9', border: '1px solid rgba(10,200,185,0.4)' }}>
          AI POWERED · REAL-TIME · FREE TO USE
        </Badge>

        <h1 className="font-orbitron font-black mb-6 leading-tight" style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)', lineHeight: 1.1 }}>
          <span className="shimmer-text">試合中にAIが</span>
          <br />
          <span style={{ color: '#e2e8f0' }}>リアルタイムで</span>
          <br />
          <span className="shimmer-text">勝ちに導く</span>
        </h1>

        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8', fontWeight: 300 }}>
          League of Legends の試合中、<span style={{ color: '#0AC8B9' }}>Claude AI</span> がビルド提案・マクロ指示・対面対策を<br className="hidden md:block" />
          リアルタイムで提供。ビルドに悩む時間はもう終わり。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="font-orbitron font-bold text-sm tracking-wider px-8 h-14 glow-gold gap-2" style={{ background: 'linear-gradient(135deg, #C8AA6E, #9a7c4a)', color: '#010A13', minWidth: 220 }}>
            <IconDownload width={18} height={18} />
            無料でダウンロード
          </Button>
          <a href="#features">
            <Button size="lg" variant="outline" className="font-orbitron text-sm tracking-wider px-8 h-14 gap-2" style={{ borderColor: 'rgba(200,170,110,0.4)', color: '#C8AA6E', background: 'transparent' }}>
              機能を見る
              <IconArrowRight />
            </Button>
          </a>
        </div>

        <p className="mt-5 text-xs" style={{ color: '#475569' }}>
          Windows 10/11 対応 · Anthropic APIキーが必要（BYOK） · Vanguard 互換確認済み
        </p>
      </div>

      {/* モックUI */}
      <div className="relative z-10 mt-16 max-w-xl w-full mx-auto animate-float">
        <div className="rounded-xl overflow-hidden border" style={{ background: '#0A1428', borderColor: 'rgba(200,170,110,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(200,170,110,0.1)' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.2)' }}>
            <span className="font-orbitron text-xs text-gold tracking-wider">LoL Build Advisor</span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#0AC8B9' }}>● LIVE</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#4a5568' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#4a5568' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#E84057' }} />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="rounded-lg p-3 border" style={{ background: '#0A1E32', borderColor: 'rgba(10,200,185,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <IconBrain width={14} height={14} style={{ color: '#0AC8B9' }} />
                <span className="text-xs font-bold font-orbitron" style={{ color: '#0AC8B9' }}>AI ビルド提案</span>
                <Badge style={{ background: 'rgba(200,170,110,0.2)', color: '#C8AA6E', border: 'none', fontSize: 10, padding: '1px 6px' }}>優勢</Badge>
              </div>
              <div className="flex gap-2">
                {["Trinity Force", "Sterak's", "Dead Man's"].map((item, i) => (
                  <div key={i} className="flex-1 rounded p-2 text-center" style={{ background: i === 0 ? 'rgba(200,170,110,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(200,170,110,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                    <div className="w-8 h-8 rounded mx-auto mb-1" style={{ background: i === 0 ? 'rgba(200,170,110,0.3)' : 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: 9, color: i === 0 ? '#C8AA6E' : '#94a3b8' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: '#0A1E32', borderColor: 'rgba(200,170,110,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <IconMap width={14} height={14} style={{ color: '#C8AA6E' }} />
                <span className="text-xs font-bold font-orbitron text-gold">マクロアドバイス</span>
              </div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>⚡ ドラゴンがスポーン済み！ボットと協力して確保を優先してください。</p>
            </div>
            <div className="flex gap-2 text-xs">
              {[{ name: 'Garen', kda: '5/1/3', color: '#0AC8B9' }, { name: 'Jinx', kda: '8/2/5', color: '#C8AA6E' }, { name: 'Thresh', kda: '1/0/9', color: '#94a3b8' }].map((p, i) => (
                <div key={i} className="flex-1 rounded p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="font-bold font-orbitron" style={{ color: p.color, fontSize: 10 }}>{p.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 10 }}>{p.kda}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---- Social Proof ----
function SocialProof() {
  const stats = [
    { value: '4種', label: 'AIアナリシス', sub: 'ビルド・マッチアップ・マクロ・コーチング' },
    { value: '3秒', label: 'リアルタイム更新', sub: '試合データを3秒ごとに取得' },
    { value: '~$0.08', label: '1試合のAIコスト', sub: 'Haiku主体で超低コスト運用' },
    { value: '0円', label: 'アプリ料金', sub: 'BYOK型で完全無料スタート' },
  ]
  return (
    <section className="py-16 border-b" style={{ background: '#0A1428', borderColor: 'rgba(200,170,110,0.15)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-orbitron font-black text-3xl md:text-4xl text-gold mb-1 text-glow-gold">{s.value}</div>
              <div className="font-bold text-sm mb-1" style={{ color: '#e2e8f0' }}>{s.label}</div>
              <div className="text-xs" style={{ color: '#475569' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- Problem ----
function Problem() {
  const problems = [
    { icon: '😰', title: 'ビルド迷子', desc: '相手の構成に合わせてビルドを変えるべきなのに、毎回同じビルドをコピー。タンクに対してもAP積んでたり…' },
    { icon: '🗺️', title: 'マクロがわからない', desc: 'キルは取れてるのに気づいたらタワーが折れてる。ドラゴンをいつ取るべきか、バロンファイトのタイミングが掴めない。' },
    { icon: '💀', title: '対面に毎回負ける', desc: '同じチャンプを相手にするたびにやられる。そのチャンプに対してどう立ち回るべきか知らない。' },
  ]
  return (
    <section className="py-24 px-6" style={{ background: '#010A13' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(232,64,87,0.15)', color: '#E84057', border: '1px solid rgba(232,64,87,0.3)' }}>PAIN POINTS</Badge>
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl mb-4" style={{ color: '#e2e8f0' }}>こんな経験、ない？</h2>
          <p style={{ color: '#94a3b8' }}>多くのLoLプレイヤーが抱えるこれらの悩みを、AIが解決します。</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <Card key={i} className="card-hover border" style={{ background: '#0A1428', borderColor: 'rgba(232,64,87,0.2)' }}>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-orbitron font-bold text-lg mb-3" style={{ color: '#E84057' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- Feature Showcase ----
function FeatureBlock({ badge, icon, title, desc, points, reverse, accentColor = '#C8AA6E', mockContent }) {
  const rgb = accentColor === '#C8AA6E' ? '200,170,110' : '10,200,185'
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center py-20`}>
      <div className="flex-1 space-y-5">
        <Badge className="text-xs tracking-widest font-orbitron" style={{ background: `rgba(${rgb},0.15)`, color: accentColor, border: `1px solid rgba(${rgb},0.35)` }}>{badge}</Badge>
        <div className="flex items-center gap-3">
          <span style={{ color: accentColor }}>{icon}</span>
          <h3 className="font-orbitron font-bold text-2xl md:text-3xl" style={{ color: '#e2e8f0' }}>{title}</h3>
        </div>
        <p className="text-base leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</p>
        <ul className="space-y-2">
          {points.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#e2e8f0' }}>
              <span className="mt-0.5 shrink-0" style={{ color: accentColor }}><IconCheck /></span>
              {pt}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 w-full">
        <div className="rounded-xl border p-5" style={{ background: '#0A1428', borderColor: `rgba(${rgb},0.3)`, boxShadow: `0 10px 40px rgba(0,0,0,0.4), 0 0 30px rgba(${rgb},0.08)` }}>
          {mockContent}
        </div>
      </div>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="py-8 px-6 border-t border-b" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.1)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center pt-16 mb-4">
          <Badge className="mb-4 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(200,170,110,0.15)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.3)' }}>FEATURES</Badge>
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl" style={{ color: '#e2e8f0' }}>AIが試合全体をサポート</h2>
        </div>
        <div className="gold-divider my-8" />

        {/* Feature 1 */}
        <FeatureBlock
          badge="AI BUILD SUGGESTION"
          icon={<IconSword />}
          title="リアルタイムAIビルド提案"
          desc="試合中の戦況（KDA・アイテム・キル差・試合時間）をリアルタイムで分析し、Claude AIが最適なアイテム5つを提案。優勢時は攻撃的に、劣勢時は防御的なビルドを自動切り替え。"
          points={['戦況3段階ビルド切り替え（優勢/拮抗/劣勢）', '敵の回復・CC・タンク特性を自動検出してカウンター提案', 'OP.GGコアビルドと組み合わせた精度の高い提案', 'アイテム購入・キル発生のたびに即時更新']}
          mockContent={
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <IconBrain width={14} height={14} style={{ color: '#0AC8B9' }} />
                <span className="text-xs font-bold font-orbitron" style={{ color: '#0AC8B9' }}>AI ITEM SUGGESTION</span>
                <Badge style={{ background: 'rgba(200,170,110,0.2)', color: '#C8AA6E', border: 'none', fontSize: 10, padding: '1px 6px' }}>優勢 +4K</Badge>
              </div>
              {[{ name: "Sterak's Gage", reason: '高い生存力でスノーボール加速', stars: 5 }, { name: 'Trinity Force', reason: 'コアビルド完成を優先', stars: 4 }, { name: "Death's Dance", reason: '対AD相手にダメージ軽減', stars: 3 }].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: i === 0 ? 'rgba(200,170,110,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(200,170,110,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                  <div className="w-10 h-10 rounded shrink-0" style={{ background: i === 0 ? 'rgba(200,170,110,0.2)' : 'rgba(255,255,255,0.08)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: '#C8AA6E' }}>{item.name}</div>
                    <div style={{ color: '#475569', fontSize: 10 }}>{item.reason}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <div key={si} className="w-2 h-2 rounded-full" style={{ background: si < item.stars ? '#C8AA6E' : 'rgba(200,170,110,0.2)' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <div className="gold-divider" />

        {/* Feature 2 */}
        <FeatureBlock
          reverse
          badge="MACRO ADVICE"
          icon={<IconMap />}
          accentColor="#0AC8B9"
          title="マクロアドバイス"
          desc="2分ごと、またはオブジェクト取得時にClaude AIが「今すべき行動」を具体的に指示。オブジェクトタイマーを秒単位で管理し、最適なタイミングでファイトを促します。"
          points={['ドラゴン・バロン・ヴォイドグラブ・ヘラルドのタイマー管理', 'オブジェクト取得可能時は即時アドバイス', '試合フェーズ（序盤/中盤/終盤）を自動判断', '行動理由・警告・次のオブジェクトをセットで提示']}
          mockContent={
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <IconMap width={14} height={14} style={{ color: '#0AC8B9' }} />
                <span className="text-xs font-bold font-orbitron" style={{ color: '#0AC8B9' }}>MACRO ADVICE</span>
                <span className="text-xs" style={{ color: '#475569' }}>24:30</span>
              </div>
              <div className="p-3 rounded-lg border" style={{ background: 'rgba(10,200,185,0.08)', borderColor: 'rgba(10,200,185,0.25)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#0AC8B9' }}>⚡ 推奨アクション</div>
                <p className="text-xs" style={{ color: '#e2e8f0' }}>ボットとミッドを押してからバロンを確保してください。相手ジャングラーは死亡中 (30秒)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ obj: 'Baron', status: 'スポーン中', icon: '👑', color: '#C8AA6E' }, { obj: 'Dragon', status: '3:45後', icon: '🐉', color: '#94a3b8' }, { obj: 'Void Grub', status: '取得済み', icon: '✅', color: '#475569' }, { obj: 'Herald', status: '消滅済み', icon: '💀', color: '#475569' }].map((o, i) => (
                  <div key={i} className="p-2 rounded text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span>{o.icon}</span> <span className="font-bold" style={{ color: o.color }}>{o.obj}</span>
                    <div style={{ color: '#475569', fontSize: 10 }}>{o.status}</div>
                  </div>
                ))}
              </div>
            </div>
          }
        />

        <div className="gold-divider" />

        {/* Feature 3 */}
        <FeatureBlock
          badge="CHAMP SELECT"
          icon={<IconShield />}
          title="チャンプセレクト分析"
          desc="チャンピオン選択中にチーム構成を自動分析。AD/AP比率、CC・回復有無をリアルタイム表示。OP.GGのコアビルド・ルーン・スキルオーダーも先行表示します。"
          points={['チーム全体のAD/AP比率を視覚化', 'CC・回復・シールド・タンクの有無を自動検出', 'OP.GGからコアビルド・推奨ルーン・スキルオーダーを自動取得', 'チャンプセレクト中にすでに対策を立てられる']}
          mockContent={
            <div className="space-y-3">
              <div className="text-xs font-bold mb-2 font-orbitron" style={{ color: '#C8AA6E' }}>CHAMP SELECT · TEAM ANALYSIS</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border" style={{ background: 'rgba(10,200,185,0.08)', borderColor: 'rgba(10,200,185,0.2)' }}>
                  <div className="text-xs font-bold mb-1" style={{ color: '#0AC8B9' }}>味方チーム</div>
                  <div className="flex gap-1 flex-wrap">
                    {['CC有り', 'タンク有り', 'AD 60%'].map(t => <span key={t} className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(10,200,185,0.15)', color: '#0AC8B9', fontSize: 9 }}>{t}</span>)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border" style={{ background: 'rgba(232,64,87,0.08)', borderColor: 'rgba(232,64,87,0.2)' }}>
                  <div className="text-xs font-bold mb-1" style={{ color: '#E84057' }}>敵チーム</div>
                  <div className="flex gap-1 flex-wrap">
                    {['回復有り', 'Fed注意', 'AP 55%'].map(t => <span key={t} className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(232,64,87,0.15)', color: '#E84057', fontSize: 9 }}>{t}</span>)}
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border" style={{ background: 'rgba(200,170,110,0.06)', borderColor: 'rgba(200,170,110,0.2)' }}>
                <div className="text-xs font-bold mb-2" style={{ color: '#C8AA6E' }}>推奨コアビルド (OP.GG)</div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-9 h-9 rounded" style={{ background: 'rgba(200,170,110,0.15)', border: '1px solid rgba(200,170,110,0.25)' }} />
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <div className="gold-divider" />

        {/* Feature 4 */}
        <FeatureBlock
          reverse
          badge="POST-GAME COACHING"
          icon={<IconTrophy />}
          accentColor="#0AC8B9"
          title="試合後AIコーチング"
          desc="試合終了後、Claude Sonnetが試合全体を振り返り。KDA・ビルド選択・マクロ判断を総合評価し、具体的な改善点を提示。毎試合確実に成長できます。"
          points={['試合全体のパフォーマンスをスコア付きで評価', '良かった点・改善点をセクション別に分析', 'ビルド選択の適切さを振り返り', 'Sonnetモデルによる高品質な分析']}
          mockContent={
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-orbitron" style={{ color: '#0AC8B9' }}>POST-GAME COACHING</span>
                <Badge style={{ background: 'rgba(10,200,185,0.2)', color: '#0AC8B9', border: 'none', fontSize: 10 }}>VICTORY</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{ label: 'KDA', score: '8.5' }, { label: 'ビルド', score: '7.0' }, { label: 'マクロ', score: '6.5' }].map((s, i) => (
                  <div key={i} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="font-orbitron font-bold text-lg" style={{ color: '#C8AA6E' }}>{s.score}</div>
                    <div className="text-xs" style={{ color: '#475569' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg border" style={{ background: 'rgba(10,200,185,0.06)', borderColor: 'rgba(10,200,185,0.2)' }}>
                <div className="text-xs font-bold mb-1" style={{ color: '#0AC8B9' }}>改善点</div>
                <p className="text-xs" style={{ color: '#94a3b8' }}>14分以降のオブジェクトファイトへの参加が遅れています。ドラゴンスポーン前にサイドレーンを素早く処理するルートを意識してください。</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  )
}

// ---- Feature Grid ----
function FeatureGrid() {
  const items = [
    { icon: <IconTarget style={{ color: '#C8AA6E' }} />, title: 'マッチアップTip', desc: '試合開始時に対面チャンプとの戦い方を3行で解説。有利なタイミングと注意点をすぐ把握。' },
    { icon: <IconClock style={{ color: '#0AC8B9' }} />, title: 'オブジェクトタイマー', desc: 'ドラゴン・バロン・ヴォイドグラブ・ヘラルドの状態を秒単位で追跡・表示。' },
    { icon: <IconBarChart style={{ color: '#C8AA6E' }} />, title: 'KDAリアルタイム', desc: '全10人のKDA・レベル・アイテムを3秒更新。チャンピオン・アイテムアイコン付き。' },
    { icon: <IconZap style={{ color: '#0AC8B9' }} />, title: 'スマートな呼び出し制御', desc: 'AI呼び出しを10秒デバウンスで重複排除。コストを抑えながら必要な時に確実に提案。' },
    { icon: <IconShield style={{ color: '#C8AA6E' }} />, title: '観戦モード対応', desc: '観戦時もプレイヤーを選択してビルド・マッチアップ情報を確認できます。' },
    { icon: <IconKey style={{ color: '#0AC8B9' }} />, title: 'BYOK（完全無料）', desc: '自分のAnthropicAPIキーを設定するだけ。サーバー不要・月額0円で使い始められます。' },
  ]
  return (
    <section className="py-24 px-6" style={{ background: '#0A1428' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-orbitron font-bold text-2xl md:text-3xl mb-4" style={{ color: '#e2e8f0' }}>その他の機能</h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>細部にもLoLプレイヤーへの配慮が詰まっています</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Card key={i} className="card-hover" style={{ background: '#010A13', border: '1px solid rgba(200,170,110,0.15)' }}>
              <CardContent className="p-5">
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: '#e2e8f0' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- How it works ----
function HowItWorks() {
  const steps = [
    { num: '01', icon: <IconDownload width={28} height={28} style={{ color: '#C8AA6E' }} />, title: 'ダウンロード & インストール', desc: 'GitHubからインストーラーをダウンロードして実行するだけ。Windows 10/11に対応。' },
    { num: '02', icon: <IconKey width={28} height={28} style={{ color: '#0AC8B9' }} />, title: 'Anthropic APIキーを設定', desc: 'Anthropic Consoleで取得したAPIキーをアプリに入力するだけ。設定はローカル保存で安全。' },
    { num: '03', icon: <IconZap width={28} height={28} style={{ color: '#C8AA6E' }} />, title: 'LoLを起動して試合スタート', desc: 'あとはLoLを起動するだけ。チャンプセレクトから試合終了まで、AIが自動でサポートします。' },
  ]
  return (
    <section id="how" className="py-24 px-6" style={{ background: '#010A13' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(200,170,110,0.15)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.3)' }}>HOW IT WORKS</Badge>
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl" style={{ color: '#e2e8f0' }}>3ステップで始められる</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative" style={{ background: '#0A1428', border: '2px solid rgba(200,170,110,0.4)' }}>
                {step.icon}
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-orbitron font-bold" style={{ background: '#C8AA6E', color: '#010A13' }}>
                  {i + 1}
                </div>
              </div>
              <h3 className="font-bold text-base mb-3" style={{ color: '#e2e8f0' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- Pricing ----
function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-b" style={{ background: '#0A1428', borderColor: 'rgba(200,170,110,0.1)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <Badge className="mb-4 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(200,170,110,0.15)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.3)' }}>PRICING</Badge>
        <h2 className="font-orbitron font-bold text-3xl md:text-4xl mb-4" style={{ color: '#e2e8f0' }}>料金プラン</h2>
        <p className="mb-10" style={{ color: '#94a3b8' }}>現在はBYOK（Bring Your Own Key）で完全無料。<br />サブスクリプションプランを準備中です。</p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* BYOK */}
          <Card className="border text-left" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.3)' }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-orbitron text-lg text-gold">BYOK</CardTitle>
                <Badge style={{ background: 'rgba(10,200,185,0.2)', color: '#0AC8B9', border: 'none' }}>利用可能</Badge>
              </div>
              <div className="mt-2">
                <span className="font-orbitron font-black text-4xl text-gold">無料</span>
                <span className="text-sm ml-2" style={{ color: '#94a3b8' }}>+ Anthropic APIコスト</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {['全機能が使える', 'APIキーは自己管理', '約$0.08/試合のAPIコスト', 'サーバー不要'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#e2e8f0' }}>
                  <span style={{ color: '#0AC8B9' }}><IconCheck /></span>{f}
                </div>
              ))}
              <Button className="w-full mt-4 font-orbitron text-sm font-bold gap-2" style={{ background: 'linear-gradient(135deg, #C8AA6E, #9a7c4a)', color: '#010A13' }}>
                <IconDownload width={16} height={16} />今すぐ始める
              </Button>
            </CardContent>
          </Card>

          {/* Pro - Coming Soon */}
          <Card className="border text-left relative overflow-hidden" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.2)' }}>
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center" style={{ background: 'rgba(1,10,19,0.88)', backdropFilter: 'blur(2px)' }}>
              <span className="font-orbitron font-black text-2xl mb-2 shimmer-text">COMING SOON</span>
              <p className="text-xs text-center px-6 leading-relaxed" style={{ color: '#94a3b8' }}>サブスクリプションプランを準備中。<br />下のフォームでリリース通知を受け取る↓</p>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-orbitron text-lg" style={{ color: '#94a3b8' }}>Pro</CardTitle>
                <Badge style={{ background: 'rgba(200,170,110,0.1)', color: '#94a3b8', border: 'none' }}>準備中</Badge>
              </div>
              <div className="mt-2">
                <span className="font-orbitron font-black text-4xl" style={{ color: '#475569' }}>¥???</span>
                <span className="text-sm ml-2" style={{ color: '#475569' }}>/月</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {['APIキー不要', '無制限AI分析', '優先サポート', '利用量ダッシュボード'].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                  <span><IconCheck /></span>{f}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* メール登録 */}
        <div className="mt-10 p-6 rounded-xl border" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.2)' }}>
          <p className="font-bold mb-4" style={{ color: '#e2e8f0' }}>Proプランのリリース通知を受け取る</p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(200,170,110,0.1)', border: '1px solid rgba(200,170,110,0.3)', color: '#e2e8f0' }} />
            <Button className="font-orbitron text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #C8AA6E, #9a7c4a)', color: '#010A13' }}>登録</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---- FAQ ----
function FAQ() {
  const faqs = [
    { q: 'Anthropic APIキーはどこで取得できますか？', a: 'Anthropic Console（console.anthropic.com）でアカウントを作成し、APIキーを発行してください。クレジットカードの登録が必要ですが、1試合あたり約$0.08と低コストで利用できます。' },
    { q: '無料で使えますか？', a: 'アプリ自体は無料です。Claude APIの使用料（Anthropicへの支払い）は発生しますが、Haiku主体で1試合約$0.08、1日5試合で月約$12程度です。Prompt Cachingを活用すると最大90%削減できます。' },
    { q: 'Riot VanguardやアンチチートがElectronをブロックしませんか？', a: '実機テストで動作確認済みです。現時点でVanguardによるブロックは確認されていません。LoLはボーダーレスウィンドウモードでのプレイを推奨します（排他フルスクリーンではオーバーレイが表示されません）。' },
    { q: 'macOSでは使えますか？', a: '現在はWindows 10/11のみ対応しています。macOS対応は将来のロードマップに含まれています。' },
    { q: 'Riotの利用規約に違反しませんか？', a: '公式のLive Client Data API（Riot提供）のみを使用しており、ゲーム内の操作を自動化する機能はありません。ToS準拠のツールとして設計されており、配布時はRiot Developer Portalへのアプリ登録も行います。' },
    { q: 'AIの提案精度はどのくらいですか？', a: 'OP.GGのコアビルドデータ＋戦況（KDA・アイテム・敵構成・試合時間）を組み合わせてClaude AIが判断します。状況に応じた提案が得られますが、最終的なビルド判断はプレイヤーが行ってください。' },
  ]
  return (
    <section id="faq" className="py-24 px-6" style={{ background: '#010A13' }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 text-xs tracking-widest font-orbitron" style={{ background: 'rgba(200,170,110,0.15)', color: '#C8AA6E', border: '1px solid rgba(200,170,110,0.3)' }}>FAQ</Badge>
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl" style={{ color: '#e2e8f0' }}>よくある質問</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-5" style={{ background: '#0A1428', borderColor: 'rgba(200,170,110,0.2)' }}>
              <AccordionTrigger className="text-sm font-bold text-left hover:no-underline py-4" style={{ color: '#e2e8f0' }}>
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm pb-4 leading-relaxed" style={{ color: '#94a3b8' }}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

// ---- Final CTA ----
function FinalCTA() {
  return (
    <section className="py-28 px-6 text-center relative overflow-hidden" style={{ background: '#0A1428' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10" style={{ background: 'radial-gradient(ellipse at center top, #C8AA6E, transparent 70%)' }} />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <h2 className="font-orbitron font-black text-3xl md:text-5xl mb-6 text-glow-gold" style={{ color: '#C8AA6E' }}>
          今すぐ<br />ランクを上げよう
        </h2>
        <p className="text-lg mb-10" style={{ color: '#94a3b8' }}>
          ビルドに悩む時間を、プレイに使おう。<br />AIがチャンプセレクトから試合終了まで全力サポート。
        </p>
        <Button size="lg" className="font-orbitron font-bold text-base tracking-wider px-12 h-16 glow-gold gap-2" style={{ background: 'linear-gradient(135deg, #C8AA6E, #9a7c4a)', color: '#010A13', minWidth: 260 }}>
          <IconDownload width={20} height={20} />
          無料でダウンロード
        </Button>
        <p className="mt-4 text-xs" style={{ color: '#475569' }}>Windows 10/11 · オープンソース · Vanguard互換確認済み</p>
      </div>
    </section>
  )
}

// ---- Footer ----
function Footer() {
  return (
    <footer className="border-t py-10 px-6" style={{ background: '#010A13', borderColor: 'rgba(200,170,110,0.15)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded" style={{ background: 'linear-gradient(135deg, #C8AA6E, #0AC8B9)' }} />
            <span className="font-orbitron font-bold text-gold">LoL Build Advisor</span>
          </div>
          <div className="flex gap-8 text-sm" style={{ color: '#475569' }}>
            <a href="#features" className="hover:text-gold transition-colors">機能</a>
            <a href="#how" className="hover:text-gold transition-colors">使い方</a>
            <a href="#pricing" className="hover:text-gold transition-colors">料金</a>
            <a href="#faq" className="hover:text-gold transition-colors">FAQ</a>
          </div>
        </div>
        <div className="gold-divider mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{ color: '#334155' }}>
          <p>© 2026 合同会社299. All rights reserved.</p>
          <p className="text-center md:text-right leading-relaxed">
            LoL Build Advisor は League of Legends の公式 Live Client Data API を使用しています。<br />
            Riot Games によって認定・後援・または具体的に承認されたものではなく、Riot Games はその責任を負いません。
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---- App ----
export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#010A13' }}>
      <Navbar />
      <Hero />
      <SocialProof />
      <Problem />
      <Features />
      <FeatureGrid />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
