import { z } from 'zod';

export const LineItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
});

export const ConfidenceSchema = z.object({
  merchant: z.number().min(0).max(1),
  amount_total: z.number().min(0).max(1),
  date: z.number().min(0).max(1),
});

export const ParsedReceiptSchema = z.object({
  merchant: z.string().nullable(),
  amount_total: z.number().nullable(),
  currency: z.string().length(3).nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  line_items: z.array(LineItemSchema),
  suggested_category: z.string().nullable(),
  confidence: ConfidenceSchema,
});

export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;

export type PipelineResult = {
  parsed: ParsedReceipt;
  source: 'llm' | 'ocr+rules' | 'manual';
  ocrEngine: 'mlkit' | 'fallback';
  ocrTextLength: number;
};
