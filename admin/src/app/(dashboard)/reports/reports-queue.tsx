'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '@/lib/api-client';
import { ReportRow } from './report-row';

export function ReportsQueue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => fetchReports('pending'),
  });

  if (isLoading) return <p>Carregando…</p>;
  if (isError) return <p role="alert">Não foi possível carregar as denúncias.</p>;

  return (
    <>
      <ul className="card-list">
        {data?.items.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
      </ul>
      {data && data.items.length === 0 && <p className="empty-state">Nenhuma denúncia pendente.</p>}
    </>
  );
}
