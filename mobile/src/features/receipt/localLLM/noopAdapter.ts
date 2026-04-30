import { LocalLLMAdapter } from './adapter';
import { ParsedReceipt } from '../schema';

/**
 * Placeholder adapter. Returns null so the pipeline falls back to OCR + rules.
 * Replace with Gemma 4 LiteRT-LM native module when available.
 */
export const noopAdapter: LocalLLMAdapter = {
  name: 'noop',

  async isAvailable(): Promise<boolean> {
    return false;
  },

  async parse(
    _imageUri: string,
    _ocrText: string,
  ): Promise<ParsedReceipt | null> {
    return null;
  },
};
