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
import { useAuthStore } from "../store/authStore";
import { AuthInput } from "../components/AuthInput";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types";
import { AuthError } from "../../../services/authApi";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

function validatePassword(value: string): string | null {
  if (value.length < 8 || !/\d/.test(value)) {
    return "Senha deve ter 8+ caracteres e ao menos um número";
  }
  return null;
}

export function RegisterScreen({ navigation }: Props) {
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  function handlePasswordBlur() {
    if (password) {
      setPasswordError(validatePassword(password));
    }
  }

  function handleConfirmPasswordBlur() {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError("Senhas não coincidem");
    } else {
      setConfirmPasswordError(null);
    }
  }

  function validate(): boolean {
    let valid = true;

    const pwdErr = validatePassword(password);
    setPasswordError(pwdErr);
    if (pwdErr) valid = false;

    if (confirmPassword !== password) {
      setConfirmPasswordError("Senhas não coincidem");
      valid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return valid;
  }

  async function handleRegister() {
    setGlobalError(null);
    setEmailTaken(false);

    if (!validate()) return;

    try {
      await register(email, password, name.trim() || undefined);
      // Navigation happens automatically via authStore isAuthenticated
    } catch (err) {
      if (err instanceof AuthError && err.code === "email_taken") {
        setEmailTaken(true);
      } else {
        setGlobalError("Não foi possível criar a conta. Tente novamente.");
      }
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
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Junte-se ao Suliv</Text>

        <View style={styles.form}>
          <AuthInput
            label="Nome (opcional)"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            autoComplete="name"
            textContentType="name"
            accessibilityLabel="Campo de nome"
          />

          <AuthInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Campo de e-mail"
          />

          <AuthInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            isPassword
            textContentType="newPassword"
            placeholder="Mínimo 8 caracteres e um número"
            accessibilityLabel="Campo de senha"
            error={passwordError ?? undefined}
            onBlur={handlePasswordBlur}
          />

          <AuthInput
            label="Confirmar senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            textContentType="newPassword"
            placeholder="Repita sua senha"
            accessibilityLabel="Campo de confirmação de senha"
            error={confirmPasswordError ?? undefined}
            onBlur={handleConfirmPasswordBlur}
            onSubmitEditing={handleRegister}
            returnKeyType="done"
          />

          {emailTaken ? (
            <View style={styles.emailTakenContainer}>
              <Text style={styles.errorText}>E-mail já cadastrado. </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                accessibilityLabel="Ir para tela de login"
                accessibilityRole="button"
              >
                <Text style={styles.errorLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {globalError ? (
            <Text style={styles.errorText}>{globalError}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={tokens.colors.surface} />
            ) : (
              <Text style={styles.btnPrimaryText}>Criar conta</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          accessibilityLabel="Ir para login"
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            Já tenho conta?{" "}
            <Text style={styles.linkHighlight}>Entrar</Text>
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
  emailTakenContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
    textAlign: "center",
  },
  errorLink: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.error,
    fontWeight: tokens.typography.fontWeights.semibold,
    textDecorationLine: "underline",
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
