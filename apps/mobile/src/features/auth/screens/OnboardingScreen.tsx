import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "@suliv/design-system";
import { useAuthStore } from "../store/authStore";
import { Button } from "../../../components/atoms/Button";
import { Chip } from "../../../components/atoms/Chip";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const DRAFT_KEY = "onboarding_draft";

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

const SKILL_LEVELS: { label: string; value: SkillLevel }[] = [
  { label: "Iniciante", value: "BEGINNER" },
  { label: "Intermediário", value: "INTERMEDIATE" },
  { label: "Avançado", value: "ADVANCED" },
];

const COOKING_FREQUENCY: { label: string; value: number }[] = [
  { label: "1–2×", value: 1 },
  { label: "3–4×", value: 3 },
  { label: "5–6×", value: 5 },
  { label: "Todo dia", value: 7 },
];

interface DraftData {
  step: number;
  dietaryRestrictions: string[];
  allergens: string[];
  skillLevel: SkillLevel | null;
  cookingFrequency: number | null;
}

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------

function ProgressDots({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <View style={styles.dotsContainer} accessibilityLabel={`Passo ${currentStep + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === currentStep ? styles.dotFilled : styles.dotOutline]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// OnboardingScreen
// ---------------------------------------------------------------------------

export function OnboardingScreen({ navigation: _navigation }: Props) {
  const { saveOnboarding, isLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [cookingFrequency, setCookingFrequency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const draft: DraftData = JSON.parse(raw);
          setStep(draft.step ?? 0);
          setDietaryRestrictions(draft.dietaryRestrictions ?? []);
          setAllergens(draft.allergens ?? []);
          setSkillLevel(draft.skillLevel ?? null);
          setCookingFrequency(draft.cookingFrequency ?? null);
        } catch {
          // ignore corrupt draft
        }
      })
      .catch(() => undefined);
  }, []);

  // Persist draft on state change
  useEffect(() => {
    const draft: DraftData = { step, dietaryRestrictions, allergens, skillLevel, cookingFrequency };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => undefined);
  }, [step, dietaryRestrictions, allergens, skillLevel, cookingFrequency]);

  function toggle<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) {
    setter((prev) => prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]);
  }

  async function finish(opts?: { skipAll?: boolean }) {
    setError(null);

    const data: Parameters<typeof saveOnboarding>[0] = {
      dietaryRestrictions: opts?.skipAll ? [] : dietaryRestrictions,
      allergens: opts?.skipAll ? [] : allergens,
    };

    if (!opts?.skipAll) {
      if (skillLevel) data.skillLevel = skillLevel;
      if (cookingFrequency != null) data.cookingFrequencyPerWeek = cookingFrequency;
    }

    try {
      await saveOnboarding(data);
      await AsyncStorage.removeItem(DRAFT_KEY);
      // Navigation happens automatically via authStore (hasProfile → Feed)
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    }
  }

  const TOTAL = 3;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar: dots + skip all */}
        <View style={styles.topBar}>
          <ProgressDots currentStep={step} total={TOTAL} />
          <TouchableOpacity
            onPress={() => finish({ skipAll: true })}
            disabled={isLoading}
            accessibilityLabel="Configurar depois"
            accessibilityRole="button"
          >
            <Text style={styles.skipAllText}>Configurar depois</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step 0 — Restrições alimentares ── */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Restrições alimentares</Text>
            <Text style={styles.stepSubtitle}>Selecione as que se aplicam. Pode pular.</Text>
            <View style={styles.optionsGrid}>
              {DIETARY_OPTIONS.map((opt) => {
                const sel = dietaryRestrictions.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    variant="input"
                    selected={sel}
                    onPress={() => toggle(setDietaryRestrictions, opt.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                  />
                );
              })}
            </View>
            <View style={styles.navRow}>
              <Button
                label="Pular"
                variant="text"
                size="md"
                onPress={() => { setDietaryRestrictions([]); setStep(1); }}
              />
              <Button label="Próximo" variant="primary" onPress={() => setStep(1)} />
            </View>
          </View>
        )}

        {/* ── Step 1 — Alergias ── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Alergias</Text>
            <Text style={styles.stepSubtitle}>
              Ingredientes com essas alergias serão destacados. Pode pular.
            </Text>
            <View style={styles.optionsGrid}>
              {ALLERGEN_OPTIONS.map((opt) => {
                const sel = allergens.includes(opt.value);
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    variant="input"
                    selected={sel}
                    onPress={() => toggle(setAllergens, opt.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sel }}
                  />
                );
              })}
            </View>
            <View style={styles.navRow}>
              <Button label="Voltar" variant="text" size="md" style={styles.backButton} onPress={() => setStep(0)} />
              <Button
                label="Pular"
                variant="text"
                size="md"
                onPress={() => { setAllergens([]); setStep(2); }}
              />
              <Button label="Próximo" variant="primary" onPress={() => setStep(2)} />
            </View>
          </View>
        )}

        {/* ── Step 2 — Na cozinha ── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Na cozinha</Text>
            <Text style={styles.stepSubtitle}>Só mais duas perguntas rápidas.</Text>

            <Text style={styles.sectionLabel}>
              Quantas vezes você cozinha por semana?
            </Text>
            <View style={styles.frequencyRow}>
              {COOKING_FREQUENCY.map((opt) => {
                const sel = cookingFrequency === opt.value;
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    variant="input"
                    selected={sel}
                    onPress={() => setCookingFrequency(sel ? null : opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                  />
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: tokens.spacing.lg }]}>
              Nível de habilidade
            </Text>
            <View style={styles.skillRow}>
              {SKILL_LEVELS.map(({ label, value }) => {
                const sel = skillLevel === value;
                return (
                  <Chip
                    key={value}
                    label={label}
                    variant="input"
                    selected={sel}
                    style={styles.skillChip}
                    onPress={() => setSkillLevel(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                  />
                );
              })}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.navRow}>
              <Button
                label="Voltar"
                variant="text"
                size="md"
                style={styles.backButton}
                onPress={() => setStep(1)}
                disabled={isLoading}
              />
              <Button
                label="Concluir"
                variant="primary"
                loading={isLoading}
                onPress={() => finish()}
                disabled={isLoading}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tokens.colors.background },
  container: {
    flexGrow: 1,
    padding: tokens.spacing.xl,
    gap: tokens.spacing.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: tokens.spacing.xl,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: tokens.colors.primary },
  dotOutline: {
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    backgroundColor: "transparent",
  },
  skipAllText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "66",
    textDecorationLine: "underline",
  },
  stepContainer: { gap: tokens.spacing.xl },
  stepTitle: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary + "88",
    marginTop: -tokens.spacing.lg,
  },
  sectionLabel: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  frequencyRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  backButton: {
    marginRight: "auto",
  },
  skillRow: { flexDirection: "row", gap: tokens.spacing.sm },
  skillChip: {
    flex: 1,
    borderRadius: tokens.radius.sm,
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
    textAlign: "center",
  },
});
