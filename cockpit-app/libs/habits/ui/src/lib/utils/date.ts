/** Local-date helpers. Never use toISOString() (UTC) for day keys. */

export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

/** Mon–Sun week containing `key`. */
export function weekOf(key: string): string[] {
  const d = parseDateKey(key);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(key, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
