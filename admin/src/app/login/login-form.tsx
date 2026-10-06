'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api-error';
import { apiErrorFromResponse } from '@/lib/api-response-error';
import { getErrorMessage, getFieldErrors } from '@/lib/error-messages';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const failure = await apiErrorFromResponse(response);
        setFieldErrors(getFieldErrors(failure));
        setError(getErrorMessage(failure));
        return;
      }

      router.push('/recipes');
      router.refresh();
    } catch {
      setError(getErrorMessage(new ApiError('NETWORK_UNAVAILABLE', null)));
    } finally {
      setIsSubmitting(false);
    }
  }

  // noValidate: the API owns validation, so its field messages (in Portuguese) are what the moderator sees.
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email && <p data-testid="email-error">{fieldErrors.email}</p>}
      </div>
      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fieldErrors.password)}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {fieldErrors.password && <p data-testid="password-error">{fieldErrors.password}</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
