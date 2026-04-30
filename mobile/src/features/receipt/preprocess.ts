import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_LONG_EDGE = 1024;
const JPEG_QUALITY = 0.85;

export async function preprocessReceiptImage(
  imageUri: string,
): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    if (!info.exists) return imageUri;

    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_LONG_EDGE } }],
      { compress: JPEG_QUALITY, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return imageUri;
  }
}
