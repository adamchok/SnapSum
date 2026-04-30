// Default budget templates for quick setup.
// Budget envelopes are now persisted in SQLite; this file provides
// initial suggestions shown in the budget creation screen.

export const DEFAULT_ENVELOPE_SUGGESTIONS = [
  { categoryName: 'Food & Drink', suggestedMinor: 100_000 },
  { categoryName: 'Groceries', suggestedMinor: 50_000 },
  { categoryName: 'Transport', suggestedMinor: 50_000 },
  { categoryName: 'Shopping', suggestedMinor: 30_000 },
  { categoryName: 'Entertainment', suggestedMinor: 20_000 },
] as const;
