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
import { useState } from "react";
import { tokens } from "@suliv/design-system";
import { useAuthStore } from "../store/authStore.js";
import { AuthInput } from "../components/AuthInput.js";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types.js";
import { AuthError } from "../../../services/authApi.js";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof AuthError && err.code === "invalid_credentials") {
        setError("E-mail ou senha incorretos");
      } else if (err instanceof AuthError && err.code === "validation_error") {
        setError("Preencha e-mail e senha corretamente");
      } else {
        setError("Não foi possível conectar. Tente novamente.");
      }
    }
  }

  async function handleGoogleLogin() {
    try {
      // Dynamic import — lib installed when Google Sign-In native setup is added
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { GoogleSignin } = (await import("@react-native-google-signin/google-signin" as any)) as any;
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken as string | undefined;
      if (!idToken) throw new Error("no_id_token");
      await useAuthStore.getState().socialLogin("google", idToken);
    } catch (err) {
      setError("Falha no login com Google. Tente novamente.");
    }
  }

  async function handleAppleLogin() {
    try {
      // Dynamic import — lib installed when Apple Sign-In native setup is added
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appleAuth = (await import("@invertase/react-native-apple-authentication" as any)) as any;
      const appleAuthResponse = await appleAuth.default.performRequest({
        requestedOperation: appleAuth.AppleAuthRequestOperation.LOGIN,
        requestedScopes: [
          appleAuth.AppleAuthRequestScope.EMAIL,
          appleAuth.AppleAuthRequestScope.FULL_NAME,
        ],
      });
      const identityToken = appleAuthResponse.identityToken as string | undefined;
      if (!identityToken) throw new Error("no_identity_token");
      await useAuthStore.getState().socialLogin("apple", identityToken);
    } catch (err) {
      setError("Falha no login com Apple. Tente novamente.");
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
        <Text style={styles.title}>Bem-vinda de volta</Text>
        <Text style={styles.subtitle}>Entre na sua conta Suliv</Text>

        <View style={styles.form}>
          <AuthInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="seu@email.com"
            accessibilityLabel="Campo de e-mail"
          />
          <AuthInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            isPassword
            textContentType="password"
            placeholder="Sua senha"
            accessibilityLabel="Campo de senha"
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Entrar"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={tokens.colors.surface} />
            ) : (
              <Text style={styles.btnPrimaryText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
            accessibilityLabel="Entrar com Google"
            accessibilityRole="button"
          >
            <Text style={styles.btnOutlineText}>Entrar com Google</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.btn, styles.btnApple]}
              onPress={handleAppleLogin}
              disabled={isLoading}
              accessibilityLabel="Entrar com Apple"
              accessibilityRole="button"
            >
              <Text style={styles.btnAppleText}> Entrar com Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          accessibilityLabel="Criar conta"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            Não tem conta?{" "}
            <Text style={styles.linkHighlight}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tokens.colors.background },
  container: {
    flexGrow: 1,
    padding: tokens.spacing.xl,
    justifyContent: "center",
    gap: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
  },
  subtitle: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary + "99",
    marginTop: -tokens.spacing.lg,
  },
  form: { gap: tokens.spacing.lg },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
    textAlign: "center",
  },
  btn: {
    height: 52,
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
  btnOutline: {
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  btnOutlineText: {
    color: tokens.colors.primary,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
  },
  btnApple: { backgroundColor: "#000" },
  btnAppleText: {
    color: "#fff",
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
  },
  linkText: {
    textAlign: "center",
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "99",
  },
  linkHighlight: {
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.semibold,
  },
});
