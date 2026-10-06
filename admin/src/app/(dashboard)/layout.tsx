import { AdminNav } from './admin-nav';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-content">{children}</div>
    </div>
  );
}
