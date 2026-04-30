# SnapSum — Project Specification

> **Tagline:** *Snap. Sum. Sorted.*
> **One-liner:** A privacy-first, offline-capable personal finance app that turns any receipt into a categorised transaction in under two seconds — with zero customer data leaving the device.

---

## 1. Vision & Positioning

### 1.1 Problem
Personal finance apps force users into friction-heavy manual entry or bank-linking flows that compromise privacy. In SEA (especially Malaysia), cash and non-linked e-wallet spend is still dominant, and distrust of data-sharing with cloud AI providers is rising. Mint is dead, YNAB is expensive, Copilot is US-only, and the business-oriented tools (Expensify, Zoho Expense) are over-engineered for individuals.

### 1.2 Solution
**SnapSum** collapses transaction entry into a single camera tap. A receipt photo is parsed entirely on-device by a small multimodal model (Gemma 4 E2B/E4B), extracting merchant, amount, currency, date, line items and a suggested category. The user confirms, it saves. No photos, no OCR text, and no parsed data ever leave the phone unless the user explicitly enables cloud sync for their own account.

### 1.3 Differentiators
| | SnapSum | Typical competitor |
|---|---|---|
| Receipt → transaction | 1 tap, ~2 sec | Manual entry or cloud OCR |
| AI processing | 100% on-device | Cloud LLM / cloud OCR |
| Data residency | Device-first, optional E2E-encrypted sync | Provider cloud |
| Offline use | Fully functional offline | Degraded or blocked |
| Multi-currency | Native (140+ langs / multi-FX) | US-centric |
| Pricing | Free tier + flat Pro | Subscription-only |

### 1.4 Target User (v1)
- Primary: 25–40 y/o professionals in Malaysia / SEA, mixed cash + card + e-wallet spend, privacy-conscious.
- Secondary: Freelancers and micro-SMEs needing quick personal expense tracking.
- Tertiary (v2+): Couples and households with shared budgets.

### 1.5 Success Metrics (North Stars)
- **Activation:** % of new users who successfully scan ≥ 3 receipts within 7 days.
- **Parsing accuracy:** ≥ 90 % of scans require ≤ 1 field correction.
- **Retention:** D30 ≥ 25 %.
- **Performance:** P50 scan-to-confirm screen < 2.0 s on a mid-range Android (Snapdragon 6-gen or equivalent).

---

## 2. Scope

### 2.1 In Scope — v1 (MVP)
1. Onboarding with optional account (email + OAuth Google/Apple) — local-only mode supported.
2. Receipt capture (camera + gallery import + multi-page capture).
3. On-device receipt parsing via Gemma 4 E2B/E4B.
4. Transaction review/edit screen with pre-filled fields.
5. Transaction list, search, and filter.
6. Manual transaction entry + recurring transaction support.
7. Budget creation (envelopes) with category rollup.
8. Dashboard: monthly spend, by-category breakdown, trend chart.
9. Multi-currency with FX conversion (rates cached locally, refreshed on demand).
10. Offline-first storage (WatermelonDB over SQLite).
11. Optional E2E-encrypted sync (Supabase) for multi-device users.
12. Biometric app lock (Face ID / fingerprint).
13. CSV export.

### 2.2 In Scope — v1.1 (Fast follow, 4–8 weeks post-launch)
- Web dashboard (read-only, then read/write).
- Smart category learning (on-device heuristics that adapt to per-user corrections).
- Merchant normalisation / duplicate detection.
- Basic insights ("You spent 18 % more on dining this month").
- iPad / tablet layouts.

### 2.3 Out of Scope (v1)
- Bank account linking / Open Banking.
- Bill pay / money movement.
- Investment tracking.
- Shared accounts / household budgets.
- Desktop native apps.
- Business receipt workflows (per diem, mileage, reimbursement).
- Cloud-based LLM calls of any kind.

### 2.4 Non-Goals (philosophy)
- We **will not** send user data to any third-party AI or OCR provider.
- We **will not** require an account to use the app.
- We **will not** monetise user data; Pro tier is the revenue model.

---

## 3. Key User Flows

### 3.1 First-run → first scan
```
Launch
  → Splash (brand)
  → Welcome carousel (3 slides: Privacy, Snap, Budget)
  → Choose mode: [Local only] / [Create account]
  → Permission prompts: Camera (required), Notifications (optional)
  → Home (empty state with a single pulsing Snap FAB)
  → Tap Snap → Camera → Capture
  → Inline parse progress (~1–2 s) with skeleton fields
  → Review screen (fields pre-filled, editable)
  → Save → Home updates (toast: "Added to Food & Drink — RM 24.50")
```

### 3.2 Core receipt flow
```
[Camera]
  ├─ Auto edge-detect & auto-capture (optional toggle)
  ├─ Torch / Flash
  ├─ Multi-page (for long thermal receipts)
  └─ Retake
      ↓
[On-device parse — Gemma 4 E2B/E4B via LiteRT-LM]
  ├─ Image preprocess (rotate, deskew, tonemap)
  ├─ Single-pass: image → JSON (merchant, amount, currency, date, line_items, suggested_category, confidence)
  ├─ Timeout guard (3 s) → graceful fallback to manual form with image attached
      ↓
[Review]
  ├─ Confidence badges on each field
  ├─ Inline edit (tap any field)
  ├─ Category picker (smart-ranked by merchant history)
  ├─ Attach to budget / envelope
  └─ Split transaction (per line-item)
      ↓
[Save] → local DB → (optional) E2E encrypted sync
```

### 3.3 Budgeting flow
```
Tab: Budgets
  → "Create budget" → Name, Period (Weekly/Monthly/Custom), Currency
  → Add categories with amounts (template or blank)
  → Home widget: ring gauges per envelope
  → Overspend triggers local notification (no cloud)
```

### 3.4 Sync & multi-device (optional)
```
Settings → Sync
  → Toggle on → Generate device key → Passphrase-derived (Argon2id) master key
  → Data encrypted (XChaCha20-Poly1305) before leaving device
  → Supabase stores only ciphertext blobs + minimal metadata
  → Second device: Sign in + enter passphrase → decrypt → Realtime sync
```

---

## 4. Functional Requirements (Feature Catalog)

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F-01 | Camera capture with auto-crop | P0 | `expo-camera` + edge detection via OpenCV-lite |
| F-02 | On-device image → structured JSON parsing | P0 | Gemma 4 E2B default, E4B on flagship |
| F-03 | Confidence scoring per field | P0 | Returned by model; drives UI highlight |
| F-04 | Review & edit screen | P0 | Never auto-commit |
| F-05 | Manual transaction entry | P0 | Non-negotiable fallback |
| F-06 | Categories (system + custom) | P0 | Preloaded MY/SEA set |
| F-07 | Multi-currency with FX cache | P0 | Daily refresh, offline-tolerant |
| F-08 | Budgets (envelope model) | P0 | Weekly / Monthly |
| F-09 | Dashboard + trend chart | P0 | Victory Native XL or Reanimated-based |
| F-10 | Recurring transactions | P1 | User-defined cadence |
| F-11 | Search / filter / tag | P1 | SQLite FTS5 |
| F-12 | CSV export | P1 | Local file → share sheet |
| F-13 | E2E-encrypted sync | P1 | Opt-in, per-device keys |
| F-14 | Biometric lock | P1 | `expo-local-authentication` |
| F-15 | Merchant normalisation | P2 | Local fuzzy matcher (trigram) |
| F-16 | Insights ("You spent…") | P2 | On-device rules engine |
| F-17 | Web dashboard | P2 | Next.js, read-only first |
| F-18 | Dark mode | P0 | System-follow default |
| F-19 | Haptics on capture / save | P1 | Part of polish layer |
| F-20 | Accessibility (WCAG 2.2 AA) | P0 | Dynamic type, VoiceOver, contrast |

---

## 5. Technical Architecture

### 5.1 High-level diagram
```
┌──────────────────────────────────────────────────────────┐
│                  SnapSum Mobile (Expo RN)                │
│                                                          │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Camera  │→ │ Image Preproc  │→ │ Gemma 4 E2B/E4B  │  │
│  │ (Expo)   │  │ (deskew/crop)  │  │  via LiteRT-LM    │  │
│  └──────────┘  └────────────────┘  └────────┬──────────┘  │
│                                             ▼             │
│  ┌───────────────────────────────────────────────────┐   │
│  │   Review UI  →  Domain layer (TS)  →  WatermelonDB│   │
│  └───────────────────────────────────────────────────┘   │
│                         │                                │
│                         ▼ (opt-in, encrypted)            │
│  ┌───────────────────────────────────────────────────┐   │
│  │         Sync Engine (XChaCha20-Poly1305)          │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS (ciphertext only)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   SnapSum Backend (thin)                 │
│  Hono on Cloudflare Workers   ↔   Supabase (Postgres +   │
│  (auth token verify, blob      Auth + Storage + Realtime)│
│   routing, rate limiting)                                │
└──────────────────────────────────────────────────────────┘
```
Note: the backend **never decrypts** user data. It is a dumb, auth-gated blob store + realtime fan-out.

### 5.2 Mobile stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Expo (React Native)** latest SDK | Fast iteration, OTA updates, native modules when needed |
| Language | **TypeScript (strict)** | Type-safe money handling is non-negotiable |
| Navigation | **Expo Router** (file-based) | Native feel, deep linking |
| Styling | **NativeWind v4** (Tailwind) | Design-token friendly, fast |
| State | **Zustand** + **TanStack Query** | Local state + async cache |
| DB | **WatermelonDB** (SQLite) | Offline-first, reactive, fast |
| Camera | **expo-camera** + custom overlay | Edge-detect, torch, multi-shot |
| ML runtime | **LiteRT-LM** (Google AI Edge) via native module | Official Gemma 4 path |
| Fallback ML | **react-native-executorch** (LLaMA 3.2 1B) | Older devices, text-only fallback |
| OCR fallback | **ML Kit Text Recognition v2** | For devices that can't run Gemma 4 |
| Crypto | **libsodium (react-native-sodium)** | XChaCha20-Poly1305, Argon2id |
| Auth | **Supabase Auth** (OAuth + email) | Only after user opts into sync |
| Analytics | **PostHog (self-hosted)** | Privacy-respecting, opt-in only |
| Error tracking | **Sentry** (no PII, no screenshots) | Strictly scrubbed |

### 5.3 AI / ML layer — design

**Primary path (default):**
- **Model:** Gemma 4 **E4B** on devices with ≥ 6 GB RAM, **E2B** otherwise. Quantised (q4).
- **Runtime:** LiteRT-LM (Google AI Edge). Android: delegate to NNAPI / GPU. iOS: Core ML delegate where available.
- **Input:** Receipt image (pre-processed: max 1024 px long edge, JPEG q85, greyscale-equivalent when possible).
- **Prompt template (system, pinned):**
  ```
  You are a receipt parser. Given an image of a receipt, return ONLY a JSON
  object with this exact schema (no prose, no markdown fences):
  {
    "merchant": string,
    "amount_total": number,
    "currency": string,   // ISO 4217
    "date": string,       // ISO 8601
    "line_items": [{ "description": string, "amount": number }],
    "suggested_category": string,
    "confidence": { "merchant": 0-1, "amount_total": 0-1, "date": 0-1 }
  }
  If a field cannot be read, set it to null and confidence 0.
  ```
- **Guardrails:** JSON-schema validation on-device (Zod). On validation failure, retry once with stricter prompt; then fall back to OCR + rule-based parser.

**Fallback cascade (in order):**
1. Gemma 4 multimodal (image → JSON).
2. ML Kit OCR → rule-based regex extractor + local heuristic categoriser.
3. ML Kit OCR → LLaMA 3.2 1B (via ExecuTorch) → JSON extractor.
4. Manual review form with image attached.

**Model distribution:**
- First-run: model downloaded from our CDN (Cloudflare R2), signed + checksum-verified.
- OTA model updates gated by version compatibility.
- User-facing setting: "Update local AI model" (size, last updated, delete).

**Privacy guarantees (enforced in code):**
- Receipt images, OCR text, and parsed JSON are **never** sent over the network in v1.
- The only network calls from the parse pipeline are: (a) model download on first run, (b) optional encrypted sync of the *final, user-confirmed* transaction record.
- A `NetworkGuard` wrapper forbids the AI module from making any HTTP calls; unit tested.

### 5.4 Backend stack

Intentionally minimal.

| Component | Choice | Purpose |
|---|---|---|
| Edge API | **Hono on Cloudflare Workers** | Auth token verification, rate limiting, signed-URL issuance |
| DB / Auth / Realtime / Storage | **Supabase** (EU or SG region) | Ciphertext storage, realtime CDC |
| Object storage | **Supabase Storage** | Encrypted attachments (if user enables receipt image backup — off by default) |
| Model / static CDN | **Cloudflare R2** + Workers cache | Model binaries, FX rates JSON |
| FX rates | Daily cron → R2 JSON (open rates, CC-BY) | Client caches locally |
| Observability | **Grafana Cloud** (metrics), **Sentry** (errors) | Server-only; no user PII |

### 5.5 Data model (WatermelonDB schema — logical)
```
users              (local id, optional supabase_id, created_at, prefs_json)
accounts           (id, user_id, name, type: cash|card|ewallet, currency, ...)
transactions       (id, account_id, occurred_at, amount, currency,
                    merchant, category_id, notes, source: snap|manual|recurring,
                    confidence_json, receipt_id?, fx_rate?, ...)
line_items         (id, transaction_id, description, amount, qty)
receipts           (id, transaction_id, image_local_path, parsed_json, model_version)
categories         (id, user_id nullable, name, icon, color, parent_id?, system)
budgets            (id, user_id, name, period, start_on, end_on, currency)
budget_envelopes   (id, budget_id, category_id, amount_limit, rollover)
recurring_rules    (id, template_transaction_id, cadence, next_run_at, end_on?)
fx_rates           (base, quote, rate, fetched_at)
sync_meta          (entity, last_pulled_at, last_pushed_at)
```

All monetary amounts stored as **integer minor units** (e.g. sen/cents) with a `currency` field. Never floats.

### 5.6 Security & privacy

- **At rest (device):** SQLCipher-encrypted WatermelonDB; key stored in Keychain / Keystore.
- **In transit:** TLS 1.3 only.
- **Sync payloads:** encrypted client-side with XChaCha20-Poly1305; key derived from user passphrase (Argon2id, tuned to ~500 ms on-device).
- **Server sees:** `user_id`, `entity_type`, `row_id`, `created_at`, `ciphertext`, `nonce`, `version`. Nothing else.
- **Biometric lock:** required to open app when enabled.
- **No third-party analytics SDKs** beyond self-hosted PostHog (opt-in) and scrubbed Sentry.
- **Deletion:** "Delete my data" wipes local DB + purges remote ciphertext within 24 h. Documented in privacy policy.
- **Threat model** documented separately in `docs/SECURITY.md` (backend compromise scenario, device loss, passphrase loss recovery).

### 5.7 Performance budgets

| Metric | Target (P50) | Target (P95) |
|---|---|---|
| Cold app launch | < 1.2 s | < 2.5 s |
| Camera → captured frame | < 300 ms | < 600 ms |
| Parse (Gemma 4 E2B) | < 1.8 s | < 3.0 s |
| Parse (Gemma 4 E4B) | < 2.5 s | < 4.5 s |
| Save transaction → list update | < 150 ms | < 300 ms |
| App bundle size (excl. model) | < 50 MB | — |
| Model size on disk | < 1.6 GB (E2B) / < 2.8 GB (E4B) | — |

---

## 6. Design Specification

### 6.1 Brand

- **Name:** SnapSum
- **Wordmark:** "Snap" in regular weight, "Sum" in bold — direct lift from the provided logo.
- **Tagline:** *Snap. Sum. Sorted.*
- **Voice:** Calm, confident, understated. Zero hype. Short sentences. Never scolds the user about spending.
- **Logo usage:** App icon on all stores. Solid coin mark (no wordmark) for in-app header. Minimum clear space = 0.25× mark diameter. Never recolour outside the approved palette.

### 6.2 Design principles

1. **One tap to the value.** The camera FAB is always the primary action.
2. **Trust through transparency.** Show confidence on parsed fields; always allow edit before save.
3. **Privacy is visible.** A subtle "On-device" badge appears during parsing.
4. **Money is serious.** Tabular figures, no frivolous illustrations around balances.
5. **Calm motion.** Springs, not bounces. Haptics, not sounds (default).
6. **Accessible by default.** 4.5 : 1 contrast minimum, full dynamic type, VoiceOver labels on every control.

### 6.3 Colour system

Derived from the logo. All tokens support light and dark.

| Token | Light | Dark | Use |
|---|---|---|---|
| `brand/primary` | `#3FB08A` | `#4ECBA0` | Primary actions, focus, success accents |
| `brand/primary-deep` | `#1E7A5F` | `#2E9478` | Pressed state, dark-mode primary |
| `brand/secondary` | `#3B7CB8` | `#5A9EDA` | Links, info, chart accents |
| `brand/secondary-deep` | `#1E4F82` | `#2F6BA8` | Pressed / elevated |
| `brand/gradient` | `linear-gradient(135°, #4FC3A1, #3B7CB8)` | same | Hero surfaces, empty states |
| `ink/900` | `#0F1B2E` | `#F4F7FA` | Primary text |
| `ink/700` | `#2A3A52` | `#C7D1DE` | Secondary text |
| `ink/500` | `#5C6A82` | `#8A97AC` | Tertiary / placeholder |
| `surface/base` | `#FFFFFF` | `#0B1420` | App background |
| `surface/raised` | `#F4F8F6` | `#121D2D` | Cards |
| `surface/sunken` | `#E8F2ED` | `#09101A` | Insets, list dividers |
| `stroke/subtle` | `#DCE7E1` | `#1E2A3C` | Hairlines |
| `state/success` | `#2E9D6E` | `#4FC38C` | Positive deltas |
| `state/warning` | `#D58A2A` | `#F2B25E` | Low-confidence field |
| `state/danger` | `#C0413B` | `#E8695F` | Over budget, destructive |

Semantic pairing rule: never show raw numbers in red unless user is **over** a budget they defined. Negative balances use `ink/900`, not `danger`.

### 6.4 Typography

- **Primary typeface:** Inter (variable). System fallback: SF Pro (iOS), Roboto (Android).
- **Numeric typeface:** Inter with `font-variant-numeric: tabular-nums` on all money.
- **Type scale (pt, line-height):**
  - `display`: 34 / 40, weight 700 — top of dashboard balance
  - `title-1`: 28 / 34, 700 — screen titles
  - `title-2`: 22 / 28, 600
  - `title-3`: 18 / 24, 600
  - `body`: 16 / 22, 400
  - `body-strong`: 16 / 22, 600
  - `caption`: 13 / 18, 500
  - `micro`: 11 / 14, 500 — confidence badges, timestamps
- All text supports Dynamic Type (iOS) and font-scale (Android) up to 200 %.

### 6.5 Spacing, radius, elevation

- **Spacing scale (px):** 2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72.
- **Radii:** `sm` 8, `md` 12, `lg` 20, `xl` 28, `pill` 999. App icon radius = 28 (iOS) / 20 (Android).
- **Elevation:**
  - `e1` card: y 1, blur 4, 8 % ink.
  - `e2` sheet: y 8, blur 24, 12 % ink.
  - `e3` FAB / dialog: y 16, blur 40, 16 % ink.
- **Grid:** 4 pt base; screen horizontal padding = 20 px.

### 6.6 Iconography

- **Icon set:** Phosphor Icons (duotone for category avatars, regular for UI).
- Stroke weight 1.5. 24 × 24 default, 20 in dense lists, 32 in empty states.
- Category icons use `brand/primary` for the accent layer and `ink/500` for the base layer.

### 6.7 Motion

- **Library:** Reanimated 3 + Moti.
- **Springs:** `{ damping: 18, stiffness: 220, mass: 1 }` for UI transitions.
- **Durations:** 120 ms (micro), 240 ms (standard), 380 ms (sheet).
- **Capture moment:** 180 ms shutter flash → receipt miniaturises into the Snap FAB (shared-element transition) while parsing runs — reinforces "we're working on it, and it stays here".
- **Reduced motion:** respected via `AccessibilityInfo`; all transitions collapse to fades.

### 6.8 Haptics

- **Light:** selection, toggle.
- **Medium:** capture success, save success.
- **Rigid:** over-budget warning.
- No haptics during parsing (avoid "fake progress" feel).

### 6.9 Core screens (descriptive wireframes)

**Home / Dashboard**
```
┌────────────────────────────────────────┐
│  Good evening, Adam                    │
│  This month · October 2026             │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  RM 2,418.50                     │  │  ← display size, tabular
│  │  ▂▃▅▆▇▆▅▃   +12% vs last month  │  │  ← sparkline
│  └──────────────────────────────────┘  │
│                                        │
│  Budgets                               │
│  ◔ Food & Drink     62% · RM 620/1000 │
│  ◑ Groceries        48% · RM 240/500  │
│  ◕ Transport        91% · RM 455/500  │  (warning tint)
│                                        │
│  Recent                                │
│  ● Starbucks KLCC     RM 18.90  Today │
│  ● Grab Taxi          RM 22.50  Today │
│  ● Jaya Grocer        RM 86.40  Yesty │
│                                        │
│                             [ Snap ]   │  ← FAB, brand gradient
└────────────────────────────────────────┘
```

**Capture**
- Full-bleed camera; rounded overlay frame auto-locks onto receipt edges in `brand/primary`.
- Top bar: close, torch, multi-shot counter.
- Bottom: gallery thumb · shutter · retake.
- A subtle pill reads "On-device · Gemma 4" during the first run only (educational), and slides away.

**Review**
```
┌────────────────────────────────────────┐
│  ← Review transaction                  │
│                                        │
│  [Receipt thumb, 80×80]                │
│                                        │
│  Merchant    Starbucks KLCC      ●    │  ← green dot = high conf
│  Amount      RM 18.90            ●    │
│  Date        24 Oct 2026         ●    │
│  Category    Food & Drink ▾      ◐    │  ← amber = medium conf
│  Account     Cash ▾                   │
│  Notes       (optional)               │
│                                        │
│  ▸ 3 line items                       │
│                                        │
│  [  Save transaction  ]                │
└────────────────────────────────────────┘
```

**Budgets, Transactions list, Settings, Insights** — follow the same grammar: raised cards on sunken background, tabular figures, category-coloured accent stripes.

### 6.10 Empty states & errors

- Illustration style: single-line geometric, using the brand gradient as a stroke, no characters.
- Every error message follows: **What happened → Why → What to do**. No stack traces surfaced.
- Parse failure copy: *"Couldn't read this one. Tap to enter it manually — your photo stays on your phone."*

### 6.11 Accessibility checklist (ship gate)

- [ ] All interactive elements ≥ 44 × 44 pt hit target.
- [ ] Colour is never the sole signal (confidence uses dot + label + icon).
- [ ] Every image has an `accessibilityLabel`.
- [ ] Focus order logical on screen readers.
- [ ] Dynamic type tested at 200 %.
- [ ] High-contrast mode verified.
- [ ] No audio-only cues.

### 6.12 Design artefacts & tooling

- **Figma file:** `SnapSum / Product` (pages: Foundations, Components, Flows, Prototype).
- **Design tokens:** exported via Style Dictionary → consumed by NativeWind theme + web.
- **Component library:** shared TS types between Figma code connect and RN components.
- **Icon & logo kit:** SVG + PNG @1/2/3x, including monochrome and reverse variants.

---

## 7. Build Plan

### 7.1 Milestones (indicative, senior solo eng)

| Milestone | Duration | Exit criteria |
|---|---|---|
| **M0 — Foundations** | 1 wk | Expo app scaffolded, CI, design tokens, WatermelonDB schema, crash-free shell |
| **M1 — Manual core** | 2 wks | Manual transactions, categories, budgets, dashboard, dark mode |
| **M2 — Capture + OCR fallback** | 1 wk | Camera, ML Kit OCR, rule-based parser → review screen end-to-end |
| **M3 — Gemma 4 integration** | 2 wks | Native module for LiteRT-LM, model download flow, image→JSON pipeline, guardrails |
| **M4 — Sync (opt-in)** | 1.5 wks | Supabase + Workers, E2E encryption, multi-device tested |
| **M5 — Polish & a11y** | 1 wk | Motion, haptics, empty states, VoiceOver pass |
| **M6 — Closed beta** | 2 wks | TestFlight + Play Internal, ≥ 50 users, metrics baselined |
| **M7 — GA v1** | 1 wk | Store submission, marketing site, privacy policy, support docs |

Total to GA: ~11–12 weeks.

### 7.2 Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LiteRT-LM RN bindings immature | High | High | Build a thin native module (Kotlin/Swift); fall back to ExecuTorch + OCR while community catches up |
| Gemma 4 too slow/large for low-end Android | Medium | High | Tiered model strategy (E2B default, ML Kit + rules for <4 GB RAM devices) |
| Parsing accuracy below 90 % on MY thermal receipts | Medium | High | Ship private receipts corpus + eval harness from day 1; iterate prompts and pre-processing |
| Passphrase loss locks users out of sync | Medium | High | Make sync clearly opt-in, local-only is first-class; optional recovery key exported to user |
| Model download failures on flaky networks | Medium | Medium | Resumable downloads, checksum verification, graceful "use basic mode" path |
| App Store review friction (on-device LLM) | Low | Medium | Document the on-device model clearly in submission notes; no cloud AI claim needed |

### 7.3 Evaluation harness

- Private corpus of ≥ 500 receipts (varied: MY / SG / ID, thermal / glossy, Malay / English / Chinese / mixed).
- Automated eval on every model/prompt change: accuracy per field + latency per device tier.
- Target before GA: merchant ≥ 92 %, total ≥ 97 %, date ≥ 95 %, category ≥ 80 %.

---

## 8. Monetisation & Operations

### 8.1 Pricing
- **Free:** unlimited manual entry, up to 30 snaps/month, 1 device, CSV export.
- **Pro (flat monthly, one-time lifetime option):** unlimited snaps, multi-device sync, advanced insights, priority support.
- No ads, ever. No data sold.

### 8.2 Ops
- **Distribution:** App Store, Google Play.
- **Infra cost ceiling (v1):** < USD 50/mo until 10k MAU (Cloudflare + Supabase free/pro tiers).
- **Support:** email + in-app issue reporter (attaches logs only; user consents each time).
- **Release cadence:** weekly beta, bi-weekly production.

### 8.3 Compliance
- GDPR + Malaysia PDPA aligned.
- No health, biometric, or precise-location data collected.
- Privacy policy and threat model published at launch.

---

## 9. Open Questions (to resolve before M3)

1. iOS: LiteRT-LM on Core ML vs ExecuTorch — which ships with better latency on A15+ devices in practice?
2. Do we bundle the model in the binary (slower downloads, faster first-scan) or download on first run (smaller install)?
3. Pro pricing: regional pricing tiers for SEA vs global?
4. Do we support Shariah-compliant category taxonomy out of the box for MY market?
5. Sync conflict resolution strategy — last-write-wins vs CRDT-lite per entity?

---

## 10. Appendix

### 10.1 Glossary
- **Snap:** A single receipt capture + parse action.
- **Envelope:** A single budget line tied to one category.
- **On-device:** Computation performed entirely on the user's phone, no network involved.
- **E2E-encrypted sync:** Ciphertext-only sync; keys never leave the device.

### 10.2 Reference stack pins (to be updated at kickoff)
- Expo SDK: latest stable at project start.
- React Native: bundled with Expo SDK.
- Gemma 4: E2B / E4B, q4 quantisation, LiteRT-LM runtime.
- LLaMA 3.2 1B: q4, via react-native-executorch.
- WatermelonDB: latest stable.
- Supabase: latest stable client.
- Hono: latest stable on Cloudflare Workers.

### 10.3 Repositories (planned)
- `snapsum/mobile` — Expo app.
- `snapsum/backend` — Hono Workers + Supabase migrations.
- `snapsum/shared` — TS types, domain logic, validators.
- `snapsum/eval` — parsing eval harness + private corpus (git-crypt).
- `snapsum/web` — v1.1 web dashboard (Next.js).

---

*Document owner: Adam · Status: Draft v1.0 · Last updated: 2026-04-24*
