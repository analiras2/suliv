"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@suliv/design-system";
import { loginAction } from "@/app/actions/auth";

type FieldErrors = Record<string, string[]>;

interface ActionError {
  error: string;
  details?: { fieldErrors?: FieldErrors; formErrors?: string[] };
}

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        await loginAction(email, password);
      } catch (err) {
        if (err instanceof Error) {
          // next/navigation redirect throws — re-throw it
          if (err.message === "NEXT_REDIRECT") throw err;

          try {
            const parsed: ActionError = JSON.parse(err.message);
            if (parsed.error === "invalid_credentials") {
              setGlobalError("E-mail ou senha incorretos");
            } else if (parsed.error === "validation_error") {
              setFieldErrors(parsed.details?.fieldErrors ?? {});
              if (parsed.details?.formErrors?.length) {
                setGlobalError(parsed.details.formErrors[0]);
              }
            } else {
              setGlobalError("Ocorreu um erro. Tente novamente.");
            }
          } catch {
            setGlobalError("Ocorreu um erro. Tente novamente.");
          }
        }
      }
    });
  }

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: "100vh",
      backgroundColor: tokens.colors.background,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: tokens.spacing.lg,
    },
    card: {
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing["2xl"],
      width: "100%",
      maxWidth: 400,
    },
    title: {
      fontSize: tokens.typography.fontSizes.xl,
      fontWeight: tokens.typography.fontWeights.bold,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xl,
      textAlign: "center",
    },
    label: {
      display: "block",
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      color: tokens.colors.textPrimary,
      marginBottom: tokens.spacing.xs,
    },
    input: {
      width: "100%",
      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
      borderRadius: tokens.borderRadius.sm,
      border: `1px solid #ccc`,
      fontSize: tokens.typography.fontSizes.md,
      color: tokens.colors.textPrimary,
      boxSizing: "border-box" as const,
      outline: "none",
    },
    inputError: {
      borderColor: tokens.colors.error,
    },
    fieldGroup: {
      marginBottom: tokens.spacing.lg,
    },
    passwordWrapper: {
      position: "relative" as const,
    },
    toggleBtn: {
      position: "absolute" as const,
      right: tokens.spacing.sm,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: tokens.colors.textPrimary,
      fontSize: tokens.typography.fontSizes.sm,
    },
    errorText: {
      color: tokens.colors.error,
      fontSize: tokens.typography.fontSizes.sm,
      marginTop: tokens.spacing.xs,
    },
    globalError: {
      backgroundColor: "#fdecea",
      color: tokens.colors.error,
      padding: tokens.spacing.sm,
      borderRadius: tokens.borderRadius.sm,
      marginBottom: tokens.spacing.lg,
      fontSize: tokens.typography.fontSizes.sm,
    },
    primaryBtn: {
      width: "100%",
      padding: `${tokens.spacing.md}px`,
      backgroundColor: tokens.colors.primary,
      color: tokens.colors.surface,
      border: "none",
      borderRadius: tokens.borderRadius.sm,
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.semibold,
      cursor: isPending ? "not-allowed" : "pointer",
      opacity: isPending ? 0.7 : 1,
      marginBottom: tokens.spacing.md,
    },
    secondaryBtn: {
      width: "100%",
      padding: `${tokens.spacing.md}px`,
      backgroundColor: tokens.colors.surface,
      color: tokens.colors.textPrimary,
      border: `1px solid #ccc`,
      borderRadius: tokens.borderRadius.sm,
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.medium,
      cursor: "pointer",
      marginBottom: tokens.spacing.md,
      textDecoration: "none",
      display: "block",
      textAlign: "center",
    },
    divider: {
      textAlign: "center" as const,
      color: "#999",
      fontSize: tokens.typography.fontSizes.sm,
      margin: `${tokens.spacing.md}px 0`,
    },
    link: {
      color: tokens.colors.primary,
      textDecoration: "none",
      fontWeight: tokens.typography.fontWeights.medium,
    },
    footerText: {
      textAlign: "center" as const,
      fontSize: tokens.typography.fontSizes.sm,
      color: tokens.colors.textPrimary,
      marginTop: tokens.spacing.lg,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Entrar</h1>

        {globalError && <div style={styles.globalError}>{globalError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              style={{
                ...styles.input,
                ...(fieldErrors.email ? styles.inputError : {}),
              }}
              disabled={isPending}
              required
            />
            {fieldErrors.email?.map((msg, i) => (
              <p key={i} style={styles.errorText}>
                {msg}
              </p>
            ))}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Senha
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                style={{
                  ...styles.input,
                  paddingRight: 60,
                  ...(fieldErrors.password ? styles.inputError : {}),
                }}
                disabled={isPending}
                required
              />
              <button
                type="button"
                style={styles.toggleBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {fieldErrors.password?.map((msg, i) => (
              <p key={i} style={styles.errorText}>
                {msg}
              </p>
            ))}
          </div>

          <button type="submit" style={styles.primaryBtn} disabled={isPending}>
            {isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div style={styles.divider}>ou</div>

        <a href="/api/auth/google" style={styles.secondaryBtn}>
          Entrar com Google
        </a>

        <p style={styles.footerText}>
          Não tem conta?{" "}
          <a href="/register" style={styles.link}>
            Criar conta
          </a>
        </p>
      </div>
    </div>
  );
}
