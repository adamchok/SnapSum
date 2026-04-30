import { ParsedReceipt } from '../schema';

export interface LocalLLMAdapter {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  parse(imageUri: string, ocrText: string): Promise<ParsedReceipt | null>;
}
