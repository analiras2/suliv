import { ADJUSTMENT_REASON_LABELS, type AdjustmentReason } from '@/lib/types';

const REASON_OPTIONS = Object.keys(ADJUSTMENT_REASON_LABELS) as AdjustmentReason[];

interface AdjustmentReasonPickerProps {
  value: AdjustmentReason | '';
  onChange: (reason: AdjustmentReason | '') => void;
}

export function AdjustmentReasonPicker({ value, onChange }: AdjustmentReasonPickerProps) {
  return (
    <select
      aria-label="Motivo do ajuste"
      value={value}
      onChange={(event) => onChange(event.target.value as AdjustmentReason | '')}
    >
      <option value="">Selecione um motivo</option>
      {REASON_OPTIONS.map((reason) => (
        <option key={reason} value={reason}>
          {ADJUSTMENT_REASON_LABELS[reason]}
        </option>
      ))}
    </select>
  );
}
