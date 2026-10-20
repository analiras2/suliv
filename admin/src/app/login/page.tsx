import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar — Suliv Admin',
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Suliv Admin</h1>
        <LoginForm />
      </div>
    </main>
  );
}
