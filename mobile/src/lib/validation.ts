const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidCurrencyCode(value: string): boolean {
  return CURRENCY_REGEX.test(value);
}

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
