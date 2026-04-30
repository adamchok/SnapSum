# SnapSum

> Privacy-first personal finance — snap a receipt, get a categorized transaction. No cloud, no accounts, no compromise.

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=reactquery" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/SQLite-offline--first-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/On--Device_AI-ExecuTorch-EE4C2C?style=flat-square&logo=pytorch" alt="ExecuTorch" />
  <img src="https://img.shields.io/badge/Status-v1_MVP-22c55e?style=flat-square" alt="Status" />
</p>

---

## What is SnapSum?

SnapSum is a mobile finance tracker built around a single core principle: **your financial data never leaves your device unless you explicitly ask it to.**

Point your camera at a receipt. SnapSum runs a multi-stage on-device parsing pipeline — image preprocessing, ML Kit OCR, rule-based extraction, and optionally a local vision-language model (LFM2-VL 1.6B via ExecuTorch on Android) — then presents a pre-filled transaction for your review. No API keys, no cloud OCR, no third-party AI services. The entire parse runs in the app sandbox, guarded at the network level by a fetch-blocking `NetworkGuard` that throws if any stage attempts an outbound call.

The v1 MVP is **feature-complete** on Android.

---

## Features

| Area | Detail |
|------|--------|
| **Receipt capture** | Camera → preprocessing → on-device OCR → rule extraction + optional local VLM → Zod-validated output with per-field confidence scores |
| **Manual transactions** | Full add / edit / delete flow independent of receipt capture |
| **Category system** | 10 system categories + unlimited user-defined categories with custom colors and icons |
| **Budget envelopes** | Monthly budgets, per-category spend tracking, over-budget indicators |
| **Dashboard** | Monthly spend summary, category breakdown, 30-day trend sparkline |
| **Onboarding** | Privacy-first carousel, camera/biometric permission prompts, local-only framing |
| **Biometric lock** | Face ID / fingerprint / device passcode gate via `expo-local-authentication` |
| **Dark mode** | System-follow and manual override; full token-based design system |
| **CSV export** | Share sheet export of all transactions |
| **Accessibility** | Semantic labels, minimum hit targets, tabular numerals, haptic feedback throughout |

---

## Architecture

### Receipt Parsing Pipeline

The pipeline is the technical heart of SnapSum. Each stage is discrete, testable, and privacy-enforced:

```
Camera frame
     │
     ▼
┌─────────────────┐
│   Preprocess    │  expo-image-manipulator — crop, normalize, grayscale
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   OCR (ML Kit)  │  @react-native-ml-kit/text-recognition — on-device
└────────┬────────┘
         │
    ┌────┴─────┐   runs in parallel
    │          │
    ▼          ▼
┌────────┐  ┌──────────────────┐
│ Rules  │  │  LocalLLMAdapter │  pluggable — ExecuTorch (Android) or noop
└────────┘  └──────────────────┘
    │          │
    └────┬─────┘
         │   merge + confidence weighting
         ▼
┌─────────────────┐
│  Zod validate   │  typed schema, per-field confidence
└────────┬────────┘
         │
         ▼
    Review screen  →  SQLite write
```

The entire pipeline runs inside `withNetworkGuard`, which replaces `globalThis.fetch` with a stub that throws `NetworkViolationError`. This is not opt-in — it is structural. A bug or a compromised dependency cannot exfiltrate receipt data.

### Pluggable AI Adapter

```typescript
interface LocalLLMAdapter {
  parse(ocrText: string): Promise<ParsedReceipt>;
}

// Wired at runtime in AppProviders
// Android: executorchAdapter (LFM2-VL 1.6B, ~1.6 GB, user-downloaded)
// Everything else: noopAdapter (rules-only fallback)
```

The adapter pattern means swapping Gemma 4 (LiteRT-LM) in for LFM2-VL is a one-file change with no pipeline modifications.

### Data Layer

- **SQLite** via `expo-sqlite` — WAL mode, foreign keys on, stored in the app's private sandbox directory (iOS Data Protection / Android FBE)
- **Versioned migrations** — `PRAGMA user_version` guard, additive-only schema changes
- **Money in minor units** — all amounts stored as integers (e.g. `1099` = $10.99) to avoid floating-point rounding
- **6 tables**: `transactions`, `categories`, `budgets`, `budget_envelopes`, `receipts`, `line_items`, `prefs`
- **TanStack Query v5** for all reads — cache invalidation on every write, no bespoke loading state management

### Project Structure

```
SnapSum/
├── mobile/                     # Active Expo/React Native app
│   ├── app/                    # Expo Router screens (file-based routing)
│   │   ├── (tabs)/             # Tab navigator: dashboard, transactions, budgets
│   │   ├── onboarding/         # Multi-step onboarding carousel
│   │   ├── capture.tsx         # Receipt capture + review flow
│   │   └── transaction/        # Add / edit transaction screens
│   └── src/
│       ├── components/         # Shared UI (FAB, pickers, sparkline, BiometricGate)
│       ├── data/               # SQLite initialization and migrations
│       ├── features/           # Domain modules
│       │   ├── budgets/        # Budget CRUD + envelope calculations
│       │   ├── categories/     # System + custom categories
│       │   ├── receipt/        # Pipeline, OCR, LLM adapters, NetworkGuard
│       │   ├── transactions/   # Transaction CRUD + CSV export
│       │   ├── prefs/          # User preferences (theme, biometric, currency)
│       │   └── security/       # Biometric gate logic
│       ├── lib/                # Pure utilities (money, date, validation)
│       ├── providers/          # AppProviders — QueryClient, DB warmup, LLM wiring
│       └── theme/              # Design tokens + ThemeProvider
├── backend/                    # Reserved — Hono on Cloudflare Workers + Supabase
├── shared/                     # Reserved — shared Zod schemas + domain types
├── eval/                       # Reserved — parsing evaluation harness
├── docs/
│   ├── SECURITY.md             # Threat model, storage strategy, NetworkGuard
│   └── V1-Backlog.md           # Implementation checklist
└── Project Scope.md            # Full product + technical specification
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native 0.81.5 + Expo SDK 54 | New Architecture (`newArchEnabled: true`), Expo managed workflow for camera/auth |
| Language | TypeScript (strict) | End-to-end type safety; Zod for runtime validation at pipeline boundaries |
| Routing | Expo Router v6 | File-based routing, typed routes experiment, deep link support via `snapsum://` scheme |
| Server state | TanStack Query v5 | Declarative cache + invalidation; no hand-rolled loading/error state |
| Client state | Zustand v5 | Lightweight draft store for in-progress receipt edits |
| Local database | expo-sqlite (WAL) | Relational integrity, offline-first, runs entirely in app sandbox |
| OCR | ML Kit Text Recognition | On-device, no network, works offline |
| On-device VLM | ExecuTorch + LFM2-VL 1.6B | Android-only for v1; quantized for mobile; pluggable via adapter |
| Validation | Zod v4 | Pipeline output schemas; strict parse, not coerce |
| UI | Expo vector icons, expo-linear-gradient, custom token system | |
| Gestures | react-native-gesture-handler + react-native-screens | Native gesture responders, screen optimization |

---

## Security & Privacy Design

SnapSum treats privacy as an architectural constraint, not a feature flag.

### Network enforcement
The `NetworkGuard` wraps every parse stage and monkey-patches `globalThis.fetch` for the duration of the call. Any outbound request during parsing — from pipeline code, adapter code, or a dependency — throws `NetworkViolationError` and aborts the parse. This is tested, not trusted.

### Storage
- App sandbox isolation (iOS Data Protection class, Android Full-Disk Encryption / File-Based Encryption)
- No external analytics, crash reporting, or telemetry — zero network calls in v1 beyond Expo OTA updates and the one-time, user-initiated model download
- Receipt images stored in `expo-file-system` document directory, never uploaded

### Biometric lock
UI-level gate using `expo-local-authentication`. Prevents casual access; does not encrypt the database (by design — complexity is deferred until the sync passphrase flow arrives).

### Planned for v1.1 (sync)
- Master key derived via **Argon2id** from user passphrase (~500 ms on-device)
- Sync payloads encrypted with **XChaCha20-Poly1305** — server sees ciphertext only
- Optional **SQLCipher** for local database encryption using the same derived key
- GDPR / Malaysia PDPA aligned — no personal data collected in v1

See [`docs/SECURITY.md`](docs/SECURITY.md) for the full threat model.

---

## Quick Start

Requires [Node.js](https://nodejs.org) ≥ 20, a working Android or iOS simulator, and the [Expo CLI](https://docs.expo.dev/get-started/installation/).

```bash
git clone https://github.com/your-username/SnapSum.git
cd SnapSum/mobile
npm install
npm run start
```

> ML Kit OCR requires a **development build** (not Expo Go). The on-device VLM (LFM2-VL) is Android-only and requires a 1.6 GB model download from the app's Settings screen.

### Build a dev client

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## Roadmap

| Milestone | Status |
|-----------|--------|
| v1 MVP — core finance app, OCR pipeline, SQLite, budgets, biometric lock | ✅ Complete |
| Gemma 4 LiteRT-LM adapter (Android + iOS) | 🔜 Next |
| Recurring transactions, full-text search, date filters | 🔜 Next |
| FX rate cache with offline fallback | Planned |
| E2E-encrypted sync — Supabase + XChaCha20-Poly1305 | Planned |
| Web dashboard — Next.js, read-only, synced | Planned |
| SQLCipher local encryption (tied to sync passphrase) | Planned |
| Parsing evaluation harness + accuracy benchmarks | Planned |

---

## Repository Status

| Directory | Status |
|-----------|--------|
| `mobile/` | ✅ Active — v1 MVP feature-complete |
| `backend/` | 🏗️ Reserved — Hono + Cloudflare Workers + Supabase (not yet implemented) |
| `shared/` | 🏗️ Reserved — shared Zod schemas and domain types |
| `eval/` | 🏗️ Reserved — parsing evaluation harness and datasets |

---

## License

See [`LICENSE`](LICENSE).
