import { toISODate } from '../../lib/date';
import { parseAmountToMinor } from '../../lib/money';
import { ParsedReceipt } from './schema';

export function extractFromOCRText(ocrText: string): ParsedReceipt {
  const lines = ocrText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return emptyResult();
  }

  const merchant = extractMerchant(lines);
  const total = extractTotalAmount(ocrText);
  const currency = detectCurrency(ocrText);
  const parsedDate = extractDate(ocrText);
  const category = detectCategory(ocrText, merchant);
  const lineItems = extractLineItems(lines);

  return {
    merchant: merchant !== 'Unknown Merchant' ? merchant : null,
    amount_total: total?.amountMinor ?? null,
    currency,
    date: parsedDate ?? toISODate(new Date()),
    line_items: lineItems,
    suggested_category: category,
    confidence: {
      merchant: merchant !== 'Unknown Merchant' ? 0.85 : 0.3,
      amount_total: total?.confidence ?? 0.3,
      date: parsedDate ? 0.86 : 0.4,
    },
  };
}

function emptyResult(): ParsedReceipt {
  return {
    merchant: null,
    amount_total: null,
    currency: 'MYR',
    date: toISODate(new Date()),
    line_items: [],
    suggested_category: null,
    confidence: { merchant: 0, amount_total: 0, date: 0 },
  };
}

function extractMerchant(lines: string[]): string {
  const skip =
    /(receipt|resit|tax|invoice|payment|table|cashier|terminal|subtotal|total|change|tendered|gst|sst)/i;
  const candidate = lines.find((line) => line.length >= 3 && !skip.test(line));
  return candidate ?? 'Unknown Merchant';
}

function extractTotalAmount(
  text: string,
): { amountMinor: number; confidence: number } | null {
  const priorityPattern =
    /(grand\s*total|total|jumlah|amount|amt|nett|nett?\s*total)[^\d]{0,12}([\d][\d,]*[.][\d]{2})/gi;

  let match: RegExpExecArray | null = null;
  let bestPriority: RegExpExecArray | null = null;

  while ((match = priorityPattern.exec(text)) !== null) {
    bestPriority = match;
  }

  if (bestPriority) {
    const amountMinor = parseAmountToMinor(bestPriority[2]);
    if (amountMinor !== null && amountMinor > 0) {
      return { amountMinor, confidence: 0.93 };
    }
  }

  const loosePattern = /([\d][\d,]*[.][\d]{2})/g;
  const allMatches = [...text.matchAll(loosePattern)];
  let highest = 0;

  for (const candidate of allMatches) {
    const amountMinor = parseAmountToMinor(candidate[1]) ?? 0;
    if (amountMinor > highest) {
      highest = amountMinor;
    }
  }

  if (highest > 0) {
    return { amountMinor: highest, confidence: 0.74 };
  }

  return null;
}

function detectCurrency(text: string): string {
  if (/(^|\s)(RM|MYR)(\s|$)/i.test(text)) return 'MYR';
  if (/(^|\s)(SGD|S\$)(\s|$)/i.test(text)) return 'SGD';
  if (/(^|\s)(IDR|Rp)(\s|$)/i.test(text)) return 'IDR';
  if (/(^|\s)(USD|US\$|\$)(\s|$)/i.test(text)) return 'USD';
  return 'MYR';
}

function extractDate(text: string): string | null {
  const dmy = text.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const candidate = `${year}-${month}-${day}`;
    if (isPlausibleDate(candidate)) return candidate;
  }

  const ymd = text.match(/(20\d{2})[/\-](\d{1,2})[/\-](\d{1,2})/);
  if (ymd) {
    const candidate = `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    if (isPlausibleDate(candidate)) return candidate;
  }

  return null;
}

function isPlausibleDate(isoDate: string): boolean {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === isoDate;
}

function detectCategory(text: string, merchant: string): string {
  const basis = `${merchant}\n${text}`.toLowerCase();

  const rules: Array<{ category: string; terms: string[] }> = [
    {
      category: 'Food & Drink',
      terms: [
        'starbucks', 'tealive', 'restaurant', 'cafe', 'coffee', 'kopitiam',
        'mamak', 'nasi', 'mcd', 'mcdonald', 'kfc', 'pizza', 'sushi',
      ],
    },
    {
      category: 'Groceries',
      terms: [
        'grocer', 'supermarket', 'mydin', 'tesco', 'lotus', 'aeon',
        'village grocer', 'cold storage', 'jaya grocer',
      ],
    },
    {
      category: 'Transport',
      terms: [
        'grab', 'petrol', 'shell', 'petronas', 'taxi', 'parking',
        'toll', 'lrt', 'mrt', 'rapid',
      ],
    },
    { category: 'Shopping', terms: ['store', 'mall', 'retail', 'uniqlo', 'h&m'] },
    { category: 'Health', terms: ['pharmacy', 'clinic', 'hospital', 'guardian', 'watsons'] },
    { category: 'Utilities', terms: ['tenaga', 'water', 'telco', 'celcom', 'digi', 'maxis'] },
  ];

  for (const rule of rules) {
    if (rule.terms.some((term) => basis.includes(term))) {
      return rule.category;
    }
  }

  return 'Miscellaneous';
}

function extractLineItems(
  lines: string[],
): Array<{ description: string; amount: number }> {
  const items: Array<{ description: string; amount: number }> = [];
  const pattern = /^(.+?)\s+([\d,]+\.\d{2})\s*$/;

  for (const line of lines) {
    const match = pattern.exec(line);
    if (match) {
      const desc = match[1].trim();
      const amt = parseAmountToMinor(match[2]);
      if (
        desc.length >= 2 &&
        amt !== null &&
        amt > 0 &&
        !/total|subtotal|tax|gst|sst|change|tendered/i.test(desc)
      ) {
        items.push({ description: desc, amount: amt });
      }
    }
  }

  return items;
}
