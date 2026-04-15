"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@suliv/design-system";

const DIETARY_OPTIONS = [
  { value: "vegan", label: "Vegano" },
  { value: "vegetarian", label: "Vegetariano" },
  { value: "low_carb", label: "Low carb" },
  { value: "sem_acucar", label: "Sem açúcar" },
];

// Values match Ingredient.allergenGroup
const ALLERGEN_OPTIONS = [
  { value: "glúten", label: "Glúten" },
  { value: "soja", label: "Soja" },
  { value: "amendoim", label: "Amendoim" },
  { value: "oleaginosas", label: "Oleaginosas" },
  { value: "leite", label: "Leite" },
  { value: "ovo", label: "Ovo" },
  { value: "frutos-do-mar", label: "Frutos do mar" },
];

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Intermediário" },
  { value: "ADVANCED", label: "Avançado" },
];

const COOKING_FREQUENCY = [
  { value: 1, label: "1–2×" },
  { value: 3, label: "3–4×" },
  { value: 5, label: "5–6×" },
  { value: 7, label: "Todo dia" },
];

const STORAGE_KEY = "suliv_onboarding";
const TOTAL_STEPS = 3;

interface OnboardingState {
  step: number;
  restrictions: string[];
  allergies: string[];
  skillLevel: string;
  cookingFrequency: number | null;
}

const DEFAULT_STATE: OnboardingState = {
  step: 1,
  restrictions: [],
  allergies: [],
  skillLevel: "",
  cookingFrequency: null,
};

function loadState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_STATE, ...(JSON.parse(saved) as Partial<OnboardingState>) };
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function saveState(state: OnboardingState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function dotStyle(active: boolean): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: active ? tokens.colors.primary : "#ccc",
    transition: "background-color 0.2s",
  };
}

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.borderRadius.sm,
    border: `2px solid ${selected ? tokens.colors.primary : "#ccc"}`,
    backgroundColor: selected ? `${tokens.colors.primary}20` : tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: selected ? tokens.typography.fontWeights.semibold : tokens.typography.fontWeights.regular,
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "all 0.15s",
  };
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: tokens.colors.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing["2xl"],
    width: "100%",
    maxWidth: 480,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.xl,
  },
  progressDots: {
    display: "flex",
    gap: tokens.spacing.sm,
  },
  skipAll: {
    fontSize: tokens.typography.fontSizes.sm,
    color: "#aaa",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    textDecorationColor: "#ddd",
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: tokens.typography.fontSizes.sm,
    color: "#888",
    margin: `0 0 ${tokens.spacing.xl}px`,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  frequencyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  skillGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  label: {
    display: "block",
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
    margin: `0 0 ${tokens.spacing.sm}px`,
  },
  btnRow: {
    display: "flex",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    alignItems: "center",
  },
  backBtn: {
    padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    border: "1px solid #ccc",
    borderRadius: tokens.borderRadius.sm,
    fontSize: tokens.typography.fontSizes.md,
    cursor: "pointer",
  },
  skipStepBtn: {
    marginRight: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: tokens.typography.fontSizes.sm,
    color: "#aaa",
    padding: `${tokens.spacing.sm}px 0`,
  },
  errorText: {
    color: tokens.colors.error,
    fontSize: tokens.typography.fontSizes.sm,
    marginBottom: tokens.spacing.md,
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  function update(patch: Partial<OnboardingState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }

  const nextBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: `${tokens.spacing.md}px`,
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.surface,
    border: "none",
    borderRadius: tokens.borderRadius.sm,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    cursor: isSubmitting ? "not-allowed" : "pointer",
    opacity: isSubmitting ? 0.7 : 1,
  };

  async function submit(overrides?: Partial<OnboardingState>) {
    const data = { ...state, ...overrides };
    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        dietaryRestrictions: data.restrictions,
        allergens: data.allergies,
      };
      if (data.skillLevel) body.skillLevel = data.skillLevel;
      if (data.cookingFrequency != null) body.cookingFrequencyPerWeek = data.cookingFrequency;

      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Erro ao salvar perfil");
        setIsSubmitting(false);
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/feed");
    } catch {
      setError("Erro ao salvar perfil. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  // Skip entire onboarding
  async function skipAll() {
    await submit({ restrictions: [], allergies: [], skillLevel: "", cookingFrequency: null });
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        {/* Progress + skip */}
        <div style={s.topRow}>
          <div style={s.progressDots}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} style={dotStyle(state.step === i + 1)} />
            ))}
          </div>
          <button style={s.skipAll} onClick={skipAll} disabled={isSubmitting}>
            Configurar depois
          </button>
        </div>

        {/* ── Step 1 — Restrições alimentares ── */}
        {state.step === 1 && (
          <>
            <h1 style={s.title}>Restrições alimentares</h1>
            <p style={s.subtitle}>Selecione as que se aplicam a você. Pode pular.</p>
            <div style={s.optionsGrid}>
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={chipStyle(state.restrictions.includes(opt.value))}
                  onClick={() => update({ restrictions: toggleItem(state.restrictions, opt.value) })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={s.btnRow}>
              <button
                style={s.skipStepBtn}
                onClick={() => update({ step: 2, restrictions: [] })}
              >
                Pular
              </button>
              <button style={nextBtnStyle} onClick={() => update({ step: 2 })}>
                Próximo
              </button>
            </div>
          </>
        )}

        {/* ── Step 2 — Alergias ── */}
        {state.step === 2 && (
          <>
            <h1 style={s.title}>Alergias</h1>
            <p style={s.subtitle}>Ingredientes com estas alergias serão destacados. Pode pular.</p>
            <div style={s.optionsGrid}>
              {ALLERGEN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={chipStyle(state.allergies.includes(opt.value))}
                  onClick={() => update({ allergies: toggleItem(state.allergies, opt.value) })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={s.btnRow}>
              <button style={s.backBtn} onClick={() => update({ step: 1 })}>
                Voltar
              </button>
              <button
                style={s.skipStepBtn}
                onClick={() => update({ step: 3, allergies: [] })}
              >
                Pular
              </button>
              <button style={nextBtnStyle} onClick={() => update({ step: 3 })}>
                Próximo
              </button>
            </div>
          </>
        )}

        {/* ── Step 3 — Na cozinha ── */}
        {state.step === 3 && (
          <>
            <h1 style={s.title}>Na cozinha</h1>
            <p style={s.subtitle}>Só mais duas perguntas rápidas.</p>

            <label style={s.label}>Quantas vezes você cozinha por semana?</label>
            <div style={s.frequencyRow}>
              {COOKING_FREQUENCY.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={chipStyle(state.cookingFrequency === opt.value)}
                  onClick={() => update({ cookingFrequency: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label style={s.label}>Nível de habilidade</label>
            <div style={s.skillGrid}>
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  style={chipStyle(state.skillLevel === level.value)}
                  onClick={() => update({ skillLevel: level.value })}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {error && <p style={s.errorText}>{error}</p>}

            <div style={s.btnRow}>
              <button style={s.backBtn} onClick={() => update({ step: 2 })}>
                Voltar
              </button>
              <button
                style={nextBtnStyle}
                onClick={() => submit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando…" : "Concluir"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
