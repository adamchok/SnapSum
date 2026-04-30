export class NetworkViolationError extends Error {
  constructor(url: string) {
    super(
      `Network call intercepted during on-device parsing: ${url}. ` +
        'Receipt data must never leave the device.',
    );
    this.name = 'NetworkViolationError';
  }
}

let guardDepth = 0;
let savedFetch: typeof globalThis.fetch | null = null;

const blockedFetch = (_input: RequestInfo | URL): Promise<Response> => {
  const url = typeof _input === 'string' ? _input : String(_input);
  throw new NetworkViolationError(url);
};

export async function withNetworkGuard<T>(fn: () => Promise<T>): Promise<T> {
  if (guardDepth === 0) {
    savedFetch = globalThis.fetch;
    globalThis.fetch = blockedFetch as typeof fetch;
  }
  guardDepth++;

  try {
    return await fn();
  } finally {
    guardDepth--;
    if (guardDepth === 0 && savedFetch) {
      globalThis.fetch = savedFetch;
      savedFetch = null;
    }
  }
}
