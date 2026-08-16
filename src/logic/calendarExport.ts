function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** yyyy-mm-dd + uur/minuut -> lokale (floating) ICS-tijdstempel, zonder tijdzone. */
function toIcsLocal(dateIso: string, hour: number, minute: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hour)}${pad(minute)}00`;
}

function icsTimestampUtcNow(): string {
  const now = new Date();
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export interface IcsAssignment {
  name: string;
  item: string;
}

export function buildEventIcs({
  eventId,
  groupName,
  date,
  theme,
  assignments,
}: {
  eventId: string;
  groupName: string;
  date: string; // yyyy-mm-dd
  theme?: string;
  assignments: IcsAssignment[];
}): string {
  const dtStart = toIcsLocal(date, 18, 0);
  const dtEnd = toIcsLocal(date, 21, 0);

  const descriptionLines: string[] = [];
  if (theme) descriptionLines.push(`Thema: ${theme}`);
  if (assignments.length > 0) {
    descriptionLines.push('');
    descriptionLines.push('Wie doet wat:');
    assignments.forEach((a) => descriptionLines.push(`${a.name}: ${a.item}`));
  }

  const summary = escapeIcsText(`Kookavond: ${groupName}${theme ? ` — ${theme}` : ''}`);
  const description = escapeIcsText(descriptionLines.join('\n'));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kookavond//NL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${eventId}@kookavond.app`,
    `DTSTAMP:${icsTimestampUtcNow()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
