import type { Metadata } from 'next';
import { Fraunces, Inter_Tight } from 'next/font/google';
import { QueryProvider } from '@/components/query-provider';
import './globals.css';

// Same families as the app (app/src/design-system/fonts.ts).
const displayFont = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });
const sansFont = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' });

export const metadata: Metadata = {
  title: 'Suliv Admin',
  description: 'Painel de moderação do app de receitas Suliv',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${sansFont.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
