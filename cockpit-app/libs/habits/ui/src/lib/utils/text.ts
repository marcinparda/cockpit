export function truncateName(name: string, maxLength = 50): string {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}…`;
}
