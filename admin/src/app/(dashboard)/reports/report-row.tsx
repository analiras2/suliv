'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRecipeDetail, resolveReport } from '@/lib/api-client';
import { REPORT_REASON_LABELS, REPORT_TARGET_LABELS, type Report } from '@/lib/types';

interface ReportRowProps {
  report: Report;
}

export function ReportRow({ report }: ReportRowProps) {
  const queryClient = useQueryClient();

  const { data: recipe } = useQuery({
    queryKey: ['admin-recipe', report.targetId],
    queryFn: () => fetchRecipeDetail(report.targetId),
    enabled: report.targetType === 'recipe',
  });

  const resolveMutation = useMutation({
    mutationFn: (action: 'dismiss' | 'hide_content' | 'reopen_recipe') => resolveReport(report.id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  return (
    <li className="card">
      <div className="card-header">
        <strong>{REPORT_REASON_LABELS[report.reason]}</strong>
        <span className="badge badge-warning">{REPORT_TARGET_LABELS[report.targetType]}</span>
      </div>

      <div className="card-body">
        {report.freeText && <p>{report.freeText}</p>}
        {report.targetType === 'recipe' && recipe && <p>Receita denunciada: {recipe.title}</p>}
        {report.targetType === 'comment' && <p>Comentário denunciado</p>}
        <p className="muted">ID: {report.targetId}</p>
      </div>

      <div className="row-actions">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => resolveMutation.mutate('dismiss')}
          disabled={resolveMutation.isPending}
        >
          Descartar
        </button>
        {report.targetType === 'comment' && (
          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => resolveMutation.mutate('hide_content')}
            disabled={resolveMutation.isPending}
          >
            Ocultar conteúdo
          </button>
        )}
        {report.targetType === 'recipe' && (
          <button
            type="button"
            className="btn-sm"
            onClick={() => resolveMutation.mutate('reopen_recipe')}
            disabled={resolveMutation.isPending}
          >
            Reabrir receita
          </button>
        )}
      </div>
    </li>
  );
}
