import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "@suliv/design-system";
import { useAuthStore } from "../store/authStore.js";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types.js";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

type SkillLevel = "iniciante" | "intermediario" | "avancado";

const DRAFT_KEY = "onboarding_draft";

const DIETARY_OPTIONS = [
  "Vegano",
  "Vegetariano",
  "Sem glúten",
  "Sem lactose",
  "Sem oleaginosas",
  "Sem amendoim",
  "Sem soja",
  "Sem ovo",
];

const SKILL_LEVELS: { label: string; value: SkillLevel }[] = [
  { label: "Iniciante", value: "iniciante" },
  { label: "Intermediário", value: "intermediario" },
  { label: "Avançado", value: "avancado" },
];

interface DraftData {
  step: number;
  dietaryRestrictions: string[];
  allergens: string[];
  skillLevel: SkillLevel | null;
  availableTime: string;
  householdSize: string;
}

function ProgressDots({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.dotsContainer} accessibilityLabel={`Passo ${currentStep + 1} de 3`}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, i === currentStep ? styles.dotFilled : styles.dotOutline]}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen({ navigation: _navigation }: Props) {
  const { saveOnboarding, isLoading } = useAuthStore();

  const [step, setStep] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [availableTime, setAvailableTime] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
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
          setAvailableTime(draft.availableTime ?? "");
          setHouseholdSize(draft.householdSize ?? "");
        } catch {
          // Ignore corrupt draft
        }
      })
      .catch(() => undefined);
  }, []);

  // Persist draft whenever state changes
  useEffect(() => {
    const draft: DraftData = {
      step,
      dietaryRestrictions,
      allergens,
      skillLevel,
      availableTime,
      householdSize,
    };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => undefined);
  }, [step, dietaryRestrictions, allergens, skillLevel, availableTime, householdSize]);

  function toggleDietary(option: string) {
    setDietaryRestrictions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  function toggleAllergen(option: string) {
    setAllergens((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }

  async function handleFinish() {
    if (!skillLevel) return;
    setError(null);

    const data: {
      dietaryRestrictions: string[];
      allergens: string[];
      skillLevel: SkillLevel;
      availableTime?: number;
      householdSize?: number;
    } = {
      dietaryRestrictions,
      allergens,
      skillLevel,
    };

    const parsedTime = parseInt(availableTime, 10);
    if (!isNaN(parsedTime) && parsedTime > 0) {
      data.availableTime = parsedTime;
    }

    const parsedHousehold = parseInt(householdSize, 10);
    if (!isNaN(parsedHousehold) && parsedHousehold > 0) {
      data.householdSize = parsedHousehold;
    }

    try {
      await saveOnboarding(data);
      await AsyncStorage.removeItem(DRAFT_KEY);
      // Navigation happens automatically via authStore (hasProfile -> Feed)
    } catch {
      setError("Não foi possível salvar suas preferências. Tente novamente.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressDots currentStep={step} />

        {step === 0 && (
          <StepDietary
            selected={dietaryRestrictions}
            onToggle={toggleDietary}
            onNext={() => setStep(1)}
            onSkip={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <StepAllergens
            selected={allergens}
            onToggle={toggleAllergen}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            onSkip={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepPreferences
            skillLevel={skillLevel}
            onSkillLevelChange={setSkillLevel}
            availableTime={availableTime}
            onAvailableTimeChange={setAvailableTime}
            householdSize={householdSize}
            onHouseholdSizeChange={setHouseholdSize}
            onBack={() => setStep(1)}
            onFinish={handleFinish}
            isLoading={isLoading}
            error={error}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Dietary Restrictions
// ---------------------------------------------------------------------------

interface StepDietaryProps {
  selected: string[];
  onToggle: (option: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

function StepDietary({ selected, onToggle, onNext, onSkip }: StepDietaryProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Restrições alimentares</Text>
      <Text style={styles.stepSubtitle}>
        Selecione todas que se aplicam a você (opcional)
      </Text>

      <View style={styles.optionsGrid}>
        {DIETARY_OPTIONS.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(option)}
              accessibilityLabel={`${option}${isSelected ? ", selecionado" : ""}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
          accessibilityLabel="Pular restrições alimentares"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onNext}
          accessibilityLabel="Próximo passo"
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>Próximo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Allergens
// ---------------------------------------------------------------------------

interface StepAllergensProps {
  selected: string[];
  onToggle: (option: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function StepAllergens({ selected, onToggle, onNext, onBack, onSkip }: StepAllergensProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Alergias</Text>
      <Text style={styles.stepSubtitle}>
        Selecione todas que se aplicam a você (opcional)
      </Text>

      <View style={styles.optionsGrid}>
        {DIETARY_OPTIONS.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(option)}
              accessibilityLabel={`${option}${isSelected ? ", selecionado" : ""}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Voltar ao passo anterior"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
          accessibilityLabel="Pular alergias"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onNext}
          accessibilityLabel="Próximo passo"
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>Próximo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Preferences
// ---------------------------------------------------------------------------

interface StepPreferencesProps {
  skillLevel: SkillLevel | null;
  onSkillLevelChange: (level: SkillLevel) => void;
  availableTime: string;
  onAvailableTimeChange: (value: string) => void;
  householdSize: string;
  onHouseholdSizeChange: (value: string) => void;
  onBack: () => void;
  onFinish: () => void;
  isLoading: boolean;
  error: string | null;
}

function StepPreferences({
  skillLevel,
  onSkillLevelChange,
  availableTime,
  onAvailableTimeChange,
  householdSize,
  onHouseholdSizeChange,
  onBack,
  onFinish,
  isLoading,
  error,
}: StepPreferencesProps) {
  const canFinish = skillLevel !== null && !isLoading;

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Preferências</Text>
      <Text style={styles.stepSubtitle}>
        Personalize sua experiência
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nível de habilidade</Text>
        <View style={styles.skillRow}>
          {SKILL_LEVELS.map(({ label, value }) => {
            const isSelected = skillLevel === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.skillBtn, isSelected && styles.skillBtnSelected]}
                onPress={() => onSkillLevelChange(value)}
                accessibilityLabel={`Nível ${label}${isSelected ? ", selecionado" : ""}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <Text style={[styles.skillBtnText, isSelected && styles.skillBtnTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          Tempo disponível por receita (min) (opcional)
        </Text>
        <TextInput
          style={styles.numberInput}
          value={availableTime}
          onChangeText={onAvailableTimeChange}
          keyboardType="number-pad"
          placeholder="Ex: 30"
          placeholderTextColor={tokens.colors.textPrimary + "66"}
          accessibilityLabel="Tempo disponível por receita em minutos"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pessoas no domicílio (opcional)</Text>
        <TextInput
          style={styles.numberInput}
          value={householdSize}
          onChangeText={onHouseholdSizeChange}
          keyboardType="number-pad"
          placeholder="Ex: 2"
          placeholderTextColor={tokens.colors.textPrimary + "66"}
          accessibilityLabel="Número de pessoas no domicílio"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          disabled={isLoading}
          accessibilityLabel="Voltar ao passo anterior"
          accessibilityRole="button"
        >
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, !canFinish && styles.btnDisabled]}
          onPress={onFinish}
          disabled={!canFinish}
          accessibilityLabel="Concluir configuração"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canFinish }}
        >
          {isLoading ? (
            <ActivityIndicator color={tokens.colors.surface} />
          ) : (
            <Text style={styles.btnPrimaryText}>Concluir</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotFilled: {
    backgroundColor: tokens.colors.primary,
  },
  dotOutline: {
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    backgroundColor: "transparent",
  },
  stepContainer: {
    gap: tokens.spacing.xl,
  },
  stepTitle: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary + "99",
    marginTop: -tokens.spacing.lg,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  chipSelected: {
    backgroundColor: tokens.colors.primary,
  },
  chipText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  chipTextSelected: {
    color: tokens.colors.surface,
  },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  skipBtn: {
    padding: tokens.spacing.sm,
  },
  skipText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "99",
    fontWeight: tokens.typography.fontWeights.medium,
  },
  backBtn: {
    padding: tokens.spacing.sm,
    marginRight: "auto",
  },
  backText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  btn: {
    height: 52,
    paddingHorizontal: tokens.spacing["2xl"],
    borderRadius: tokens.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: tokens.colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: {
    color: tokens.colors.surface,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
  },
  section: {
    gap: tokens.spacing.sm,
  },
  sectionLabel: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
    color: tokens.colors.textPrimary,
  },
  skillRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  skillBtn: {
    flex: 1,
    height: 44,
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  skillBtnSelected: {
    backgroundColor: tokens.colors.primary,
  },
  skillBtnText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  skillBtnTextSelected: {
    color: tokens.colors.surface,
  },
  numberInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
    textAlign: "center",
  },
});
