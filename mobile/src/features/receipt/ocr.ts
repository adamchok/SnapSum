import { Platform } from 'react-native';
import TextRecognition, {
  TextRecognitionScript,
} from '@react-native-ml-kit/text-recognition';

export type OCRResult = {
  text: string;
  engine: 'mlkit' | 'fallback';
};

export async function extractReceiptText(imageUri: string): Promise<OCRResult> {
  if (Platform.OS === 'web') {
    return { text: '', engine: 'fallback' };
  }

  try {
    const result = await TextRecognition.recognize(imageUri, TextRecognitionScript.LATIN);
    return {
      text: normalizeOCRText(result.text),
      engine: 'mlkit',
    };
  } catch {
    // This can happen in Expo Go or when native OCR module isn't linked.
    return { text: '', engine: 'fallback' };
  }
}

function normalizeOCRText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}
