"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@suliv/design-system";

const DIETARY_OPTIONS = [
  { value: "vegan", label: "Vegano" },
  { value: "vegetarian", label: "Vegetariano" },
  { value: "gluten_free", label: "Sem glúten" },
  { value: "lactose_free", label: "Sem lactose" },
  { value: "nut_free", label: "Sem oleaginosas" },
  { value: "peanut_free", label: "Sem amendoim" },
  { value: "soy_free", label: "Sem soja" },
  { value: "egg_free", label: "Sem ovo" },
];

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Intermediário" },
  { value: "ADVANCED", label: "Avançado" },
];

const STORAGE_KEY = "suliv_onboarding";

interface OnboardingState {
  step: number;
  restrictions: string[];
  allergies: string[];
  skillLevel: string;
  availableTime: string;
  householdSize: string;
}

const DEFAULT_STATE: OnboardingState = {
  step: 1,
  restrictions: [],
  allergies: [],
  skillLevel: "",
  availableTime: "",
  householdSize: "",
};

function loadState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as OnboardingState;
  } catch {
    // ignore parse errors
  }
  return DEFAULT_STATE;
}

function saveState(state: OnboardingState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function dotStyle(active: boolean): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: active ? tokens.colors.primary : "#ccc",
    transition: "background-color 0.2s",
  };
}

function optionBtnStyle(selected: boolean): React.CSSProperties {
  return {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.borderRadius.sm,
    border: `2px solid ${selected ? tokens.colors.primary : "#ccc"}`,
    backgroundColor: selected
      ? `${tokens.colors.primary}20`
      : tokens.colors.surface,
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: selected
      ? tokens.typography.fontWeights.semibold
      : tokens.typography.fontWeights.regular,
    cursor: "pointer",
    textAlign: "center",
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
  progressContainer: {
    display: "flex",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md,
  },
  subtitle: {
    fontSize: tokens.typography.fontSizes.sm,
    color: "#666",
    marginBottom: tokens.spacing.xl,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
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
    fontWeight: tokens.typography.fontWeights.medium,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  optionalLabel: {
    color: "#999",
    fontWeight: "400",
  },
  input: {
    width: "100%",
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.borderRadius.sm,
    border: "1px solid #ccc",
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
    boxSizing: "border-box",
    marginBottom: tokens.spacing.lg,
  },
  btnRow: {
    display: "flex",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  backBtn: {
    flex: 1,
    padding: `${tokens.spacing.md}px`,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    border: "1px solid #ccc",
    borderRadius: tokens.borderRadius.sm,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.medium,
    cursor: "pointer",
  },
  errorText: {
    color: tokens.colors.error,
    fontSize: tokens.typography.fontSizes.sm,
    marginBottom: tokens.spacing.md,
  },
};

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

  function goNext() {
    update({ step: state.step + 1 });
  }

  function goBack() {
    update({ step: state.step - 1 });
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

  async function handleSubmit() {
    if (!state.skillLevel) {
      setError("Selecione seu nível de habilidade");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        skillLevel: state.skillLevel,
        dietaryRestrictions: state.restrictions,
        allergens: state.allergies,
      };

      if (state.availableTime) {
        body.avgCookTimeMin = Number(state.availableTime);
      }
      if (state.householdSize) {
        body.householdSize = Number(state.householdSize);
      }

      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Erro ao salvar perfil");
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

  const TOTAL_STEPS = 3;

  return (
    <div style={s.container}>
      <div style={s.card}>
        {/* Progress dots */}
        <div style={s.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={dotStyle(state.step === i + 1)} />
          ))}
        </div>

        {/* Step 1 — Restrições alimentares */}
        {state.step === 1 && (
          <>
            <h1 style={s.title}>Restrições alimentares</h1>
            <p style={s.subtitle}>Selecione todas que se aplicam a você.</p>
            <div style={s.optionsGrid}>
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={optionBtnStyle(state.restrictions.includes(opt.value))}
                  onClick={() =>
                    update({
                      restrictions: toggleItem(state.restrictions, opt.value),
                    })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button type="button" style={nextBtnStyle} onClick={goNext}>
              Próximo
            </button>
          </>
        )}

        {/* Step 2 — Alergias */}
        {state.step === 2 && (
          <>
            <h1 style={s.title}>Alergias</h1>
            <p style={s.subtitle}>Selecione suas alergias alimentares.</p>
            <div style={s.optionsGrid}>
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={optionBtnStyle(state.allergies.includes(opt.value))}
                  onClick={() =>
                    update({
                      allergies: toggleItem(state.allergies, opt.value),
                    })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={s.btnRow}>
              <button type="button" style={s.backBtn} onClick={goBack}>
                Voltar
              </button>
              <button type="button" style={nextBtnStyle} onClick={goNext}>
                Próximo
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Habilidade e preferências */}
        {state.step === 3 && (
          <>
            <h1 style={s.title}>Sobre você</h1>
            <p style={s.subtitle}>Conta mais sobre seu perfil na cozinha.</p>

            <label style={s.label}>Nível de habilidade</label>
            <div style={s.skillGrid}>
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  style={optionBtnStyle(state.skillLevel === level.value)}
                  onClick={() => update({ skillLevel: level.value })}
                >
                  {level.label}
                </button>
              ))}
            </div>

            <label htmlFor="availableTime" style={s.label}>
              Tempo disponível{" "}
              <span style={s.optionalLabel}>(opcional, em minutos)</span>
            </label>
            <input
              id="availableTime"
              type="number"
              min={1}
              value={state.availableTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ availableTime: e.target.value })
              }
              style={s.input}
              placeholder="Ex: 30"
            />

            <label htmlFor="householdSize" style={s.label}>
              Tamanho do domicílio{" "}
              <span style={s.optionalLabel}>(opcional, pessoas)</span>
            </label>
            <input
              id="householdSize"
              type="number"
              min={1}
              value={state.householdSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ householdSize: e.target.value })
              }
              style={s.input}
              placeholder="Ex: 2"
            />

            {error && <p style={s.errorText}>{error}</p>}

            <div style={s.btnRow}>
              <button type="button" style={s.backBtn} onClick={goBack}>
                Voltar
              </button>
              <button
                type="button"
                style={nextBtnStyle}
                onClick={handleSubmit}
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
