import {
  View, Text, ScrollView,
  Animated, Dimensions, Easing,
} from "react-native";
import { useRef, useState, useMemo, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "@suliv/design-system";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import { Button } from "../../../components/atoms/Button";
import { type GlyphSpec } from "../../../components/atoms/GlyphIcon";
import { OptionCard } from "../../../components/molecules/OptionCard";
import { NoneCard } from "../../../components/molecules/NoneCard";
import { StepHeader } from "../../../components/molecules/StepHeader";
import { StepProgressBar } from "../../../components/molecules/StepProgressBar";

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = tokens.color.primitive;
const O = {
  sand50:  P.sand[50],  sand100: P.sand[100], sand25: P.sand[25],
  moss100: P.moss[100], moss200: P.moss[200], moss300: P.moss[300],
  moss500: P.moss[500], moss600: P.moss[600], moss700: P.moss[700], moss800: P.moss[800],
  clay100: P.clay[100], clay500: P.clay[500], clay700: P.clay[700],
  ink100:  P.ink[100],  ink200:  P.ink[200],  ink300:  P.ink[300],
  ink500:  P.ink[500],  ink700:  P.ink[700],  ink900:  P.ink[900],
  white:   P.white,
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const BASE_DIET = [
  { value: "vegan",       label: "Vegano",       sub: "Sem ingredientes de origem animal", glyph: { lib: "ion", name: "leaf" }              as GlyphSpec },
  { value: "vegetarian",  label: "Vegetariano",  sub: "Aceito leite e ovos",              glyph: { lib: "mci", name: "flower"  }             as GlyphSpec },
  { value: "flexitarian", label: "Flexitariano", sub: "Reduzindo carne aos poucos",       glyph: { lib: "mci", name: "silverware-fork-knife" } as GlyphSpec },
];

const ALLERGEN_OPTIONS = [
  { value: "gluten",    label: "Glúten",            sub: "Trigo, centeio, cevada",     glyph: { lib: "mci", name: "barley"   } as GlyphSpec, hideOnVegan: false },
  { value: "soy",       label: "Soja",              sub: "Grãos e derivados",          glyph: { lib: "mci", name: "seed"     } as GlyphSpec, hideOnVegan: false },
  { value: "peanuts",   label: "Amendoim",          sub: "",                           glyph: { lib: "mci", name: "peanut"   } as GlyphSpec, hideOnVegan: false },
  { value: "tree_nuts", label: "Oleaginosas",       sub: "Castanhas, nozes, amêndoas", glyph: { lib: "mci", name: "nut"      } as GlyphSpec, hideOnVegan: false },
  { value: "dairy",     label: "Leite e derivados", sub: "",                           glyph: { lib: "mci", name: "cow"      } as GlyphSpec, hideOnVegan: true  },
  { value: "eggs",      label: "Ovos",              sub: "",                           glyph: { lib: "mci", name: "egg"      } as GlyphSpec, hideOnVegan: true  },
];

const TIME_OPTIONS = [
  { value: "fast",   label: "Até 15 min", sub: "Express",      glyph: { lib: "mci", name: "clock-fast"    } as GlyphSpec, avgMin: 15 },
  { value: "medium", label: "Até 40 min", sub: "Dia a dia",    glyph: { lib: "ion", name: "time-outline"  } as GlyphSpec, avgMin: 40 },
  { value: "long",   label: "Tenho tempo",sub: "Slow cooking", glyph: { lib: "mci", name: "timer-sand"    } as GlyphSpec, avgMin: 90 },
];

const SKILL_OPTIONS = [
  { value: "beginner",     label: "Iniciante",     sub: "Começando a cozinhar",  glyph: { lib: "mci", name: "sprout"     } as GlyphSpec, level: "BEGINNER"     as const },
  { value: "intermediate", label: "Intermediário", sub: "Mando bem no básico",   glyph: { lib: "ion", name: "leaf"       } as GlyphSpec, level: "INTERMEDIATE"  as const },
  { value: "experienced",  label: "Experiente",    sub: "Topo qualquer receita", glyph: { lib: "ion", name: "flame"      } as GlyphSpec, level: "ADVANCED"      as const },
];

const DRAFT_KEY = "onboarding_draft_v2";
const W = Dimensions.get("window").width;
const PAGE_COUNT = 5;

// ─── Bottom CTA ───────────────────────────────────────────────────────────────
function BottomCTA({ label, onPress, disabled, isLoading }: {
  label: string; onPress: () => void; disabled?: boolean; isLoading?: boolean;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: O.sand100 }}>
      <Button label={label} onPress={onPress} disabled={disabled} loading={isLoading} fullWidth />
    </View>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────
function WelcomeContent({ onStart, topPad, botPad }: { onStart: () => void; topPad: number; botPad: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: O.sand100, overflow: "hidden" }}>
      {/* Soft decorative circles */}
      <View style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: O.moss200, opacity: 0.45 }} />
      <View style={{ position: "absolute", bottom: 100, left: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: O.clay100, opacity: 0.5 }} />

      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: topPad + 40, paddingBottom: botPad + 28, zIndex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 1.98, textTransform: "uppercase", color: O.moss600, marginBottom: 18, fontFamily: tokens.typography.family.semibold }}>
            Bem-vindo à Suliv
          </Text>
          <Text style={{ fontSize: 40, lineHeight: 42, color: O.ink900, letterSpacing: -0.8, fontWeight: "400", fontFamily: tokens.typography.family.displayRegular }}>
            Vamos conhecer
          </Text>
          <Text style={{ fontSize: 40, lineHeight: 46, color: O.moss700, letterSpacing: -0.8, fontWeight: "400", fontFamily: tokens.typography.family.editorialItalic }}>
            você.
          </Text>
          <Text style={{ marginTop: 20, fontSize: 16.5, lineHeight: 25, color: O.ink700, fontFamily: tokens.typography.family.regular }}>
            Três perguntas rápidas para a Suliv montar um cardápio que combina com o jeito que você come.
          </Text>
          <View style={{ marginTop: 28, gap: 10 }}>
            {[
              { t: "Preferência alimentar",          n: "1" },
              { t: "Alergias e restrições",           n: "2" },
              { t: "Tempo e experiência na cozinha",  n: "3" },
            ].map(row => (
              <View key={row.n} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: O.white, borderWidth: 1, borderColor: O.moss200, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: O.moss700, fontFamily: tokens.typography.family.semibold }}>{row.n}</Text>
                </View>
                <Text style={{ fontSize: 15, color: O.ink700, fontFamily: tokens.typography.family.regular }}>{row.t}</Text>
              </View>
            ))}
          </View>
        </View>
        <BottomCTA label="Começar" onPress={onStart} />
      </View>
    </View>
  );
}

// ─── Done ─────────────────────────────────────────────────────────────────────
function DoneContent({ onFinish, isLoading, error, topPad, botPad }: {
  onFinish: () => void; isLoading: boolean; error: string | null; topPad: number; botPad: number;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: O.sand100, overflow: "hidden" }}>
      <View style={{ position: "absolute", top: -80, left: W / 2 - 120, width: 240, height: 240, borderRadius: 120, backgroundColor: O.moss100, opacity: 0.8 }} />
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: topPad, paddingBottom: botPad + 28, alignItems: "center", justifyContent: "flex-end", zIndex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: O.moss500, alignItems: "center", justifyContent: "center", marginBottom: 24, ...tokens.elevation.lg }}>
            <Ionicons name="checkmark" size={48} color={O.sand25} />
          </View>
          <Text style={{ fontSize: 32, lineHeight: 36, color: O.ink900, letterSpacing: -0.5, fontWeight: "500", fontFamily: tokens.typography.family.displayMedium, textAlign: "center", marginBottom: 12 }}>
            Tudo pronto.
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 23, color: O.ink700, fontFamily: tokens.typography.family.regular, textAlign: "center", maxWidth: 280 }}>
            Sua Suliv está pronta para sugerir receitas feitas para você.
          </Text>
          {!!error && <Text style={{ marginTop: 12, fontSize: 13, color: tokens.color.semantic.feedback.error, textAlign: "center", fontFamily: tokens.typography.family.regular }}>{error}</Text>}
        </View>
        <BottomCTA label="Ver minhas receitas" onPress={onFinish} isLoading={isLoading} />
      </View>
    </View>
  );
}

// ─── Step contents ────────────────────────────────────────────────────────────
function Step0({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 12, paddingHorizontal: 20 }}>
      {BASE_DIET.map(opt => (
        <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} selected={value === opt.value} onPress={() => onChange(opt.value)} />
      ))}
    </View>
  );
}

function Step1({ baseDiet, values, onToggle, none, onNone }: {
  baseDiet: string | null; values: string[]; onToggle: (v: string) => void; none: boolean; onNone: () => void;
}) {
  const filtered = ALLERGEN_OPTIONS.filter(o => !(baseDiet === "vegan" && o.hideOnVegan));
  return (
    <View style={{ gap: 10, paddingHorizontal: 20 }}>
      {filtered.map(opt => (
        <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} tone="clay" multi selected={!none && values.includes(opt.value)} onPress={() => onToggle(opt.value)} />
      ))}
      <View style={{ height: 8 }} />
      <NoneCard label="Nenhuma alergia ou restrição" selected={none} onPress={onNone} />
    </View>
  );
}

function Step2({ time, onTime, skill, onSkill }: {
  time: string | null; onTime: (v: string) => void; skill: string | null; onSkill: (v: string) => void;
}) {
  const sectionLabel = { fontSize: 12, fontWeight: "600" as const, color: O.ink500, letterSpacing: 0.96, textTransform: "uppercase" as const, marginBottom: 10, fontFamily: tokens.typography.family.semibold };
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={sectionLabel}>Tempo disponível</Text>
      <View style={{ gap: 10, marginBottom: 22 }}>
        {TIME_OPTIONS.map(opt => (
          <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} selected={time === opt.value} onPress={() => onTime(opt.value)} />
        ))}
      </View>
      <Text style={sectionLabel}>Experiência na cozinha</Text>
      <View style={{ gap: 10 }}>
        {SKILL_OPTIONS.map(opt => (
          <OptionCard key={opt.value} label={opt.label} sub={opt.sub} glyph={opt.glyph} tone="clay" selected={skill === opt.value} onPress={() => onSkill(opt.value)} />
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const { saveOnboarding, isLoading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(0)).current;

  const [page, setPage]               = useState(0);
  const [baseDiet, setBaseDiet]       = useState<string | null>(null);
  const [allergens, setAllergens]     = useState<string[]>([]);
  const [noAllergens, setNoAllergens] = useState(false);
  const [timeAvail, setTimeAvail]     = useState<string | null>(null);
  const [skill, setSkill]             = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(raw => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        if (d.baseDiet)           setBaseDiet(d.baseDiet);
        if (d.allergens)          setAllergens(d.allergens);
        if (d.noAllergens != null) setNoAllergens(d.noAllergens);
        if (d.timeAvail)          setTimeAvail(d.timeAvail);
        if (d.skill)              setSkill(d.skill);
        if (d.page && d.page > 0 && d.page <= 4) {
          slideX.setValue(-d.page * W);
          setPage(d.page);
        }
      } catch { /* ignore */ }
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft
  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ page, baseDiet, allergens, noAllergens, timeAvail, skill }))
      .catch(() => undefined);
  }, [page, baseDiet, allergens, noAllergens, timeAvail, skill]);

  function go(next: number) {
    Animated.timing(slideX, {
      toValue: -next * W,
      duration: 400,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start();
    setPage(next);
  }

  const setDiet = (v: string) => {
    setBaseDiet(v);
    if (v === "vegan") setAllergens(prev => prev.filter(a => !ALLERGEN_OPTIONS.find(o => o.value === a && o.hideOnVegan)));
  };

  const toggleAllergen = (v: string) => {
    setNoAllergens(false);
    setAllergens(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v]);
  };

  const handleNone = () => setNoAllergens(n => { if (!n) setAllergens([]); return !n; });

  const canProceed = useMemo(() => [
    true,
    !!baseDiet,
    noAllergens || allergens.length > 0,
    !!timeAvail && !!skill,
    true,
  ], [baseDiet, allergens, noAllergens, timeAvail, skill]);

  async function handleFinish() {
    setSubmitError(null);
    const timeOpt  = TIME_OPTIONS.find(o => o.value === timeAvail);
    const skillOpt = SKILL_OPTIONS.find(o => o.value === skill);
    try {
      await saveOnboarding({
        dietaryRestrictions: baseDiet ? [baseDiet] : [],
        allergens: noAllergens ? [] : allergens,
        ...(skillOpt && { skillLevel: skillOpt.level }),
        ...(timeOpt  && { avgCookTimeMin: timeOpt.avgMin }),
      });
      await AsyncStorage.removeItem(DRAFT_KEY);
      // Navigator auto-transitions when hasProfile becomes true
    } catch {
      setSubmitError("Não foi possível salvar. Tente novamente.");
    }
  }

  const TOTAL = 3;
  const stepMeta = [
    { kicker: "Passo 1 — Preferência base", title: "Qual sua preferência alimentar?", subtitle: "Isso define os ingredientes-base que a Suliv vai sugerir para você." },
    { kicker: "Passo 2 — Alergias", title: "Tem alguma alergia ou restrição?", subtitle: "Selecione tudo que se aplica. Vamos evitar esses ingredientes nas receitas." },
    { kicker: "Passo 3 — Rotina", title: "Como é seu dia na cozinha?", subtitle: "A Suliv usa isso pra calibrar o tempo e a complexidade das receitas." },
  ];

  return (
    <View style={{ flex: 1, overflow: "hidden", backgroundColor: O.sand100 }}>
      <Animated.View style={{ flexDirection: "row", width: W * PAGE_COUNT, flex: 1, transform: [{ translateX: slideX }] }}>
        {/* Page 0 — Welcome */}
        <View style={{ width: W, flex: 1 }}>
          <WelcomeContent onStart={() => go(1)} topPad={insets.top} botPad={insets.bottom} />
        </View>

        {/* Pages 1–3 — Steps */}
        {stepMeta.map((meta, i) => {
          const p = i + 1;
          return (
            <View key={p} style={{ width: W, flex: 1 }}>
              <View style={{ height: insets.top + 12 }} />
              <StepProgressBar step={p - 1} total={TOTAL} onBack={() => go(p - 1)} />
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
                <StepHeader kicker={meta.kicker} title={meta.title} subtitle={meta.subtitle} />
                {p === 1 && <Step0 value={baseDiet} onChange={setDiet} />}
                {p === 2 && <Step1 baseDiet={baseDiet} values={allergens} onToggle={toggleAllergen} none={noAllergens} onNone={handleNone} />}
                {p === 3 && <Step2 time={timeAvail} onTime={setTimeAvail} skill={skill} onSkill={setSkill} />}
                <View style={{ height: 12 }} />
              </ScrollView>
              <BottomCTA
                label={p === 3 ? "Finalizar" : "Continuar"}
                onPress={() => go(p + 1)}
                disabled={!canProceed[p]}
              />
              <View style={{ height: insets.bottom }} />
            </View>
          );
        })}

        {/* Page 4 — Done */}
        <View style={{ width: W, flex: 1 }}>
          <DoneContent
            onFinish={handleFinish}
            isLoading={isLoading}
            error={submitError}
            topPad={insets.top}
            botPad={insets.bottom}
          />
        </View>
      </Animated.View>
    </View>
  );
}
