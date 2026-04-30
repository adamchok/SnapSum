import { LocalLLMAdapter } from './adapter';
import { ParsedReceipt, ParsedReceiptSchema } from '../schema';
import { runtime } from './runtime';
import { extractJsonObject } from './prompts';

export const executorchAdapter: LocalLLMAdapter = {
  name: 'executorch-lfm2-vl',

  async isAvailable(): Promise<boolean> {
    return runtime.state === 'ready' && runtime.llm !== null;
  },

  async parse(
    imageUri: string,
    ocrText: string,
  ): Promise<ParsedReceipt | null> {
    const llm = runtime.llm;
    if (!llm) return null;

    const ocrHint =
      ocrText.length > 0
        ? `\nOCR text (may have errors): ${ocrText.slice(0, 500)}`
        : '';

    const userMessage = `Parse this receipt image and return the JSON.${ocrHint}`;

    try {
      const messages = await llm.sendMessage(userMessage, {
        imagePath: imageUri,
      });

      const assistantMsg = messages.find((m) => m.role === 'assistant');
      if (!assistantMsg) return null;

      const parsed = extractJsonObject(assistantMsg.content);
      if (!parsed) return null;

      const validated = ParsedReceiptSchema.safeParse(parsed);
      return validated.success ? validated.data : null;
    } catch {
      return null;
    }
  },
};
