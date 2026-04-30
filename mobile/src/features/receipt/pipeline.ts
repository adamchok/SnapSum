import { ParsedReceiptSchema, PipelineResult } from './schema';
import { preprocessReceiptImage } from './preprocess';
import { extractReceiptText } from './ocr';
import { extractFromOCRText } from './extract';
import { noopAdapter, LocalLLMAdapter } from './localLLM';
import { withNetworkGuard } from './networkGuard';
import { toISODate } from '../../lib/date';

let llmAdapter: LocalLLMAdapter = noopAdapter;

export function setLLMAdapter(adapter: LocalLLMAdapter) {
  llmAdapter = adapter;
}

const TIMEOUT_MS = 3000;

export async function parseReceiptPipeline(
  imageUri: string,
): Promise<PipelineResult> {
  return withNetworkGuard(async () => {
    const processedUri = await preprocessReceiptImage(imageUri);

    const ocrResult = await extractReceiptText(processedUri);

    const llmAvailable = await llmAdapter.isAvailable();

    const [extractResult, llmResult] = await Promise.all([
      extractFromOCRText(ocrResult.text),
      llmAvailable
        ? withTimeout(llmAdapter.parse(processedUri, ocrResult.text), TIMEOUT_MS)
        : Promise.resolve(null),
    ]);

    if (llmResult) {
      const validated = ParsedReceiptSchema.safeParse(llmResult);
      if (validated.success) {
        return {
          parsed: validated.data,
          source: 'llm' as const,
          ocrEngine: ocrResult.engine,
          ocrTextLength: ocrResult.text.length,
        };
      }
    }

    const validated = ParsedReceiptSchema.safeParse(extractResult);
    if (validated.success) {
      return {
        parsed: validated.data,
        source: 'ocr+rules' as const,
        ocrEngine: ocrResult.engine,
        ocrTextLength: ocrResult.text.length,
      };
    }

    return {
      parsed: {
        merchant: null,
        amount_total: null,
        currency: 'MYR',
        date: toISODate(new Date()),
        line_items: [],
        suggested_category: null,
        confidence: { merchant: 0, amount_total: 0, date: 0 },
      },
      source: 'manual' as const,
      ocrEngine: ocrResult.engine,
      ocrTextLength: ocrResult.text.length,
    };
  });
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}
