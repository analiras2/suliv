"use client";

import React from "react";

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface FilterState {
  q: string;
  category: string;
  difficulty: Difficulty | "";
  maxTime: string;
  mainIngredient: string;
}

export const EMPTY_FILTERS: FilterState = {
  q: "",
  category: "",
  difficulty: "",
  maxTime: "",
  mainIngredient: "",
};

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "BEGINNER", label: "Iniciante" },
  { value: "INTERMEDIATE", label: "Médio" },
  { value: "ADVANCED", label: "Avançado" },
];

export const CATEGORY_OPTIONS = [
  { value: "cafe", label: "Café" },
  { value: "almoco", label: "Almoço" },
  { value: "jantar", label: "Jantar" },
  { value: "lanche", label: "Lanche" },
  { value: "sobremesa", label: "Sobremesa" },
];

const TIME_OPTIONS = [
  { value: "20", label: "Até 20 min" },
  { value: "45", label: "Até 45 min" },
];

interface FilterPanelProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const activeCount = [
    filters.category,
    filters.difficulty,
    filters.maxTime,
    filters.mainIngredient,
  ].filter(Boolean).length;

  return (
    <aside style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.heading}>Filtros</span>
        {activeCount > 0 && (
          <button onClick={onClear} style={styles.clearButton}>
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Time */}
      <FilterSection label="Tempo">
        {TIME_OPTIONS.map((opt) => (
          <ChipButton
            key={opt.value}
            label={opt.label}
            active={filters.maxTime === opt.value}
            onClick={() =>
              onChange("maxTime", filters.maxTime === opt.value ? "" : opt.value)
            }
          />
        ))}
      </FilterSection>

      {/* Difficulty */}
      <FilterSection label="Dificuldade">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <ChipButton
            key={opt.value}
            label={opt.label}
            active={filters.difficulty === opt.value}
            onClick={() =>
              onChange(
                "difficulty",
                filters.difficulty === opt.value ? "" : opt.value,
              )
            }
          />
        ))}
      </FilterSection>

      {/* Category */}
      <FilterSection label="Categoria">
        {CATEGORY_OPTIONS.map((opt) => (
          <ChipButton
            key={opt.value}
            label={opt.label}
            active={filters.category === opt.value}
            onClick={() =>
              onChange(
                "category",
                filters.category === opt.value ? "" : opt.value,
              )
            }
          />
        ))}
      </FilterSection>

      {/* Main ingredient */}
      <FilterSection label="Ingrediente principal">
        <input
          type="text"
          value={filters.mainIngredient}
          onChange={(e) => onChange("mainIngredient", e.target.value)}
          placeholder="Ex: tofu, lentilha…"
          style={styles.textInput}
        />
      </FilterSection>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionLabel}>{label}</p>
      <div style={styles.chips}>{children}</div>
    </div>
  );
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.chip,
        ...(active ? styles.chipActive : {}),
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline, matches existing web pattern)
// ---------------------------------------------------------------------------

const styles = {
  panel: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 20,
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #f0f0f0",
    minWidth: 220,
  },
  header: {
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  heading: {
    fontSize: 15,
    fontWeight: 600 as const,
    color: "#1a1a1a",
  },
  clearButton: {
    background: "none",
    border: "none",
    cursor: "pointer" as const,
    fontSize: 13,
    color: "#80BC60",
    padding: 0,
  },
  section: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 8,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600 as const,
    color: "#666",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  chips: {
    display: "flex" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  chip: {
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid #e0e0e0",
    background: "#fff",
    fontSize: 13,
    color: "#444",
    cursor: "pointer" as const,
    lineHeight: "1.4",
  },
  chipActive: {
    borderColor: "#80BC60",
    backgroundColor: "#80BC6015",
    color: "#4a8030",
    fontWeight: 500 as const,
  },
  textInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "6px 10px",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 13,
    color: "#1a1a1a",
    outline: "none",
  },
};
