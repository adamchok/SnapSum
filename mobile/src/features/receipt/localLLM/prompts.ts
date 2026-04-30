export const SYSTEM_PROMPT = `You are a receipt parser. Given an image of a receipt, return ONLY a JSON object with this exact schema (no prose, no markdown fences):
{
  "merchant": string,
  "amount_total": number,
  "currency": string,
  "date": string,
  "line_items": [{ "description": string, "amount": number }],
  "suggested_category": string,
  "confidence": { "merchant": 0-1, "amount_total": 0-1, "date": 0-1 }
}
If a field cannot be read, set it to null and confidence 0.`;

/**
 * Extracts the first JSON object from model output that may be wrapped in
 * prose, markdown code fences, or other artifacts.
 */
export function extractJsonObject(text: string): unknown | null {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const braceStart = cleaned.indexOf('{');
  if (braceStart === -1) return null;

  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) return null;

  const jsonStr = cleaned.slice(braceStart, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return tryRepairJson(jsonStr);
  }
}

function tryRepairJson(raw: string): unknown | null {
  let repaired = raw
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}
