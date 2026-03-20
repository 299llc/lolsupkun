import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";

// ══════════════════════════════════════
// Theme
// ══════════════════════════════════════
const C = {
  bg: "#010A13",
  surface: "#0A1428",
  surfaceLight: "#0A1E32",
  gold: "#C8AA6E",
  goldDark: "#785A28",
  teal: "#0AC8B9",
  red: "#E84057",
  text: "#F0E6D3",
  muted: "#A09B8C",
};

const HEADING = "'Orbitron', 'Segoe UI', sans-serif";
const BODY = "'Noto Sans JP', 'Segoe UI', sans-serif";

// ══════════════════════════════════════
// Animation Helpers
// ══════════════════════════════════════
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function fade(frame: number, start: number, dur = 15) {
  return interpolate(frame, [start, start + dur], [0, 1], clamp);
}
function fadeOut(frame: number, total: number, dur = 15) {
  return interpolate(frame, [total - dur, total], [1, 0], clamp);
}
function slide(frame: number, start: number, dur = 20, dist = 50) {
  return interpolate(frame, [start, start + dur], [dist, 0], {
    ...clamp, easing: Easing.out(Easing.cubic),
  });
}

// ══════════════════════════════════════
// Scene Transition Wrapper
// ══════════════════════════════════════
const Scene: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeInDur?: number;
  fadeOutDur?: number;
}> = ({ children, durationInFrames, fadeInDur = 15, fadeOutDur = 15 }) => {
  const frame = useCurrentFrame();
  const inOp = fadeInDur > 0 ? fade(frame, 0, fadeInDur) : 1;
  const outOp = fadeOutDur > 0 ? fadeOut(frame, durationInFrames, fadeOutDur) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(inOp, outOp) }}>{children}</AbsoluteFill>;
};

// ══════════════════════════════════════
// Decorative Components
// ══════════════════════════════════════
const FontLoader: React.FC = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');`}</style>
);

const HexGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, -30], clamp);
  const hexagons = [];
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 22; col++) {
      const x = col * 110 + (row % 2 === 0 ? 0 : 55) - 110;
      const y = row * 95 - 95;
      hexagons.push(
        <div key={`${row}-${col}`} style={{
          position: "absolute", left: x, top: y, width: 80, height: 80,
          border: `1px solid ${C.gold}`, opacity, transform: "rotate(30deg)",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }} />
      );
    }
  }
  return <div style={{ position: "absolute", inset: -100, overflow: "hidden", transform: `translateY(${drift}px)` }}>{hexagons}</div>;
};

const GlowOrb: React.FC<{ x: number; y: number; size: number; color: string; opacity: number; animate?: boolean }> = ({ x, y, size, color, opacity: baseOp, animate }) => {
  const frame = useCurrentFrame();
  const breathe = animate ? interpolate(Math.sin(frame * 0.04), [-1, 1], [0.7, 1.3]) : 1;
  return <div style={{
    position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
    borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: baseOp * breathe, filter: "blur(50px)",
  }} />;
};

const Particles: React.FC<{ count?: number; color?: string }> = ({ count = 20, color = C.gold }) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(() => {
    const s = [];
    for (let i = 0; i < count; i++) s.push({ x: (i * 137.5) % 100, y: (i * 73.7) % 100, size: 2 + (i % 4), speed: 0.3 + (i % 5) * 0.15, phase: (i * 2.4) % (Math.PI * 2) });
    return s;
  }, [count]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {particles.map((p, i) => {
        const y = (p.y + frame * p.speed * 0.1) % 110 - 5;
        const x = p.x + Math.sin(frame * 0.02 + p.phase) * 3;
        const op = interpolate(Math.sin(frame * 0.05 + p.phase), [-1, 1], [0.1, 0.6]);
        return <div key={i} style={{
          position: "absolute", left: `${x}%`, top: `${y}%`, width: p.size, height: p.size,
          borderRadius: "50%", background: color, opacity: op, boxShadow: `0 0 ${p.size * 3}px ${color}60`,
        }} />;
      })}
    </div>
  );
};

const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 180, [0, 180], [-5, 105]);
  return <div style={{
    position: "absolute", left: 0, right: 0, top: `${y}%`, height: 2,
    background: `linear-gradient(90deg, transparent, ${C.teal}15, transparent)`, pointerEvents: "none",
  }} />;
};

const GoldBorder: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; glow?: boolean }> = ({ children, style, glow }) => (
  <div style={{
    border: `1px solid ${C.gold}50`, borderRadius: 14,
    background: `linear-gradient(145deg, ${C.surface}DD, ${C.surfaceLight}AA)`,
    backdropFilter: "blur(12px)", padding: 28,
    boxShadow: glow ? `0 0 30px ${C.gold}15, inset 0 1px 0 ${C.gold}20` : `inset 0 1px 0 ${C.gold}15`,
    ...style,
  }}>{children}</div>
);

// ══════════════════════════════════════
// Mock UI Components
// ══════════════════════════════════════
const MockItemIcon: React.FC<{ color: string; size?: number; stars?: number; delay: number; label?: string }> = ({ color, size = 60, stars = 0, delay, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const isTop = stars >= 4;
  return (
    <div style={{ textAlign: "center", transform: `scale(${s})` }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        border: `2px solid ${isTop ? C.gold : C.gold + "50"}`,
        background: `linear-gradient(145deg, ${color}CC, ${color}66)`,
        boxShadow: isTop ? `0 0 20px ${C.gold}50, inset 0 1px 0 #fff2` : "0 2px 10px #0006, inset 0 1px 0 #fff1",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: C.text, fontFamily: HEADING, letterSpacing: 1,
      }}>{label}</div>
      {stars > 0 && (
        <div style={{ marginTop: 6, fontSize: 13, color: C.gold, letterSpacing: 2 }}>
          {"★".repeat(stars)}<span style={{ opacity: 0.3 }}>{"★".repeat(5 - stars)}</span>
        </div>
      )}
    </div>
  );
};

const MockPlayerRow: React.FC<{
  champ: string; role: string; kda: string; isEnemy?: boolean; delay: number; badges?: string[];
}> = ({ champ, role, kda, isEnemy, delay, badges }) => {
  const frame = useCurrentFrame();
  const op = fade(frame, delay);
  const y = slide(frame, delay, 15, 30);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "7px 16px",
      opacity: op, transform: `translateY(${y}px)`, borderBottom: `1px solid ${C.gold}10`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isEnemy ? `linear-gradient(135deg, ${C.red}70, ${C.red}30)` : `linear-gradient(135deg, ${C.teal}70, ${C.teal}30)`,
        border: `2px solid ${isEnemy ? C.red : C.teal}50`,
      }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: BODY, fontSize: 14, color: C.text }}>{champ}</span>
        <span style={{ fontFamily: HEADING, fontSize: 10, color: C.muted, marginLeft: 6 }}>{role}</span>
      </div>
      {badges?.map((b, i) => (
        <span key={i} style={{
          fontSize: 9, padding: "2px 6px", borderRadius: 4,
          background: b === "Fed" ? `${C.red}30` : `${C.teal}20`,
          color: b === "Fed" ? C.red : C.teal, fontFamily: HEADING, letterSpacing: 1,
        }}>{b}</span>
      ))}
      <span style={{
        fontFamily: HEADING, fontSize: 14, color: isEnemy ? C.red : C.teal, minWidth: 60, textAlign: "right",
      }}>{kda}</span>
    </div>
  );
};

// ══════════════════════════════════════
// SCENE 1: Title (150f = 5s)
// ══════════════════════════════════════
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 10, mass: 0.6 } });
  const titleOp = fade(frame, 15, 25);
  const titleY = slide(frame, 15, 30, 40);
  const subOp = fade(frame, 40, 20);
  const tagOp = fade(frame, 65, 20);
  const pulse = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.6, 1]);

  return (
    <Scene durationInFrames={150} fadeInDur={0} fadeOutDur={20}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 45%, ${C.surfaceLight} 0%, ${C.bg} 65%)`,
        justifyContent: "center", alignItems: "center",
      }}>
        <HexGrid opacity={0.04} />
        <Particles count={25} color={C.gold} />
        <GlowOrb x={960} y={380} size={700} color={C.gold} opacity={0.12 * pulse} animate />
        <GlowOrb x={960} y={620} size={500} color={C.teal} opacity={0.08 * pulse} animate />
        <ScanLine />
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div style={{
            transform: `scale(${logoScale})`, width: 110, height: 110,
            margin: "0 auto 32px", borderRadius: 24,
            background: `linear-gradient(145deg, ${C.gold}, ${C.goldDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 80px ${C.gold}40, 0 0 160px ${C.gold}15`,
          }}>
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none">
              <path d="M6 3l6 3 6-3v12l-6 3-6-3V3z" stroke={C.bg} strokeWidth="1.5" fill={C.bg + "80"} />
              <path d="M12 6v12M6 3l6 3 6-3M6 15l6 3 6-3" stroke={C.bg} strokeWidth="1.5" />
            </svg>
          </div>
          <div style={{
            fontFamily: HEADING, fontSize: 78, fontWeight: 900, color: C.gold,
            opacity: titleOp, transform: `translateY(${titleY}px)`,
            textShadow: `0 0 50px ${C.gold}50, 0 0 100px ${C.gold}20`, letterSpacing: 6,
          }}>ろるさぽくん</div>
          <div style={{
            fontFamily: HEADING, fontSize: 26, fontWeight: 500, color: C.teal,
            opacity: subOp, marginTop: 14, letterSpacing: 8, textShadow: `0 0 20px ${C.teal}40`,
          }}>LOL BUILD ADVISOR</div>
          <div style={{ fontFamily: BODY, fontSize: 22, color: C.muted, opacity: tagOp, marginTop: 28, letterSpacing: 3 }}>
            AI搭載 リアルタイムビルドコーチ
          </div>
          <div style={{ width: 120, height: 2, margin: "24px auto 0", background: `linear-gradient(90deg, transparent, ${C.gold}60, transparent)`, opacity: tagOp }} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ══════════════════════════════════════
// SCENE 2: Problem Hook (210f = 7s)
// ══════════════════════════════════════
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const questions = [
    { text: "ビルド、これで合ってる…？", start: 10 },
    { text: "マクロ、どう動けばいい？", start: 50 },
    { text: "なんで負けたんだろう…", start: 90 },
  ];
  const answerOp = fade(frame, 135, 20);
  const answerY = slide(frame, 135, 25, 40);

  return (
    <Scene durationInFrames={210}>
      <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center" }}>
        <HexGrid opacity={0.02} />
        <Particles count={12} color={C.muted} />
        <GlowOrb x={960} y={540} size={500} color={C.red} opacity={0.04} animate />
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 900 }}>
          {questions.map((q, i) => {
            const op = fade(frame, q.start, 15);
            const y = slide(frame, q.start, 20, 35);
            const dimOp = frame > 130 ? interpolate(frame, [130, 145], [1, 0.3], clamp) : 1;
            return (
              <div key={i} style={{
                fontFamily: BODY, fontSize: 44, fontWeight: 400, color: C.muted,
                opacity: op * dimOp, transform: `translateY(${y}px)`, marginBottom: 32, letterSpacing: 1,
              }}>「{q.text}」</div>
            );
          })}
          <div style={{ marginTop: 48, opacity: answerOp, transform: `translateY(${answerY}px)` }}>
            <div style={{
              fontFamily: HEADING, fontSize: 54, fontWeight: 700, color: C.teal,
              textShadow: `0 0 40px ${C.teal}50, 0 0 80px ${C.teal}20`, letterSpacing: 3,
            }}>全部、AIが答えます。</div>
            <div style={{
              width: 80, height: 3, margin: "16px auto 0", background: C.teal,
              borderRadius: 2, boxShadow: `0 0 15px ${C.teal}80`, opacity: fade(frame, 145, 10),
            }} />
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ══════════════════════════════════════
// Feature Scene Layout
// ══════════════════════════════════════
const FeatureLayout: React.FC<{
  number: string; title: string; description: string;
  children: React.ReactNode; durationInFrames: number;
  reverse?: boolean; accentColor?: string;
}> = ({ number, title, description, children, durationInFrames, reverse, accentColor = C.teal }) => {
  const frame = useCurrentFrame();
  const labelOp = fade(frame, 5, 18);
  const labelY = slide(frame, 5, 22, 40);
  const panelOp = fade(frame, 20, 22);
  const panelX = interpolate(frame, [20, 50], [reverse ? -40 : 40, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <Scene durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center", padding: "60px 80px" }}>
        <HexGrid opacity={0.02} />
        <Particles count={15} color={accentColor} />
        <GlowOrb x={reverse ? 300 : 1600} y={500} size={500} color={accentColor} opacity={0.06} animate />
        <GlowOrb x={reverse ? 1500 : 400} y={600} size={400} color={C.gold} opacity={0.04} animate />
        <ScanLine />
        <div style={{
          display: "flex", gap: 60, alignItems: "center", zIndex: 1, width: "100%",
          flexDirection: reverse ? "row-reverse" : "row",
        }}>
          <div style={{ flex: "0 0 38%", opacity: labelOp, transform: `translateY(${labelY}px)` }}>
            <div style={{ fontFamily: HEADING, fontSize: 14, color: accentColor, letterSpacing: 6, marginBottom: 18, fontWeight: 600 }}>{number}</div>
            <div style={{ fontFamily: HEADING, fontSize: 46, fontWeight: 700, color: C.gold, lineHeight: 1.3, textShadow: `0 2px 4px #000a` }}>
              {title.split("\n").map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 20, color: C.muted, marginTop: 22, lineHeight: 1.9, letterSpacing: 0.5 }}>
              {description.split("\n").map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}
            </div>
          </div>
          <div style={{ flex: "0 0 56%", opacity: panelOp, transform: `translateX(${panelX}px)` }}>
            {children}
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ══════════════════════════════════════
// SCENE 3: AI Build Suggestion (210f)
// ══════════════════════════════════════
const BuildScene: React.FC = () => {
  const frame = useCurrentFrame();
  const reasonOp = fade(frame, 90, 15);
  const items = [
    { color: "#4A90D9", stars: 5, label: "IE", delay: 40 },
    { color: "#C8AA6E", stars: 4, label: "BT", delay: 48 },
    { color: "#E84057", stars: 4, label: "LDR", delay: 56 },
    { color: "#0AC8B9", stars: 3, label: "GA", delay: 64 },
    { color: "#785A28", stars: 2, label: "RFC", delay: 72 },
  ];

  return (
    <FeatureLayout number="FEATURE  01" title="AIアイテム提案"
      description={"戦況・敵構成・KDAをリアルタイム分析\n最適なアイテムを5つ提案"}
      durationInFrames={210} accentColor={C.teal}>
      <GoldBorder glow>
        <div style={{
          fontFamily: HEADING, fontSize: 13, color: C.gold, marginBottom: 22, letterSpacing: 3,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: C.teal }}>{"///"}</span> AI ITEM SUGGESTION
        </div>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 24 }}>
          {items.map((item, i) => <MockItemIcon key={i} {...item} />)}
        </div>
        <div style={{
          fontFamily: BODY, fontSize: 14, color: C.muted, opacity: reasonOp,
          padding: "14px 18px", background: `${C.bg}90`, borderRadius: 10,
          borderLeft: `3px solid ${C.teal}60`, lineHeight: 1.7,
        }}>
          敵APが多いためMR優先。Fedの敵ジャングラーに対して
          <span style={{ color: C.gold, fontWeight: 500 }}>ガーディアンエンジェル</span>で保険を推奨。
        </div>
      </GoldBorder>
    </FeatureLayout>
  );
};

// ══════════════════════════════════════
// SCENE 4: Macro & Matchup (210f)
// ══════════════════════════════════════
const MacroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const panel1Op = fade(frame, 25, 18);
  const panel2Op = fade(frame, 55, 18);

  return (
    <FeatureLayout number="FEATURE  02" title={"マクロ &\nマッチアップ"}
      description={"オブジェクトタイマー連動で\n今すべき行動をリアルタイム指示"}
      durationInFrames={210} reverse accentColor={C.gold}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ opacity: panel1Op }}>
          <GoldBorder glow>
            <div style={{
              fontFamily: HEADING, fontSize: 12, color: C.teal, marginBottom: 14, letterSpacing: 3,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: C.gold }}>{"///"}</span> MACRO ADVICE
            </div>
            <div style={{
              display: "flex", gap: 16, marginBottom: 14, padding: "10px 14px",
              background: `${C.bg}60`, borderRadius: 8,
            }}>
              {[
                { name: "Dragon", status: "ALIVE", color: C.teal },
                { name: "Baron", status: "19:42", color: C.muted },
                { name: "Grubs", status: "ALIVE", color: C.teal },
              ].map((obj, i) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontFamily: HEADING, fontSize: 10, color: C.muted, letterSpacing: 1 }}>{obj.name}</div>
                  <div style={{ fontFamily: HEADING, fontSize: 13, color: obj.color, marginTop: 4, fontWeight: 600 }}>{obj.status}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 15, color: C.text, lineHeight: 1.7 }}>
              <span style={{ color: C.gold, fontWeight: 500 }}>{">"}</span>{" "}
              ボットをプッシュしてからドラゴンファイトへ。
              <br /><span style={{ color: C.muted, fontSize: 13 }}>数的有利を確保してから開始すること。</span>
            </div>
          </GoldBorder>
        </div>
        <div style={{ opacity: panel2Op }}>
          <GoldBorder style={{ padding: 18 }}>
            <div style={{
              fontFamily: HEADING, fontSize: 12, color: C.gold, marginBottom: 10, letterSpacing: 3,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: C.teal }}>{"///"}</span> MATCHUP TIP
            </div>
            <div style={{ fontFamily: BODY, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
              対面ゼドはLv6以降ウルトが脅威。
              <span style={{ color: C.teal, fontWeight: 500 }}>ゾーニャの砂時計</span>をラッシュして対応。
            </div>
          </GoldBorder>
        </div>
      </div>
    </FeatureLayout>
  );
};

// ══════════════════════════════════════
// SCENE 5: Coaching (210f)
// ══════════════════════════════════════
const CoachingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Donut SVG chart matching app's DonutScore
  const DonutScore: React.FC<{ score: number; label: string; delay: number }> = ({ score, label, delay }) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 20, mass: 0.5 } });
    const animScore = Math.round(score * 10 * s) / 10;
    const color = score >= 9 ? C.gold : score >= 7 ? "#4ade80" : score >= 5 ? "#facc15" : C.red;
    const status = score >= 9 ? "素晴らしい" : score >= 7 ? "良い" : score >= 5 ? "普通" : "改善必要";
    const sz = 80, sw = 7, r = (sz - sw) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min((score / 10) * s, 1);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ position: "relative", width: sz, height: sz }}>
          <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={`${C.surfaceLight}50`} strokeWidth={sw} />
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={sw}
              strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round" />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color }}>{animScore > 0 ? animScore.toFixed(1) : "-"}</span>
            <span style={{ fontSize: 9, color: C.muted }}>/10</span>
          </div>
        </div>
        <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 500, color }}>{status}</span>
      </div>
    );
  };

  // GradeBar matching app's GradeBar component
  const GRADE_BAR: Record<string, { pct: number; color: string }> = {
    S: { pct: 100, color: C.gold }, A: { pct: 80, color: "#4ade80" },
    B: { pct: 60, color: C.teal }, C: { pct: 40, color: "#facc15" }, D: { pct: 20, color: C.red },
  };

  const sections = [
    { title: "レーニング", grade: "A", text: "CSとトレードバランスが良好", delay: 55 },
    { title: "ビルド判断", grade: "S", text: "状況に応じた適切なアイテム選択", delay: 65 },
    { title: "マクロ判断", grade: "C", text: "オブジェクト管理に改善の余地", delay: 75 },
  ];

  return (
    <FeatureLayout number="FEATURE  03" title="試合後AIコーチング"
      description={"高精度AIによる総合評価で\n改善ポイントを具体的に提示"}
      durationInFrames={210} accentColor={C.gold}>
      <GoldBorder glow>
        <div style={{
          fontFamily: HEADING, fontSize: 12, color: C.gold, marginBottom: 22, letterSpacing: 3,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: C.teal }}>{"///"}</span> AI COACHING
        </div>

        {/* Donut charts */}
        <div style={{ display: "flex", justifyContent: "center", gap: 36, marginBottom: 20, padding: "4px 0" }}>
          <DonutScore score={7.9} label="総合" delay={35} />
          <DonutScore score={9.0} label="ビルド" delay={42} />
        </div>

        {/* GradeBar sections */}
        {sections.map((s, i) => {
          const bar = GRADE_BAR[s.grade] || GRADE_BAR.C;
          const barW = spring({ frame: frame - s.delay, fps, config: { damping: 15, mass: 0.5 } });
          return (
            <div key={i} style={{
              borderRadius: 6, background: `${C.surfaceLight}4D`, border: `1px solid ${C.surfaceLight}33`,
              marginBottom: 8, overflow: "hidden", opacity: fade(frame, s.delay, 15),
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px" }}>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 500, flex: 1 }}>{s.title}</span>
                <span style={{ fontSize: 12, fontFamily: HEADING, fontWeight: 700, color: bar.color }}>{s.grade}</span>
              </div>
              {/* Bar */}
              <div style={{ margin: "0 10px 4px", height: 6, borderRadius: 99, background: `${C.surfaceLight}33`, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99, width: `${bar.pct * barW}%`,
                  background: bar.color,
                }} />
              </div>
              <div style={{ fontSize: 12, color: C.muted, padding: "0 10px 6px", lineHeight: 1.5 }}>{s.text}</div>
            </div>
          );
        })}

        {/* Good / Improve */}
        <div style={{ marginTop: 10, opacity: fade(frame, 85, 15), display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, letterSpacing: 1 }}>▲ GOOD</div>
          <div style={{
            padding: "5px 10px", borderRadius: 6, fontSize: 12, color: C.text, lineHeight: 1.6,
            background: `#4ade800D`, border: `1px solid #4ade8026`,
          }}>序盤のアイテム選択が光った。CSも安定していた。</div>

          <div style={{ fontSize: 11, color: C.red, fontWeight: 600, letterSpacing: 1, marginTop: 2 }}>▼ IMPROVE</div>
          <div style={{
            padding: "5px 10px", borderRadius: 6, fontSize: 12, color: C.text, lineHeight: 1.6,
            background: `${C.red}0D`, border: `1px solid ${C.red}26`,
          }}>ドラゴン前の視界確保とローテーションを改善しよう。</div>
        </div>
      </GoldBorder>
    </FeatureLayout>
  );
};

// ══════════════════════════════════════
// SCENE 6: Dashboard (210f)
// ══════════════════════════════════════
const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const killBarW = spring({ frame: frame - 25, fps, config: { damping: 18 } });

  const allies = [
    { champ: "Jinx", role: "ADC", kda: "5/1/8", delay: 30, badges: [] as string[] },
    { champ: "Thresh", role: "SUP", kda: "1/2/14", delay: 37, badges: ["CC"] },
    { champ: "Ahri", role: "MID", kda: "7/3/5", delay: 44, badges: [] as string[] },
  ];
  const enemies = [
    { champ: "Zed", role: "MID", kda: "6/4/3", delay: 55, badges: ["Fed"] },
    { champ: "Kai'Sa", role: "ADC", kda: "3/5/2", delay: 62, badges: [] as string[] },
    { champ: "Leona", role: "SUP", kda: "0/3/7", delay: 69, badges: ["CC", "Tank"] },
  ];

  return (
    <FeatureLayout number="FEATURE  04" title={"リアルタイム\nダッシュボード"}
      description={"全プレイヤーのKDA・アイテムを\nチーム別にリアルタイム表示"}
      durationInFrames={210} reverse accentColor={C.teal}>
      <GoldBorder style={{ padding: 0, overflow: "hidden" }} glow>
        {/* Game timer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 18px", borderBottom: `1px solid ${C.gold}20`, background: `${C.bg}60`,
        }}>
          <span style={{ fontFamily: HEADING, fontSize: 11, color: C.muted, letterSpacing: 2 }}>GAME TIME</span>
          <span style={{ fontFamily: HEADING, fontSize: 16, color: C.gold }}>24:37</span>
        </div>

        {/* Kill bar */}
        <div style={{ display: "flex", height: 30, fontFamily: HEADING, fontSize: 14 }}>
          <div style={{
            flex: 13 * killBarW, background: `linear-gradient(90deg, ${C.teal}50, ${C.teal}25)`,
            display: "flex", alignItems: "center", justifyContent: "center", color: C.teal,
          }}>13</div>
          <div style={{
            flex: Math.max(9 * killBarW, 0.01), background: `linear-gradient(90deg, ${C.red}25, ${C.red}50)`,
            display: "flex", alignItems: "center", justifyContent: "center", color: C.red,
          }}>9</div>
        </div>

        <div style={{ padding: "6px 0 12px" }}>
          <div style={{ padding: "8px 18px 6px", fontFamily: HEADING, fontSize: 10, color: C.teal, letterSpacing: 3 }}>ALLY TEAM</div>
          {allies.map((p, i) => <MockPlayerRow key={`a${i}`} {...p} />)}
          <div style={{ padding: "12px 18px 6px", fontFamily: HEADING, fontSize: 10, color: C.red, letterSpacing: 3 }}>ENEMY TEAM</div>
          {enemies.map((p, i) => <MockPlayerRow key={`e${i}`} {...p} isEnemy />)}
        </div>
      </GoldBorder>
    </FeatureLayout>
  );
};

// ══════════════════════════════════════
// SCENE 7: CTA (255f = 8.5s)
// ══════════════════════════════════════
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 12, mass: 0.6 } });
  const featOp = fade(frame, 25, 20);
  const ctaOp = fade(frame, 65, 20);
  const ctaScale = spring({ frame: frame - 65, fps, config: { damping: 10 } });
  const pulse = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.95, 1.05]);
  const glowPulse = interpolate(Math.sin(frame * 0.05), [-1, 1], [0.5, 1]);

  const features = [
    { text: "AIアイテム提案", color: C.teal },
    { text: "マッチアップTip", color: C.gold },
    { text: "マクロアドバイス", color: C.teal },
    { text: "試合後コーチング", color: C.gold },
  ];

  return (
    <Scene durationInFrames={255} fadeInDur={15} fadeOutDur={0}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 45%, ${C.surfaceLight} 0%, ${C.bg} 60%)`,
        justifyContent: "center", alignItems: "center",
      }}>
        <HexGrid opacity={0.03} />
        <Particles count={30} color={C.gold} />
        <GlowOrb x={960} y={440} size={900} color={C.gold} opacity={0.08 * glowPulse} animate />
        <GlowOrb x={960} y={640} size={600} color={C.teal} opacity={0.05 * glowPulse} animate />
        <ScanLine />
        <div style={{ textAlign: "center", zIndex: 1 }}>
          <div style={{ transform: `scale(${logoScale})`, marginBottom: 16 }}>
            <div style={{
              width: 90, height: 90, margin: "0 auto 20px", borderRadius: 20,
              background: `linear-gradient(145deg, ${C.gold}, ${C.goldDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 60px ${C.gold}40`,
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M6 3l6 3 6-3v12l-6 3-6-3V3z" stroke={C.bg} strokeWidth="1.5" fill={C.bg + "80"} />
                <path d="M12 6v12M6 3l6 3 6-3M6 15l6 3 6-3" stroke={C.bg} strokeWidth="1.5" />
              </svg>
            </div>
            <div style={{
              fontFamily: HEADING, fontSize: 60, fontWeight: 900, color: C.gold,
              textShadow: `0 0 40px ${C.gold}50`, letterSpacing: 4,
            }}>ろるさぽくん</div>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 50, opacity: featOp }}>
            {features.map((f, i) => {
              const s = spring({ frame: frame - 30 - i * 5, fps, config: { damping: 12 } });
              return (
                <div key={i} style={{
                  padding: "12px 28px", borderRadius: 10,
                  border: `1px solid ${f.color}30`, background: `${C.surface}CC`,
                  fontFamily: BODY, fontSize: 16, fontWeight: 500, color: C.text,
                  transform: `scale(${s})`, boxShadow: `0 0 15px ${f.color}10`,
                }}>{f.text}</div>
              );
            })}
          </div>
          <div style={{ opacity: ctaOp, transform: `scale(${ctaScale * pulse})` }}>
            <div style={{
              display: "inline-block", padding: "20px 72px", borderRadius: 14,
              background: `linear-gradient(145deg, ${C.gold}, ${C.goldDark})`,
              fontFamily: HEADING, fontSize: 26, fontWeight: 700, color: C.bg,
              boxShadow: `0 0 50px ${C.gold}50, 0 0 100px ${C.gold}20, 0 4px 20px #0008`, letterSpacing: 3,
            }}>無料で今すぐ試す</div>
            <div style={{
              marginTop: 28, fontFamily: BODY, fontSize: 18, color: C.muted,
              opacity: fade(frame, 85, 15), letterSpacing: 1,
            }}>セットアップ不要 ・ サーバー不要 ・ 完全無料</div>
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// ══════════════════════════════════════
// MAIN COMPOSITION
// ══════════════════════════════════════
export const PromoVideo: React.FC = () => {
  const scenes = [
    { from: 0, dur: 150 },
    { from: 135, dur: 210 },
    { from: 330, dur: 210 },
    { from: 525, dur: 210 },
    { from: 720, dur: 210 },
    { from: 915, dur: 210 },
    { from: 1095, dur: 255 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <FontLoader />
      <Sequence from={scenes[0].from} durationInFrames={scenes[0].dur}><TitleScene /></Sequence>
      <Sequence from={scenes[1].from} durationInFrames={scenes[1].dur}><ProblemScene /></Sequence>
      <Sequence from={scenes[2].from} durationInFrames={scenes[2].dur}><BuildScene /></Sequence>
      <Sequence from={scenes[3].from} durationInFrames={scenes[3].dur}><MacroScene /></Sequence>
      <Sequence from={scenes[4].from} durationInFrames={scenes[4].dur}><CoachingScene /></Sequence>
      <Sequence from={scenes[5].from} durationInFrames={scenes[5].dur}><DashboardScene /></Sequence>
      <Sequence from={scenes[6].from} durationInFrames={scenes[6].dur}><CTAScene /></Sequence>
    </AbsoluteFill>
  );
};
