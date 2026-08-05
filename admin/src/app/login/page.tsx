import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in — Suliv Admin',
};

export default function LoginPage() {
  return (
    <main>
      <h1>Suliv Admin</h1>
      <LoginForm />
    </main>
  );
}
