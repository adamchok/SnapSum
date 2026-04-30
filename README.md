# SnapSum

Privacy-first finance tracking and budgeting with on-device receipt parsing.

## Current status

v1 MVP is feature-complete. The mobile app includes:
- Receipt capture with on-device OCR + rule-based extraction (pipeline-ready for Gemma 4)
- Manual transaction entry
- Category system (10 system + custom user categories)
- Budget envelopes with per-category spend tracking
- Dashboard with monthly spend, by-category breakdown, trend sparkline
- Onboarding flow with privacy carousel
- Biometric app lock (Face ID / fingerprint)
- Dark mode (system-follow + manual override)
- CSV export
- Full accessibility pass (labels, hit targets, tabular numerals, haptics)

## Repository layout

- `Project Scope.md` — product + technical specification
- `mobile/` — React Native app (Expo + TypeScript + Expo Router)
- `backend/` — reserved for Hono Workers + Supabase integration
- `shared/` — reserved for shared types/domain logic
- `eval/` — reserved for parsing evaluation harness and datasets
- `docs/` — backlog tracking, security documentation

## Quick start

```bash
cd mobile
npm install
npm run start
```

## Architecture highlights

- **Staged parsing pipeline**: preprocess → OCR → extract → LLM adapter → Zod validate
- **NetworkGuard**: blocks all HTTP during parse — privacy by enforcement
- **Pluggable AI**: `LocalLLMAdapter` interface accepts Gemma 4 / ExecuTorch / any local model
- **SQLite**: versioned migrations, 6 tables, minor-unit currency, offline-first
- **Theme system**: full light/dark token set, ThemeProvider with system-follow

## Next milestones

1. Gemma 4 LiteRT-LM native module (Android/iOS)
2. Recurring transactions + search/filter
3. FX rate cache with offline fallback
4. E2E-encrypted sync (Supabase + XChaCha20-Poly1305)
5. Web dashboard (Next.js, read-only)
