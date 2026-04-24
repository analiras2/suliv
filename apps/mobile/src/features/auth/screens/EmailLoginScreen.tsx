import {
  Platform,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { tokens } from "@suliv/design-system";
import { useAuthStore } from "../store/authStore";
import { AuthInput } from "../components/AuthInput";
import { Button } from "../../../components/atoms/Button";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../../navigation/types";
import { AuthError, ValidationError } from "../../../services/authApi";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailLogin">;

export function EmailLoginScreen({ navigation }: Props) {
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
      } else if (err instanceof ValidationError) {
        setError("Preencha e-mail e senha corretamente");
      } else {
        setError("Não foi possível conectar. Tente novamente.");
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
        <Text style={styles.title}>Bem-vinda de volta</Text>
        <Text style={styles.subtitle}>Entre na sua conta Suliv</Text>

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

        <Button
          label="Entrar"
          variant="primary"
          loading={isLoading}
          onPress={handleLogin}
          fullWidth
          accessibilityLabel="Entrar"
          style={styles.submitBtn}
        />

        <Button
          label="Voltar"
          variant="text"
          onPress={() => navigation.goBack()}
          fullWidth
          accessibilityLabel="Voltar"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tokens.color.semantic.surface.subtle },
  container: {
    flexGrow: 1,
    padding: tokens.space.xl,
    justifyContent: "center",
    gap: tokens.space.lg,
  },
  title: {
    ...tokens.typography.scale.title.lg,
    color: tokens.color.semantic.text.primary,
  },
  subtitle: {
    ...tokens.typography.scale.body.md,
    color: tokens.color.semantic.text.secondary,
    marginTop: -tokens.space.sm,
  },
  errorText: {
    ...tokens.typography.scale.body.sm,
    color: tokens.color.semantic.feedback.error,
    textAlign: "center",
  },
  submitBtn: {
    borderRadius: tokens.radius.pill,
  },
});
