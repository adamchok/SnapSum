import { getPref, setPref, deletePref } from './repository';

const MODEL_NAME = 'lfm2.5-vl-1.6b-quantized';

export async function isModelDownloaded(): Promise<boolean> {
  const val = await getPref('llm_model_downloaded');
  return val === 'true';
}

export async function markModelDownloaded(): Promise<void> {
  await setPref('llm_model_downloaded', 'true');
  await setPref('llm_model_name', MODEL_NAME);
}

export async function markModelRemoved(): Promise<void> {
  await deletePref('llm_model_downloaded');
  await deletePref('llm_model_name');
  await deletePref('llm_last_used_at');
}

export async function recordModelUsed(): Promise<void> {
  await setPref('llm_last_used_at', Date.now().toString());
}

export async function getModelName(): Promise<string> {
  return (await getPref('llm_model_name')) ?? MODEL_NAME;
}
