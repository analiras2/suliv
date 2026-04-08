"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface ProfileData {
  dietaryRestrictions: string[];
  allergens: string[];
  preferredCuisines: string[];
  skillLevel: string;
  avgCookTimeMin: number | null;
  householdSize: number | null;
}

const EMPTY_PROFILE: ProfileData = {
  dietaryRestrictions: [],
  allergens: [],
  preferredCuisines: [],
  skillLevel: "",
  avgCookTimeMin: null,
  householdSize: null,
};

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
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
  };
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.lg,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing["2xl"],
    maxWidth: 600,
    margin: "0 auto",
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xl,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSizes.lg,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacing.sm,
  },
  skillGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacing.sm,
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
  },
  toast: {
    position: "fixed",
    bottom: tokens.spacing["2xl"],
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.surface,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.xl}px`,
    borderRadius: tokens.borderRadius.md,
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
    zIndex: 1000,
  },
};

export default function ProfileSettingsPage() {
  const [original, setOriginal] = useState<ProfileData>(EMPTY_PROFILE);
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          setLoadError("Não foi possível carregar o perfil.");
          setIsLoading(false);
          return;
        }
        const data = (await res.json()) as { profile: Record<string, unknown> };
        const p = data.profile;

        const profileData: ProfileData = {
          dietaryRestrictions: (p.dietaryRestrictions as string[]) ?? [],
          allergens: (p.allergens as string[]) ?? [],
          preferredCuisines: (p.preferredCuisines as string[]) ?? [],
          skillLevel: (p.skillLevel as string) ?? "",
          avgCookTimeMin: (p.avgCookTimeMin as number | null) ?? null,
          householdSize: (p.householdSize as number | null) ?? null,
        };

        setOriginal(profileData);
        setForm(profileData);
      } catch {
        setLoadError("Erro ao carregar perfil.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProfile();
  }, []);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Sair sem salvar?";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const saveBtnStyle: React.CSSProperties = {
    padding: `${tokens.spacing.md}px ${tokens.spacing["2xl"]}px`,
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.surface,
    border: "none",
    borderRadius: tokens.borderRadius.sm,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    cursor: isSaving ? "not-allowed" : "pointer",
    opacity: isSaving ? 0.7 : 1,
  };

  async function handleSave() {
    setIsSaving(true);

    try {
      const body: Record<string, unknown> = {
        dietaryRestrictions: form.dietaryRestrictions,
        allergens: form.allergens,
        preferredCuisines: form.preferredCuisines,
      };

      if (form.skillLevel) body.skillLevel = form.skillLevel;
      if (form.avgCookTimeMin != null) body.avgCookTimeMin = form.avgCookTimeMin;
      if (form.householdSize != null) body.householdSize = form.householdSize;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        showToast("Erro ao salvar. Tente novamente.");
        return;
      }

      const data = (await res.json()) as { profile: Record<string, unknown> };
      const p = data.profile;
      const updated: ProfileData = {
        dietaryRestrictions: (p.dietaryRestrictions as string[]) ?? [],
        allergens: (p.allergens as string[]) ?? [],
        preferredCuisines: (p.preferredCuisines as string[]) ?? [],
        skillLevel: (p.skillLevel as string) ?? "",
        avgCookTimeMin: (p.avgCookTimeMin as number | null) ?? null,
        householdSize: (p.householdSize as number | null) ?? null,
      };

      setOriginal(updated);
      setForm(updated);
      showToast("Perfil atualizado");
    } catch {
      showToast("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <p>Carregando perfil…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <p style={{ color: tokens.colors.error }}>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h1 style={s.title}>Configurações do perfil</h1>

        {/* Dietary restrictions */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Restrições alimentares</h2>
          <div style={s.optionsGrid}>
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                style={optionBtnStyle(
                  form.dietaryRestrictions.includes(opt.value)
                )}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    dietaryRestrictions: toggleItem(
                      prev.dietaryRestrictions,
                      opt.value
                    ),
                  }))
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Alergias</h2>
          <div style={s.optionsGrid}>
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                style={optionBtnStyle(form.allergens.includes(opt.value))}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    allergens: toggleItem(prev.allergens, opt.value),
                  }))
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred cuisines */}
        <div style={s.section}>
          <label htmlFor="preferredCuisines" style={s.label}>
            Culinária preferida{" "}
            <span style={s.optionalLabel}>(opcional)</span>
          </label>
          <input
            id="preferredCuisines"
            type="text"
            placeholder="Ex: Italiana, Japonesa (separadas por vírgula)"
            value={form.preferredCuisines.join(", ")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                preferredCuisines: e.target.value
                  .split(",")
                  .map((s2) => s2.trim())
                  .filter(Boolean),
              }))
            }
            style={s.input}
          />
        </div>

        {/* Skill level */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Nível de habilidade</h2>
          <div style={s.skillGrid}>
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                style={optionBtnStyle(form.skillLevel === level.value)}
                onClick={() =>
                  setForm((prev) => ({ ...prev, skillLevel: level.value }))
                }
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Available time */}
        <div style={s.section}>
          <label htmlFor="avgCookTimeMin" style={s.label}>
            Tempo disponível{" "}
            <span style={s.optionalLabel}>(opcional, em minutos)</span>
          </label>
          <input
            id="avgCookTimeMin"
            type="number"
            min={1}
            value={form.avgCookTimeMin ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                avgCookTimeMin: e.target.value ? Number(e.target.value) : null,
              }))
            }
            style={s.input}
            placeholder="Ex: 30"
          />
        </div>

        {/* Household size */}
        <div style={s.section}>
          <label htmlFor="householdSize" style={s.label}>
            Tamanho do domicílio{" "}
            <span style={s.optionalLabel}>(opcional, pessoas)</span>
          </label>
          <input
            id="householdSize"
            type="number"
            min={1}
            value={form.householdSize ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({
                ...prev,
                householdSize: e.target.value ? Number(e.target.value) : null,
              }))
            }
            style={s.input}
            placeholder="Ex: 2"
          />
        </div>

        <button
          type="button"
          style={saveBtnStyle}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Salvando…" : "Salvar"}
        </button>
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
