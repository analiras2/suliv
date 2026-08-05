'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '@/lib/api-client';
import { ReportRow } from './report-row';

export function ReportsQueue() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => fetchReports('pending'),
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p role="alert">Failed to load reports.</p>;

  return (
    <ul>
      {data?.items.map((report) => (
        <ReportRow key={report.id} report={report} />
      ))}
      {data && data.items.length === 0 && <p>No pending reports.</p>}
    </ul>
  );
}
