# SnapSum — Security & Privacy (v1)

## Design Principles

1. **No data leaves the device** unless the user explicitly enables sync.
2. **No third-party AI or OCR providers** — all parsing is on-device.
3. **No account required** — local-only mode is first-class.
4. **Minimal attack surface** — the backend (when used) only sees ciphertext.

## v1 Storage Strategy

### On-device data at rest

- **Database:** `expo-sqlite` with WAL mode. Stored in the app's private sandbox directory, protected by iOS Data Protection / Android app sandbox.
- **Encryption at rest:** Deferred to v1.1. The current approach relies on OS-level app sandbox isolation, which prevents other apps from accessing SnapSum's data. Full SQLCipher encryption will be added when E2E-encrypted sync ships, since the encryption key will be derived from the user's sync passphrase via Argon2id.
- **Receipt images:** Stored in `expo-file-system` document directory, within the app sandbox. Never uploaded unless sync is explicitly enabled.
- **Preferences:** Stored in the `prefs` SQLite table (same sandbox).

### Biometric lock

- Implemented via `expo-local-authentication` (Face ID / fingerprint / device passcode fallback).
- When enabled, the app requires biometric authentication whenever it returns to the foreground.
- The biometric gate is a UI-level lock. It does not encrypt the database — it prevents casual access (shoulder surfing, children, etc.).

### Why not SQLCipher now?

SQLCipher adds complexity (native build requirement, key management, migration path) that is best introduced alongside the sync passphrase flow. For v1:

- The OS sandbox provides adequate protection for local-only data.
- Biometric lock prevents casual access.
- No sensitive data is transmitted over the network.

When sync ships (v1.1+), the plan is:

1. User creates a passphrase.
2. Derive a master key using Argon2id (~500 ms on-device).
3. Use XChaCha20-Poly1305 for sync payloads.
4. Optionally encrypt the local SQLite database with the same derived key using SQLCipher.

## Network Privacy

### NetworkGuard

The receipt parsing pipeline wraps all stages in a `NetworkGuard` that replaces `globalThis.fetch` with a blocking stub during parse execution. Any network call during parsing throws a `NetworkViolationError`.

This ensures:
- Receipt images are never sent to any server.
- OCR text is never sent to any server.
- Parsed transaction JSON is never sent to any server.
- The only network calls from the parse pipeline are model downloads (first-run, user-initiated).

### Model download exception

The LFM2-VL 1.6B model (~1.6 GB) is downloaded from Hugging Face via `react-native-executorch`'s built-in fetcher. This is the **only** network call adjacent to the parse pipeline. It is:

- Triggered exclusively by explicit user action in Settings → "Local AI model" → Download.
- Never triggered inside `withNetworkGuard`. The download runs in the Settings screen context, entirely outside the receipt parsing flow.
- A one-time GET request. Once cached locally, inference is fully offline.

### v1 network calls (exhaustive)

| Call | When | Data sent |
|------|------|-----------|
| None | Receipt parsing | N/A — blocked by NetworkGuard |
| Expo OTA updates | App launch (Expo managed) | App version, platform |
| VLM model download | User-initiated in Settings (Android) | None (GET request to HF CDN) |

No analytics, no crash reporting, no telemetry in v1 MVP.

## Threat Model (summary)

| Threat | Mitigation |
|--------|-----------|
| Device loss | Biometric lock + OS encryption (FileVault/Android FBE) |
| Malicious app on same device | OS app sandbox isolation |
| Man-in-the-middle | No network calls during parsing; TLS 1.3 for any future sync |
| Server compromise (future sync) | E2E encryption — server never sees plaintext |
| Passphrase loss (future sync) | Recovery key exported to user; local data always accessible |
| Supply chain (dependencies) | Minimal native deps; Expo-managed; no third-party AI SDKs |

## Compliance

- GDPR / Malaysia PDPA aligned: no personal data collected or transmitted in v1.
- No health, biometric sensor data, or precise location collected.
- Privacy policy to be published at GA launch.
