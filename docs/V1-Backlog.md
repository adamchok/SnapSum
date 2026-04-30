# SnapSum v1 Backlog (Execution Order)

## 1) Core transaction engine

- [x] Define transaction entity in minor units only (`amountMinor: number`, `currency: ISO4217`).
- [x] Add repository interface and local implementation.
- [x] Build list + detail + edit flows backed by local storage.
- [x] Manual transaction entry screen with category picker.

## 2) Capture and review

- [x] Integrate camera capture (`expo-camera`) with receipt framing overlay.
- [x] Build `parseReceipt()` service interface with ML Kit OCR + rule-based fallback parsing.
- [x] Refactor into staged pipeline: preprocess → OCR → extract → LLM adapter → merge + Zod validate.
- [x] Wire parsed output to review form with per-field confidence badges and category picker.
- [x] NetworkGuard to block all fetch during on-device parsing.
- [x] Pluggable `LocalLLMAdapter` interface (noop for now, ready for Gemma 4).
- [x] On-device VLM adapter (Android) — LFM2-VL 1.6B via `react-native-executorch`, user-triggered download, Settings UI with progress/delete.
- [ ] iOS VLM adapter — deferred until `react-native-executorch` ships VLM iOS parity.
- [ ] Gemma 3n swap-in — deferred until `huggingface/optimum-executorch#99` lands.

## 3) Offline storage

- [x] Add SQLite schema with versioned migrations (PRAGMA user_version).
- [x] Tables: transactions, categories, budgets, budget_envelopes, receipts, line_items, prefs.
- [x] Add indexes for date, category, merchant, foreign keys.
- [x] Seed 10 system categories on first migration.
- [x] CSV export to local file + native share sheet.

## 4) Budgeting

- [x] Budget + envelope entities persisted in SQLite.
- [x] Budget creation screen with category-envelope editor.
- [x] Budget detail screen with per-envelope progress bars.
- [x] Category rollups with totals and monthly trends.
- [x] Over-budget haptic warning feedback.

## 5) Dashboard

- [x] Time-of-day greeting.
- [x] Monthly spend total with trend sparkline.
- [x] By-category horizontal bar breakdown.
- [x] Recent transactions list with navigation.
- [x] Empty state with guided actions.

## 6) Onboarding

- [x] 3-slide carousel: Privacy / Snap / Budget.
- [x] Camera permission request.
- [x] Local-only mode (sync stubbed for future).
- [x] Onboarding gate via prefs.

## 7) Theme & design

- [x] Full light + dark color tokens matching spec §6.3.
- [x] ThemeProvider with system-follow, manual override.
- [x] Theme toggle in Settings.
- [x] All screens use dynamic `useTheme()` colors.

## 8) Privacy and security

- [x] Add app-level biometric lock (Face ID / fingerprint).
- [x] Biometric toggle in Settings.
- [x] NetworkGuard tests to ensure parse flow is local-only.
- [x] Document storage encryption strategy in docs/SECURITY.md.
- [ ] Add storage encryption (SQLCipher) — deferred to sync milestone.

## 9) Accessibility & polish

- [x] All interactive elements ≥ 44×44 pt hit targets.
- [x] `accessibilityRole` and `accessibilityLabel` on all controls.
- [x] Tabular numerals (`fontVariant: ['tabular-nums']`) on all money.
- [x] Haptics: medium on capture/save, warning on over-budget.
- [x] Confidence badges use dot + label (color never sole signal).

## 10) Optional sync groundwork (deferred)

- [ ] Add auth flow (only when user opts in).
- [ ] Define encrypted sync payload format.
- [ ] Add pull/push conflict strategy.
