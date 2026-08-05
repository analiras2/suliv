import { ADJUSTMENT_REASON_LABELS, type AdjustmentReason } from '@/lib/types';

const REASON_OPTIONS = Object.keys(ADJUSTMENT_REASON_LABELS) as AdjustmentReason[];

interface AdjustmentReasonPickerProps {
  value: AdjustmentReason | '';
  onChange: (reason: AdjustmentReason | '') => void;
}

export function AdjustmentReasonPicker({ value, onChange }: AdjustmentReasonPickerProps) {
  return (
    <select
      aria-label="Adjustment reason"
      value={value}
      onChange={(event) => onChange(event.target.value as AdjustmentReason | '')}
    >
      <option value="">Select a reason</option>
      {REASON_OPTIONS.map((reason) => (
        <option key={reason} value={reason}>
          {ADJUSTMENT_REASON_LABELS[reason]}
        </option>
      ))}
    </select>
  );
}
