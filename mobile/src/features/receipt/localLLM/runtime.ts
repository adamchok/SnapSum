import { Platform } from 'react-native';
import { LLMModule, LFM2_5_VL_1_6B_QUANTIZED, initExecutorch } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
import { SYSTEM_PROMPT } from './prompts';

initExecutorch({ resourceFetcher: ExpoResourceFetcher });

export type RuntimeState =
  | 'idle'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error';

type StateListener = (state: RuntimeState) => void;

class LLMRuntime {
  private _state: RuntimeState = 'idle';
  private _llm: LLMModule | null = null;
  private _error: string | null = null;
  private _downloadProgress = 0;
  private _listeners = new Set<StateListener>();
  private _cancelRequested = false;

  get state(): RuntimeState {
    return this._state;
  }

  get error(): string | null {
    return this._error;
  }

  get downloadProgress(): number {
    return this._downloadProgress;
  }

  get llm(): LLMModule | null {
    return this._llm;
  }

  subscribe(listener: StateListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private setState(next: RuntimeState) {
    this._state = next;
    this._listeners.forEach((fn) => fn(next));
  }

  /**
   * Load from local cache only. If the model has already been downloaded
   * by react-native-executorch it will be cached on disk and this will
   * deserialize it. If not cached, we stay in idle (no network call).
   */
  async ensureLoaded(): Promise<void> {
    if (this._state === 'ready' || this._state === 'loading') return;
    if (Platform.OS !== 'android') return;

    this.setState('loading');
    try {
      this._llm = await LLMModule.fromModelName(LFM2_5_VL_1_6B_QUANTIZED);

      this._llm.configure({
        chatConfig: { systemPrompt: SYSTEM_PROMPT },
        generationConfig: {
          temperature: 0.05,
          repetitionPenalty: 1.0,
        },
      });

      this.setState('ready');
    } catch (e: unknown) {
      this._llm = null;
      this._error = e instanceof Error ? e.message : String(e);
      this.setState('idle');
    }
  }

  /**
   * Download model (network call). Runs in background — the caller doesn't
   * need to await. Only triggered by explicit user action (onboarding or
   * Settings), never inside withNetworkGuard.
   */
  async download(onProgress?: (progress: number) => void): Promise<void> {
    if (this._state === 'downloading' || this._state === 'ready') return;
    if (Platform.OS !== 'android') return;

    this.setState('downloading');
    this._downloadProgress = 0;
    this._error = null;
    this._cancelRequested = false;

    try {
      this._llm = await LLMModule.fromModelName(
        LFM2_5_VL_1_6B_QUANTIZED,
        (progress) => {
          this._downloadProgress = progress;
          onProgress?.(progress);
          this._listeners.forEach((fn) => fn(this._state));
        },
      );

      if (this._cancelRequested) {
        this._llm.delete();
        this._llm = null;
        this.setState('idle');
        return;
      }

      this._llm.configure({
        chatConfig: { systemPrompt: SYSTEM_PROMPT },
        generationConfig: {
          temperature: 0.05,
          repetitionPenalty: 1.0,
        },
      });

      this.setState('ready');
    } catch (e: unknown) {
      if (this._cancelRequested) {
        this._cancelRequested = false;
        this.setState('idle');
        return;
      }
      this._llm = null;
      this._error = e instanceof Error ? e.message : String(e);
      this.setState('error');
    }
  }

  /**
   * Cancel an in-progress download. Safe to call even if not downloading.
   * Sets the cancel flag so the download() catch block silently transitions
   * to idle instead of surfacing an error.
   */
  async cancelDownload(): Promise<void> {
    if (this._state !== 'downloading') return;

    this._cancelRequested = true;
    this._downloadProgress = 0;
    this._error = null;
    this.setState('idle');

    try {
      await ExpoResourceFetcher.cancelFetching(
        LFM2_5_VL_1_6B_QUANTIZED.modelSource,
        LFM2_5_VL_1_6B_QUANTIZED.tokenizerSource,
        LFM2_5_VL_1_6B_QUANTIZED.tokenizerConfigSource,
      );
    } catch {
      // Cancel may throw if download already completed or wasn't tracked
    }
  }

  unload(): void {
    if (this._llm) {
      this._llm.delete();
      this._llm = null;
    }
    this._error = null;
    this._downloadProgress = 0;
    this.setState('idle');
  }
}

export const runtime = new LLMRuntime();
