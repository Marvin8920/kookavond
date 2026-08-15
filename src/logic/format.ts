const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** yyyy-mm-dd -> "donderdag 21 augustus" */
export function formatDateNl(iso: string, opts?: { withWeekday?: boolean }): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = WEEKDAYS[date.getDay()];
  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return opts?.withWeekday === false ? label : `${weekday} ${label}`;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
