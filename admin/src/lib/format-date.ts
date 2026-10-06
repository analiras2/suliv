const DATE_LOCALE = 'pt-BR';

const dateTimeFormat = new Intl.DateTimeFormat(DATE_LOCALE, {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateTimeFormat.format(date);
}
