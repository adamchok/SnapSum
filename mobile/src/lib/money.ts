export function formatMinorToCurrency(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function parseAmountToMinor(amountText: string): number | null {
  const numeric = amountText.replace(/[^\d.,-]/g, '');
  const normalized = numeric.includes('.') && numeric.includes(',')
    ? numeric.replace(/,/g, '')
    : numeric.replace(',', '.');
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}
