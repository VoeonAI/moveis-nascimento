export function normalizeBrazilPhone(input: unknown): string {
  const digits = String(input ?? '').replace(/\D/g, '');

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  return digits;
}
