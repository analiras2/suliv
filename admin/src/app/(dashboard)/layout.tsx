import Link from 'next/link';

const NAV_SECTIONS = [
  { href: '/recipes', label: 'Recipes' },
  { href: '/reports', label: 'Reports' },
  { href: '/allergens', label: 'Allergens' },
  { href: '/boosts', label: 'Boosts' },
  { href: '/feature-flags', label: 'Feature flags' },
];

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav aria-label="Admin sections" style={{ width: 220, flexShrink: 0 }}>
        <ul>
          {NAV_SECTIONS.map((section) => (
            <li key={section.href}>
              <Link href={section.href}>{section.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
