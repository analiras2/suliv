import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { tokens } from "@suliv/design-system";
import { AntDesign } from "@expo/vector-icons";
import { useAuthStore } from "../store/authStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types";
import { Logo } from "@/src/components/atoms/Logo";
import { signInWithGoogle } from "../../../services/socialAuth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    try {
      const idToken = await signInWithGoogle();
      await useAuthStore.getState().socialLogin("google", idToken);
    } catch (err: any) {
      if (err.code !== "SIGN_IN_CANCELLED") {
        setError("Falha no login com Google. Tente novamente.");
      }
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Logo width={300} height={100}/>
        </View>
      </View>

      <Text style={styles.tagline}>
        começar pode ser{" "}
        <Text style={styles.taglineAccent}>simples</Text>
        {"."}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate("EmailLogin")}
          activeOpacity={0.85}
          accessibilityLabel="Entrar com email"
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>Entrar com email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSocial}
          onPress={handleGoogleLogin}
          activeOpacity={0.85}
          accessibilityLabel="Continuar com Google"
          accessibilityRole="button"
        >
          <AntDesign name="google" size={20} color="#4285F4" style={styles.socialIcon} />
          <Text style={styles.btnSocialText}>Continuar com Google</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          accessibilityLabel="Criar uma conta agora"
          accessibilityRole="link"
        >
          <Text style={styles.registerText}>
            Novo por aqui?{" "}
            <Text style={styles.registerLink}>Criar uma conta agora</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          {"Ao continuar, você aceita nossos "}
          <Text style={styles.legalLink}>termos</Text>
          {" e a "}
          <Text style={styles.legalLink}>política de privacidade</Text>
          {"."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: tokens.color.semantic.surface.subtle,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: tokens.space.xl,
    paddingTop: tokens.space["4xl"],
    paddingBottom: tokens.space["2xl"],
    gap: tokens.space["2xl"],
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: tokens.color.primitive.sand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  logoWordmark: {
    fontSize: 52,
    fontWeight: tokens.typography.weight.bold,
    fontStyle: "italic",
    color: tokens.color.semantic.text.primary,
    letterSpacing: -1,
  },
  tagline: {
      fontFamily: tokens.typography.family.displayMedium,
      fontSize: 26,
      lineHeight: 29,
      fontWeight: "500",
      letterSpacing: -0.45,
      color: tokens.color.primitive.ink[900],
    },
  taglineAccent: {
      fontFamily: tokens.typography.family.editorialItalic,
      fontStyle: "italic",
      color: tokens.color.primitive.moss[700],
    },
  actions: {
    width: "100%",
    gap: tokens.space.md,
  },
  btnPrimary: {
    height: 56,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.semantic.brand.primaryStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    ...tokens.typography.scale.label.lg,
    color: tokens.color.semantic.text.inverse,
  },
  btnSocial: {
    height: 56,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.semantic.surface.elevated,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...tokens.elevation.sm,
  },
  socialIcon: {
    marginRight: tokens.space.sm,
  },
  btnSocialText: {
    ...tokens.typography.scale.label.lg,
    color: tokens.color.semantic.text.primary,
  },
  errorText: {
    ...tokens.typography.scale.body.sm,
    color: tokens.color.semantic.feedback.error,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    gap: tokens.space.md,
  },
  registerText: {
    ...tokens.typography.scale.body.sm,
    color: tokens.color.semantic.text.secondary,
    textAlign: "center",
  },
  registerLink: {
    color: tokens.color.semantic.text.primary,
    fontWeight: tokens.typography.weight.semibold,
    textDecorationLine: "underline",
  },
  legalText: {
    ...tokens.typography.scale.caption.md,
    color: tokens.color.semantic.text.secondary,
    textAlign: "center",
  },
  legalLink: {
    textDecorationLine: "underline",
    color: tokens.color.semantic.text.secondary,
  },
});
