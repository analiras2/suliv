import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { tokens } from "@suliv/design-system";
import { FilterGroup } from "../molecules/FilterGroup";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface ActiveFilters {
  maxTime?: 20 | 45 | null;
  difficulty?: Difficulty | null;
  category?: string | null;
  mainIngredient?: string | null;
}

interface FilterSheetProps {
  filters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
  onClear: () => void;
  visible: boolean;
  onClose: () => void;
}

const TIME_OPTIONS = [
  { value: "20", label: "Até 20 min" },
  { value: "45", label: "Até 45 min" },
];

const DIFFICULTY_OPTIONS = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Médio" },
  { value: "ADVANCED", label: "Avançado" },
];

const CATEGORY_OPTIONS = [
  { value: "cafe", label: "Café" },
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
  { value: "lanche", label: "Lanche" },
  { value: "sobremesa", label: "Sobremesa" },
];

function countActive(f: ActiveFilters): number {
  return [f.maxTime, f.difficulty, f.category, f.mainIngredient].filter(
    (v) => v != null && v !== "",
  ).length;
}

export function FilterSheet({
  filters,
  onApply,
  onClear,
  visible,
  onClose,
}: FilterSheetProps) {
  const [local, setLocal] = useState<ActiveFilters>(filters);

  // Sync when sheet opens with fresh filters from parent
  useEffect(() => {
    if (visible) setLocal(filters);
  }, [visible, filters]);

  const activeCount = countActive(local);

  function handleApply() {
    onApply(local);
    onClose();
  }

  function handleClear() {
    const empty: ActiveFilters = {
      maxTime: null,
      difficulty: null,
      category: null,
      mainIngredient: null,
    };
    setLocal(empty);
    onClear();
    onClose();
  }

  function handleClose() {
    // Discard local changes — parent filters unchanged
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Fechar filtros">
            <Text style={styles.headerAction}>Cancelar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Filtros</Text>
          <Pressable onPress={handleClear} accessibilityRole="button" accessibilityLabel="Limpar todos os filtros">
            <Text style={styles.headerAction}>Limpar tudo</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <FilterGroup
            label="Tempo"
            options={TIME_OPTIONS}
            selected={local.maxTime != null ? String(local.maxTime) : null}
            onSelect={(v) => setLocal((p) => ({ ...p, maxTime: v ? (Number(v) as 20 | 45) : null }))}
          />

          <View style={styles.divider} />

          <FilterGroup
            label="Dificuldade"
            options={DIFFICULTY_OPTIONS}
            selected={local.difficulty ?? null}
            onSelect={(v) => setLocal((p) => ({ ...p, difficulty: (v as Difficulty) ?? null }))}
          />

          <View style={styles.divider} />

          <FilterGroup
            label="Categoria"
            options={CATEGORY_OPTIONS}
            selected={local.category ?? null}
            onSelect={(v) => setLocal((p) => ({ ...p, category: v }))}
          />

          <View style={styles.divider} />

          {/* Ingrediente principal — texto livre */}
          <View style={styles.group}>
            <Text style={styles.groupLabel}>Ingrediente principal</Text>
            <TextInput
              style={styles.textInput}
              value={local.mainIngredient ?? ""}
              onChangeText={(t) => setLocal((p) => ({ ...p, mainIngredient: t || null }))}
              placeholder="Ex: tofu, lentilha..."
              placeholderTextColor={tokens.colors.textPrimary + "66"}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
        </ScrollView>

        {/* Apply button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleApply}
            style={styles.applyButton}
            accessibilityRole="button"
            accessibilityLabel={`Aplicar filtros${activeCount > 0 ? `, ${activeCount} selecionados` : ""}`}
          >
            <Text style={styles.applyText}>
              {activeCount > 0 ? `Aplicar (${activeCount})` : "Aplicar"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.background,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  headerAction: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.primary,
  },
  body: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.background,
  },
  group: {
    gap: tokens.spacing.sm,
  },
  groupLabel: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: tokens.colors.textPrimary + "33",
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
  },
  footer: {
    padding: tokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.background,
  },
  applyButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.md,
    alignItems: "center",
  },
  applyText: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.surface,
  },
});
