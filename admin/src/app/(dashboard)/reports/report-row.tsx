'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRecipeDetail, resolveReport } from '@/lib/api-client';
import type { Report } from '@/lib/types';

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
    <li>
      <p>
        Report on {report.targetType} ({report.targetId}) — reason: {report.reason}
      </p>
      {report.freeText && <p>{report.freeText}</p>}
      {report.targetType === 'recipe' && recipe && <p>Target recipe: {recipe.title}</p>}
      {report.targetType === 'comment' && <p>Target comment id: {report.targetId}</p>}

      <button
        type="button"
        onClick={() => resolveMutation.mutate('dismiss')}
        disabled={resolveMutation.isPending}
      >
        Descartar
      </button>
      {report.targetType === 'comment' && (
        <button
          type="button"
          onClick={() => resolveMutation.mutate('hide_content')}
          disabled={resolveMutation.isPending}
        >
          Ocultar conteúdo
        </button>
      )}
      {report.targetType === 'recipe' && (
        <button
          type="button"
          onClick={() => resolveMutation.mutate('reopen_recipe')}
          disabled={resolveMutation.isPending}
        >
          Reabrir receita
        </button>
      )}
    </li>
  );
}
