"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Palette ──────────────────────────────────────────────────────────────────
const O = {
  sand50:  "#FAF6ED", sand100: "#F3ECDD", sand200: "#E9DFC8", sand25: "#FDFBF6",
  moss100: "#E1EBD6", moss200: "#C4D6B0", moss300: "#9EBB83",
  moss500: "#4C7438", moss600: "#3B5B2C", moss700: "#2D4522", moss800: "#1F3017",
  clay100: "#F3E4D3", clay500: "#B4714D", clay700: "#6B3C24",
  ink900:  "#15130F", ink700: "#3A362F", ink500: "#6F675C", ink300: "#B0A697",
  ink200:  "#D4CCBB", ink100: "#EAE5D9",
  white:   "#FFFFFF",
  danger500: "#B0524E",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const BASE_DIET = [
  { value: "vegan",       label: "Vegano",       sub: "Sem ingredientes de origem animal", glyph: "vegan" },
  { value: "vegetarian",  label: "Vegetariano",  sub: "Aceito leite e ovos",              glyph: "vegetarian" },
  { value: "flexitarian", label: "Flexitariano", sub: "Reduzindo carne aos poucos",       glyph: "flex" },
];

const ALLERGEN_OPTIONS = [
  { value: "gluten",    label: "Glúten",            sub: "Trigo, centeio, cevada",    glyph: "wheat",  hideOnVegan: false },
  { value: "soy",       label: "Soja",              sub: "Grãos e derivados",         glyph: "soy",    hideOnVegan: false },
  { value: "peanuts",   label: "Amendoim",          sub: "",                          glyph: "peanut", hideOnVegan: false },
  { value: "tree_nuts", label: "Oleaginosas",       sub: "Castanhas, nozes, amêndoas",glyph: "nut",    hideOnVegan: false },
  { value: "dairy",     label: "Leite e derivados", sub: "",                          glyph: "milk",   hideOnVegan: true  },
  { value: "eggs",      label: "Ovos",              sub: "",                          glyph: "egg",    hideOnVegan: true  },
];

const TIME_OPTIONS = [
  { value: "fast",   label: "Até 15 min", sub: "Express",      glyph: "clock1", avgMin: 15 },
  { value: "medium", label: "Até 40 min", sub: "Dia a dia",    glyph: "clock2", avgMin: 40 },
  { value: "long",   label: "Tenho tempo",sub: "Slow cooking", glyph: "clock3", avgMin: 90 },
];

const SKILL_OPTIONS = [
  { value: "beginner",     label: "Iniciante",     sub: "Começando a cozinhar",  glyph: "sprout", level: "BEGINNER"     },
  { value: "intermediate", label: "Intermediário", sub: "Mando bem no básico",   glyph: "leaf",   level: "INTERMEDIATE"  },
  { value: "experienced",  label: "Experiente",    sub: "Topo qualquer receita", glyph: "flame",  level: "ADVANCED"      },
];

const DRAFT_KEY = "suliv_onboarding_v2";

// ─── SVG Glyphs ───────────────────────────────────────────────────────────────
function Glyph({ name, size = 44, tone = "moss" }: { name: string; size?: number; tone?: "moss" | "clay" }) {
  const stroke = tone === "moss" ? O.moss700 : O.clay700;
  const fill   = tone === "moss" ? O.moss200 : O.clay100;
  const c = { stroke, strokeWidth: "1.6", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const F = fill; const N = "none"; const S = stroke;
  const glyphs: Record<string, React.ReactNode> = {
    vegan:      <g><path d="M32 10 Q16 14 14 30 Q14 42 24 46 Q36 46 40 32 Q44 18 32 10 Z" fill={F} {...c}/><path d="M22 40 Q28 30 38 22" fill={N} {...c}/></g>,
    vegetarian: <g><circle cx="28" cy="30" r="14" fill={F} {...c}/><path d="M28 16 Q24 20 28 26 Q32 20 28 16 Z" fill={S} stroke={N}/></g>,
    flex:       <g><circle cx="20" cy="28" r="10" fill={F} {...c}/><path d="M32 18 L44 18 L40 24 L46 32 L38 38" fill={N} {...c}/><path d="M14 28 L26 28" fill={N} {...c}/></g>,
    wheat:      <g><path d="M28 10 L28 44" fill={N} {...c}/><path d="M28 14 Q22 18 22 22 Q28 22 28 18 M28 14 Q34 18 34 22 Q28 22 28 18" fill={F} {...c}/><path d="M28 22 Q22 26 22 30 Q28 30 28 26 M28 22 Q34 26 34 30 Q28 30 28 26" fill={F} {...c}/><path d="M28 30 Q22 34 22 38 Q28 38 28 34 M28 30 Q34 34 34 38 Q28 38 28 34" fill={F} {...c}/></g>,
    soy:        <g><path d="M14 32 Q10 22 18 14 Q28 10 34 16 Q42 22 40 32 Q36 42 26 42 Q16 40 14 32 Z" fill={F} {...c}/><circle cx="22" cy="24" r="3" fill={S} stroke={N}/><circle cx="30" cy="28" r="3" fill={S} stroke={N}/><circle cx="24" cy="34" r="3" fill={S} stroke={N}/></g>,
    peanut:     <g><path d="M20 12 Q12 16 14 24 Q10 28 12 34 Q16 44 26 42 Q34 40 34 32 Q40 28 38 20 Q34 10 24 12 Q22 10 20 12 Z" fill={F} {...c}/><path d="M18 26 Q26 26 30 28" fill={N} {...c}/></g>,
    nut:        <g><path d="M14 28 Q14 14 28 14 Q42 14 42 28 Q42 40 28 44 Q14 40 14 28 Z" fill={F} {...c}/><path d="M20 22 Q28 18 36 22 M20 30 Q28 26 36 30" fill={N} {...c}/></g>,
    milk:       <g><path d="M20 10 L36 10 L36 16 L40 24 L40 42 Q40 44 38 44 L18 44 Q16 44 16 42 L16 24 L20 16 Z" fill={F} {...c}/><rect x="22" y="28" width="12" height="8" rx="1" fill={O.white} {...c}/></g>,
    egg:        <g><path d="M28 10 Q16 14 14 28 Q14 42 28 44 Q42 42 42 28 Q40 14 28 10 Z" fill={F} {...c}/></g>,
    clock1:     <g><circle cx="28" cy="28" r="16" fill={F} {...c}/><path d="M28 18 L28 28 L34 28" fill={N} {...c}/></g>,
    clock2:     <g><circle cx="28" cy="28" r="16" fill={F} {...c}/><path d="M28 18 L28 28 L36 32" fill={N} {...c}/></g>,
    clock3:     <g><circle cx="28" cy="28" r="16" fill={F} {...c}/><path d="M28 18 L28 28 L22 34" fill={N} {...c}/></g>,
    sprout:     <g><path d="M28 44 L28 26" fill={N} {...c}/><path d="M28 26 Q20 22 18 14 Q26 14 28 22" fill={F} {...c}/><path d="M28 30 Q36 26 38 18 Q30 18 28 26" fill={F} {...c}/></g>,
    leaf:       <g><path d="M14 42 Q14 18 38 14 Q42 34 22 42 Q18 44 14 42 Z" fill={F} {...c}/><path d="M16 40 Q26 30 38 18" fill={N} {...c}/></g>,
    flame:      <g><path d="M28 10 Q34 18 32 24 Q38 22 38 32 Q38 42 28 44 Q18 42 18 32 Q18 22 24 24 Q22 18 28 10 Z" fill={F} {...c}/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      {glyphs[name] ?? <g><circle cx="28" cy="28" r="16" fill={F} {...c}/><path d="M20 28 L36 28" fill={N} {...c}/></g>}
    </svg>
  );
}

// ─── Option card ──────────────────────────────────────────────────────────────
function OptionCard({
  label, sub, glyph, selected, onClick, multi = false, tone = "moss",
}: {
  label: string; sub?: string; glyph: string; selected: boolean;
  onClick: () => void; multi?: boolean; tone?: "moss" | "clay";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", padding: "14px 16px",
        background: selected ? O.moss100 : O.white,
        border: `1.5px solid ${selected ? O.moss500 : O.ink200}`,
        borderRadius: 18,
        boxShadow: selected
          ? "0 4px 10px rgba(76,116,56,0.12), inset 0 1px 0 rgba(255,255,255,0.4)"
          : "0 1px 2px rgba(58,54,47,0.04)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "all 180ms cubic-bezier(0.22,0.61,0.36,1)",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: selected ? O.white : O.sand100,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Glyph name={glyph} size={40} tone={tone} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: selected ? O.moss800 : O.ink900, lineHeight: 1.25 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: selected ? O.moss700 : O.ink500, marginTop: 3, lineHeight: 1.3 }}>{sub}</div>}
      </div>
      <div style={{
        width: 22, height: 22,
        borderRadius: multi ? 6 : "50%",
        border: `1.5px solid ${selected ? O.moss500 : O.ink200}`,
        background: selected ? O.moss500 : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all 180ms",
      }}>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={O.white} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12 5 5L20 6"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── None card ────────────────────────────────────────────────────────────────
function NoneCard({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        width: "100%", padding: "14px 16px",
        background: selected ? O.ink900 : "transparent",
        color: selected ? O.sand25 : O.ink700,
        border: `1.5px dashed ${selected ? O.ink900 : O.ink300}`,
        borderRadius: 18, cursor: "pointer",
        fontFamily: "inherit", fontSize: 15, fontWeight: 600,
        transition: "all 180ms cubic-bezier(0.22,0.61,0.36,1)",
      }}
    >
      {selected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={O.sand25} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 12 5 5L20 6"/>
        </svg>
      )}
      Nenhuma alergia ou restrição
    </button>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div style={{ padding: "8px 20px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, height: 36 }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "transparent", border: `1px solid ${O.ink200}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={O.ink700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 12, color: O.ink500, fontWeight: 500, letterSpacing: "0.04em" }}>
          {step + 1} <span style={{ opacity: 0.5 }}>de {total}</span>
        </div>
      </div>
      <div style={{ height: 3, background: O.ink100, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: O.moss500, borderRadius: 999,
          transition: "width 400ms cubic-bezier(0.22,0.61,0.36,1)",
        }}/>
      </div>
    </div>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────────
function StepHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "4px 20px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: O.moss600, marginBottom: 8 }}>{kicker}</div>
      <div style={{ fontFamily: 'var(--font-display, "Fraunces", Georgia, serif)', fontSize: 30, lineHeight: 1.1, color: O.ink900, letterSpacing: "-0.018em", fontWeight: 500, textWrap: "balance", marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 14.5, color: O.ink500, lineHeight: 1.45 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────
function BottomCTA({ label, onClick, disabled, isLoading }: {
  label: string; onClick: () => void; disabled?: boolean; isLoading?: boolean;
}) {
  const off = disabled || isLoading;
  return (
    <div style={{ padding: "16px 20px 20px", background: `linear-gradient(180deg, rgba(243,236,221,0) 0%, ${O.sand100} 30%)` }}>
      <button
        onClick={onClick}
        disabled={!!off}
        style={{
          width: "100%", height: 56, borderRadius: 18,
          background: off ? O.moss300 : O.moss500,
          color: O.sand25, border: "none", cursor: off ? "default" : "pointer",
          fontFamily: "inherit", fontSize: 17, fontWeight: 600, letterSpacing: "-0.005em",
          boxShadow: off ? "none" : "0 6px 14px rgba(44,64,28,0.18), 0 1px 2px rgba(44,64,28,0.14), inset 0 1px 0 rgba(255,255,255,0.12)",
          transition: "all 180ms",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {isLoading ? "Salvando…" : label}
        {!isLoading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%", background: O.sand100, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(60% 40% at 10% 10%, rgba(225,235,214,0.7), transparent 70%), radial-gradient(50% 40% at 90% 100%, rgba(243,228,211,0.6), transparent 70%)" }}/>
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.9 }}>
        <g transform="translate(270 60)">
          <path d="M0 0 Q50 10 70 60" stroke={O.moss500} strokeWidth="1.5" fill="none"/>
          <path d="M20 6 Q28 -6 44 -2 Q34 12 20 6 Z" fill={O.moss200} stroke={O.moss700} strokeWidth="1"/>
          <path d="M44 22 Q56 14 72 22 Q58 36 44 22 Z" fill={O.moss300} stroke={O.moss700} strokeWidth="1"/>
          <path d="M58 48 Q70 44 84 56 Q68 66 58 48 Z" fill={O.moss200} stroke={O.moss700} strokeWidth="1"/>
        </g>
        <g transform="translate(40 720)">
          <path d="M0 0 Q30 -30 80 -20" stroke={O.clay500} strokeWidth="1.5" fill="none"/>
          <path d="M12 -6 Q6 -20 22 -24 Q26 -10 12 -6 Z" fill={O.clay100} stroke={O.clay700} strokeWidth="1"/>
          <path d="M38 -18 Q38 -36 56 -34 Q56 -18 38 -18 Z" fill={O.clay100} stroke={O.clay700} strokeWidth="1"/>
        </g>
      </svg>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", padding: "80px 28px 28px", zIndex: 2 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: O.moss600, marginBottom: 18 }}>Bem-vindo à Suliv</div>
          <h1 style={{ fontFamily: 'var(--font-display, "Fraunces", Georgia, serif)', fontSize: 44, lineHeight: 1.02, color: O.ink900, letterSpacing: "-0.022em", fontWeight: 400, margin: 0, textWrap: "balance" }}>
            Vamos conhecer<br/>
            <span style={{ fontFamily: 'var(--font-editorial, "Instrument Serif", Georgia, serif)', fontStyle: "italic", color: O.moss700 }}>você</span>.
          </h1>
          <p style={{ marginTop: 20, fontSize: 16.5, lineHeight: 1.5, color: O.ink700, maxWidth: 300 }}>
            Três perguntas rápidas para a Suliv montar um cardápio que combina com o jeito que você come.
          </p>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { t: "Preferência alimentar", n: "1" },
              { t: "Alergias e restrições",  n: "2" },
              { t: "Tempo e experiência na cozinha", n: "3" },
            ].map(row => (
              <div key={row.n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: O.white, border: `1px solid ${O.moss200}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: O.moss700 }}>{row.n}</div>
                <div style={{ fontSize: 15, color: O.ink700 }}>{row.t}</div>
              </div>
            ))}
          </div>
        </div>
        <BottomCTA label="Começar" onClick={onStart} />
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step0({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
      {BASE_DIET.map(opt => (
        <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} selected={value === opt.value} onClick={() => onChange(opt.value)} />
      ))}
    </div>
  );
}

function Step1({ baseDiet, values, onToggle, none, onNone }: {
  baseDiet: string | null; values: string[]; onToggle: (v: string) => void; none: boolean; onNone: () => void;
}) {
  const filtered = ALLERGEN_OPTIONS.filter(o => !(baseDiet === "vegan" && o.hideOnVegan));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
      {filtered.map(opt => (
        <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} tone="clay" multi selected={!none && values.includes(opt.value)} onClick={() => onToggle(opt.value)} />
      ))}
      <div style={{ height: 8 }}/>
      <NoneCard selected={none} onClick={onNone} />
    </div>
  );
}

function Step2({ time, onTime, skill, onSkill }: {
  time: string | null; onTime: (v: string) => void; skill: string | null; onSkill: (v: string) => void;
}) {
  const sectionLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: O.ink500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 };
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={sectionLabel}>Tempo disponível</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {TIME_OPTIONS.map(opt => (
          <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} selected={time === opt.value} onClick={() => onTime(opt.value)} />
        ))}
      </div>
      <div style={sectionLabel}>Experiência na cozinha</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SKILL_OPTIONS.map(opt => (
          <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} tone="clay" selected={skill === opt.value} onClick={() => onSkill(opt.value)} />
        ))}
      </div>
    </div>
  );
}

// ─── Done ─────────────────────────────────────────────────────────────────────
function Done({ onFinish, isLoading, error }: { onFinish: () => void; isLoading: boolean; error: string | null }) {
  return (
    <div style={{ height: "100%", width: "100%", background: O.sand100, display: "flex", flexDirection: "column", padding: "0 28px 28px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(80% 60% at 50% 10%, rgba(225,235,214,0.9), transparent 65%)" }}/>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", zIndex: 2 }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: O.moss500, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(44,64,28,0.25)", marginBottom: 24 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={O.sand25} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m4 12 5 5L20 6"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display, "Fraunces", Georgia, serif)', fontSize: 32, lineHeight: 1.1, color: O.ink900, letterSpacing: "-0.018em", fontWeight: 500, margin: 0 }}>Tudo pronto.</h2>
        <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.45, color: O.ink700, maxWidth: 280 }}>Sua Suliv está pronta para sugerir receitas feitas para você.</p>
        {error && <p style={{ marginTop: 12, fontSize: 13, color: O.danger500 }}>{error}</p>}
      </div>
      <BottomCTA label="Ver minhas receitas" onClick={onFinish} isLoading={isLoading} />
    </div>
  );
}

// ─── Flow orchestrator ────────────────────────────────────────────────────────
interface OnboardingResult {
  baseDiet: string | null;
  allergens: string[];
  noAllergens: boolean;
  timeAvail: string | null;
  skill: string | null;
}

function OnboardingFlow({ onExit }: { onExit: (data: OnboardingResult) => Promise<void> }) {
  const [page, setPage]               = useState(0);
  const [baseDiet, setBaseDiet]       = useState<string | null>(null);
  const [allergens, setAllergens]     = useState<string[]>([]);
  const [noAllergens, setNoAllergens] = useState(false);
  const [timeAvail, setTimeAvail]     = useState<string | null>(null);
  const [skill, setSkill]             = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);

  // Restore draft
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<OnboardingResult & { page: number }>;
      if (d.page != null && d.page > 0 && d.page <= 4) setPage(d.page);
      if (d.baseDiet)     setBaseDiet(d.baseDiet);
      if (d.allergens)    setAllergens(d.allergens);
      if (d.noAllergens)  setNoAllergens(d.noAllergens);
      if (d.timeAvail)    setTimeAvail(d.timeAvail);
      if (d.skill)        setSkill(d.skill);
    } catch { /* ignore */ }
  }, []);

  // Persist draft
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ page, baseDiet, allergens, noAllergens, timeAvail, skill })); }
    catch { /* ignore */ }
  }, [page, baseDiet, allergens, noAllergens, timeAvail, skill]);

  const setDiet = (v: string) => {
    setBaseDiet(v);
    if (v === "vegan") setAllergens(prev => prev.filter(a => !ALLERGEN_OPTIONS.find(o => o.value === a && o.hideOnVegan)));
  };

  const toggleAllergen = (v: string) => {
    setNoAllergens(false);
    setAllergens(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v]);
  };

  const handleNone = () => {
    setNoAllergens(n => { if (!n) setAllergens([]); return !n; });
  };

  const go = (next: number) => setPage(next);

  const canProceed = useMemo(() => [
    true,
    !!baseDiet,
    noAllergens || allergens.length > 0,
    !!timeAvail && !!skill,
    true,
  ], [baseDiet, allergens, noAllergens, timeAvail, skill]);

  async function handleFinish() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onExit({ baseDiet, allergens, noAllergens, timeAvail, skill });
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
    }
  }

  const TOTAL = 3;
  const stepMeta = [
    { kicker: "Passo 1 — Preferência base", title: "Qual sua preferência alimentar?", subtitle: "Isso define os ingredientes-base que a Suliv vai sugerir para você." },
    { kicker: "Passo 2 — Alergias", title: "Tem alguma alergia ou restrição?", subtitle: "Selecione tudo que se aplica. Vamos evitar esses ingredientes nas receitas." },
    { kicker: "Passo 3 — Rotina", title: "Como é seu dia na cozinha?", subtitle: "A Suliv usa isso pra calibrar o tempo e a complexidade das receitas." },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: O.sand100, overflow: "hidden", fontFamily: 'var(--font-sans, "Inter Tight", system-ui)' }}>
      {/* Sliding viewport */}
      <div style={{ position: "absolute", inset: 0, display: "flex", transform: `translateX(-${page * 100}%)`, transition: "transform 420ms cubic-bezier(0.22,0.61,0.36,1)" }}>
        {/* Page 0 — Welcome */}
        <div style={{ flex: "0 0 100%", height: "100%" }}>
          <Welcome onStart={() => go(1)} />
        </div>

        {/* Pages 1–3 — Steps */}
        {stepMeta.map((meta, i) => {
          const p = i + 1;
          return (
            <div key={p} style={{ flex: "0 0 100%", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 12 }}/>
              <TopBar step={p - 1} total={TOTAL} onBack={() => go(p - 1)} />
              <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
                <StepHeader kicker={meta.kicker} title={meta.title} subtitle={meta.subtitle} />
                {p === 1 && <Step0 value={baseDiet} onChange={setDiet} />}
                {p === 2 && <Step1 baseDiet={baseDiet} values={allergens} onToggle={toggleAllergen} none={noAllergens} onNone={handleNone} />}
                {p === 3 && <Step2 time={timeAvail} onTime={setTimeAvail} skill={skill} onSkill={setSkill} />}
                <div style={{ height: 12 }}/>
              </div>
              <BottomCTA
                label={p === 3 ? "Finalizar" : "Continuar"}
                disabled={!canProceed[p]}
                onClick={() => go(p + 1)}
              />
            </div>
          );
        })}

        {/* Page 4 — Done */}
        <div style={{ flex: "0 0 100%", height: "100%" }}>
          <Done onFinish={handleFinish} isLoading={isSubmitting} error={submitError} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();

  async function handleExit(data: OnboardingResult) {
    const skillMap: Record<string, string> = { beginner: "BEGINNER", intermediate: "INTERMEDIATE", experienced: "ADVANCED" };
    const timeMap:  Record<string, number> = { fast: 15, medium: 40, long: 90 };

    const body: Record<string, unknown> = {
      dietaryRestrictions: data.baseDiet ? [data.baseDiet] : [],
      allergens: data.noAllergens ? [] : data.allergens,
    };
    if (data.skill)    body.skillLevel    = skillMap[data.skill];
    if (data.timeAvail) body.avgCookTimeMin = timeMap[data.timeAvail];

    const res = await fetch("/api/profile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Erro ao salvar perfil");
    }

    sessionStorage.removeItem(DRAFT_KEY);
    router.push("/feed");
  }

  return (
    <div style={{ width: "100%", height: "100dvh" }}>
      <OnboardingFlow onExit={handleExit} />
    </div>
  );
}
