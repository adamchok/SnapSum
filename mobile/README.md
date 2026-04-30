# SnapSum Mobile (v1 MVP)

Privacy-first budgeting app with on-device receipt parsing. Expo + TypeScript + Expo Router.

## What's included

### Core features
- **Receipt capture** — camera → on-device OCR → rule-based extraction → review form → save
- **Manual entry** — add transactions without a receipt
- **Transaction CRUD** — list, view, edit, delete with full validation
- **Categories** — 10 system categories + user-created custom categories with color-coded picker
- **Budgets** — create monthly budgets with per-category envelope limits
- **Dashboard** — monthly spend, by-category breakdown, 30-day trend sparkline
- **CSV export** — export all transactions to CSV via native share sheet

### Receipt parsing pipeline
- **Staged architecture**: preprocess → OCR → rules-based extraction → LLM adapter → Zod validation
- **ML Kit OCR** — `@react-native-ml-kit/text-recognition` for real text recognition (requires dev build)
- **On-device VLM (Android)** — LFM2-VL 1.6B via `react-native-executorch`. User downloads the ~1.6 GB model from Settings; the adapter passes the receipt image + OCR text to the model and parses structured JSON. Falls back to OCR+rules if the model isn't downloaded or inference fails.
- **Pluggable LLM adapter** — `LocalLLMAdapter` interface; `executorchAdapter` active on Android when model is present, `noopAdapter` on iOS / when model is absent.
- **NetworkGuard** — blocks all network calls during parsing (privacy guarantee)
- **Per-field confidence** — dot + label badges (high/medium/low), color is never the sole signal

### Privacy & security
- **Biometric lock** — Face ID / fingerprint via `expo-local-authentication`
- **On-device only** — no data sent to any server during parsing
- **No account required** — local-only mode is first-class
- Full rationale in [docs/SECURITY.md](../docs/SECURITY.md)

### Design system
- **Dark + light mode** — follows system by default, manual override in Settings
- **Full token set** — colors, spacing, radius, typography per spec §6.3
- **Accessibility** — 44pt min hit targets, VoiceOver labels, tabular numerals on money
- **Haptics** — medium on capture/save, warning on over-budget

### Onboarding
- 3-slide carousel (Privacy / Snap / Budget)
- Camera permission prompt
- Local-only mode with sync stubbed for future

## Architecture

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigator (Home, Transactions, Budgets, Settings)
│   ├── onboarding/         # First-run carousel + permissions
│   ├── transaction/        # [id] detail/edit + new manual entry
│   ├── budgets/            # [id] detail + new creation
│   └── capture.tsx         # Camera → parse → review modal
├── src/
│   ├── components/         # Shared UI (Screen, SnapFab, CategoryPicker, etc.)
│   ├── data/               # SQLite database + versioned migrations
│   ├── features/
│   │   ├── budgets/        # Budget + envelope types, repository, engine, hooks
│   │   ├── categories/     # Category types, repository, hooks
│   │   ├── prefs/          # Key-value preferences (theme, biometric, onboarded)
│   │   ├── receipt/        # Parsing pipeline (schema, preprocess, ocr, extract, LLM adapter, networkGuard)
│   │   ├── security/       # Biometric authentication
│   │   └── transactions/   # Transaction types, repository, hooks, CSV export, draft store
│   ├── lib/                # Utilities (date, money, validation)
│   ├── providers/          # AppProviders (QueryClient, GestureHandler)
│   └── theme/              # Design tokens + ThemeProvider
```

## Run locally

```bash
npm install
npm run start
```

Then press:
- `a` for Android emulator/device
- `w` for web (limited — camera and ML Kit not available)
- `i` for iOS (macOS only)

## Dev build note

ML Kit OCR and `react-native-executorch` are native modules. They require an Expo development build, **not** plain Expo Go.

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

- Works with fallback parsing in Expo Go/web (OCR + rules, no LLM).
- Uses ML Kit OCR + LFM2-VL vision model when native modules are linked in a dev build.
- The LLM model (~1.6 GB) is downloaded on demand from Settings → "Local AI model". Wi-Fi recommended.

## Database

SQLite via `expo-sqlite` with PRAGMA-versioned migrations. Tables:
- `transactions` — core spend records (minor units, ISO currency, category)
- `categories` — system + custom categories with icon and color
- `budgets` + `budget_envelopes` — monthly/weekly budgets with per-category limits
- `receipts` — parsed JSON + image path linked to transactions
- `line_items` — individual receipt line items
- `prefs` — key-value app preferences

Current approach uses `expo-sqlite` directly. WatermelonDB migration is documented but deferred — `expo-sqlite` is sufficient for single-device use, and avoids the native build complexity of WatermelonDB until sync is implemented.

## What's next (deferred from this MVP)

1. **iOS VLM support** — once `react-native-executorch` ships VLM parity on iOS + we run `npx expo prebuild --platform ios`
2. **Gemma 3n swap-in** — replace LFM2-VL with Gemma 3n E2B when `optimum-executorch` ships a working export (`huggingface/optimum-executorch#99`)
3. **Custom CDN model hosting** — switch from HF download to self-hosted CDN via `LLMModule.fromCustomModel()`
4. **Recurring transactions** — user-defined cadence, auto-creation
5. **Search/filter** — FTS5 full-text search on merchant/category
6. **FX rates** — daily cache, offline-tolerant conversion
7. **E2E-encrypted sync** — Supabase + XChaCha20-Poly1305 + Argon2id passphrase
8. **SQLCipher** — database encryption tied to sync passphrase
