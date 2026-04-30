import { BudgetEnvelope, BudgetEnvelopeStatus } from './types';

export function buildEnvelopeStatuses(
  envelopes: BudgetEnvelope[],
  spendByCategoryName: Map<string, number>,
): BudgetEnvelopeStatus[] {
  return envelopes.map((envelope) => {
    const spentMinor = spendByCategoryName.get(envelope.categoryName) ?? 0;
    const usagePct =
      envelope.limitMinor > 0
        ? Math.round((spentMinor / envelope.limitMinor) * 100)
        : 0;
    const remainingMinor = envelope.limitMinor - spentMinor;

    return {
      envelope,
      spentMinor,
      remainingMinor,
      usagePct,
      isWarning: usagePct >= 90 && usagePct <= 100,
      isOver: usagePct > 100,
    };
  });
}
