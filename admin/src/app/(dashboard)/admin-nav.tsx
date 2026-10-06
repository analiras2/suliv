'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  { href: '/recipes', label: 'Receitas' },
  { href: '/reports', label: 'Denúncias' },
  { href: '/allergens', label: 'Alérgenos' },
  { href: '/boosts', label: 'Destaques' },
  { href: '/feature-flags', label: 'Flags de funcionalidade' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel" className="admin-nav">
      <p className="admin-nav-brand">Suliv Admin</p>
      <ul>
        {NAV_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              aria-current={pathname.startsWith(section.href) ? 'page' : undefined}
            >
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
