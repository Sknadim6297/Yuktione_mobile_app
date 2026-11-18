# YuktiOne Mobile Design System

Project-local design guidance for the Expo React Native app at `yukti-mobile-app`.

**Source of truth for runtime tokens:** `src/theme/` (`colors`, `typography`, `spacing`, `radius`, `shadows`).  
**Primary visual reference:** supplied YuktiOne screen images (30-screen set).  
**Supporting AI tool:** UI UX Pro Max (Cursor skill under `.cursor/skills/ui-ux-pro-max/`) — design-quality aid only; never a license to replace brand or reference layouts.

Locked brand colors must not be changed without explicit product approval.

---

## Brand colors (LOCKED)

| Token | Hex | Usage |
|-------|-----|--------|
| Primary Teal | `#36877F` | Primary CTAs, active dots, focus, success |
| Teal dark | `#2B6D66` | Pressed primary |
| Teal soft | `#E8F3F1` | Soft fills / chips |
| Secondary Lavender | `#8B7BB8` | Secondary accents, pending status |
| Lavender soft | `#EFEBF8` | Soft lavender fills |
| Background Cream | `#F8F5F0` | Screen canvas |
| Cream dark | `#EFE9E0` | Muted surfaces |
| Text Navy | `#142B4D` | Primary text, icons on cream |
| Navy muted | `#4A5A70` | Secondary text |

Semantic aliases live in `src/theme/colors.ts` (`text`, `background`, `border`, `status`, `interactive`). Prefer those over hardcoding hex in screens.

Do **not** introduce a second palette, purple/indigo default themes, or dark-mode overrides unless product requests them.

---

## Typography

Fonts (loaded via `expo-font`):

- **Display / headlines:** Libre Baskerville (`LibreBaskerville_700Bold`, `LibreBaskerville_400Regular`)
- **Body / UI:** DM Sans (`DMSans_400Regular`); use theme weight styles for medium/semibold where system fallbacks apply

Scale (`src/theme/typography.ts`):

| Role | Size | Notes |
|------|------|--------|
| display | 34 | Splash / hero moments |
| h1 | 28 | Screen titles |
| h2 | 22 | Section titles |
| h3 | 18 | Card / group titles |
| body | 16 | Default copy |
| bodyStrong | 16 / 600 | Emphasized body |
| caption | 14 | Secondary / helper |
| label | 14 / 600 | Field labels |
| button | 16 / 600 | CTA labels |

Rules:

- One clear hierarchy per screen: brand/logo → one headline → one support line → actions.
- Prefer `maxFontSizeMultiplier` on long marketing copy (already used on onboarding).
- Do not mix ad-hoc font sizes when a token exists.
- Line lengths: keep body readable; avoid wall-of-text on first viewport.

---

## Spacing scale

From `src/theme/spacing.ts` (4-based):

`none 0 · xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32 · huge 40 · massive 48`

Rules:

- Horizontal screen padding: typically `spacing.xxl` (24).
- Vertical stacks: use `gap` with `sm`–`xxl`; avoid magic numbers.
- Adjacent touch targets: minimum **8px** gap (UI UX Pro Max / platform guidance).
- Safe areas: use `SafeAreaView` / `useSafeAreaInsets` — never hardcode status-bar height.

---

## Border radius

From `src/theme/spacing.ts` → `radius`:

`sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · full 9999`

- Primary buttons: `radius.lg` (shared `Button`).
- Inputs: `radius.md`.
- Circular icon CTAs (onboarding next/back): half of size (e.g. 52 → 26).
- Avoid card-heavy chrome on marketing heroes; cards are for interactive groupings only.

---

## Shadows & elevation

From `src/theme/shadows.ts`: `none`, `sm`, `md`, `lg` — soft navy-tinted shadows. Prefer subtle elevation; avoid multi-layer glow stacks.

---

## Cards

Allowed when they group a user interaction or a coherent content block (e.g. professional join hero, welcome status). Defaults:

- Surface: `colors.background.surface` or cream variants
- Border: `colors.border.subtle` when needed
- Radius: `radius.lg`–`xl`
- Padding: `spacing.lg`–`xxl`
- Shadow: `shadows.sm` max for most surfaces

Do not wrap the entire splash/onboarding first viewport in a card.

---

## Buttons

Shared component: `src/components/ui/Button.tsx`

| Variant | Look |
|---------|------|
| primary | Eucalyptus fill, inverse text |
| secondary | Lavender / secondary interactive |
| ghost | Text/outline-style on cream |

Rules:

- `minHeight: 52` (meets ~48dp Android / exceeds 44pt iOS guidance).
- Full width by default on auth and form footers.
- Show `loading` with `ActivityIndicator`; disable while loading.
- Always set `accessibilityRole="button"` (built-in).
- Prefer shared `Button` over one-off `Pressable` CTAs except icon-only circular controls.

---

## Inputs

Shared component: `src/components/ui/Input.tsx`

- `minHeight: 52`, cream/white surface, subtle border, focus via eucalyptus when wired.
- Error: `colors.status.error` border + caption under field; prefer `accessibilityLiveRegion="polite"`.
- Use correct `keyboardType` / `textContentType` / `autoComplete`.
- Auth entry uses a custom mail-icon field; keep visual parity with `Input` tokens (height, radius, colors).

---

## Icons

- Prefer `@expo/vector-icons` (Ionicons) with navy / eucalyptus / inverse on green.
- Decorative botanical art: mark `accessibilityElementsHidden` / `importantForAccessibility="no"`.
- Brand logo: always `accessibilityLabel="YuktiOne"` (or full tagline when shown).
- Social: use project SVG icons (`GoogleIcon`, `AppleIcon`) — do not invent alternate brand marks.
- Icon-only controls: `accessibilityLabel` + `hitSlop` ≥ 8–12.

---

## Navigation patterns

- **Router:** Expo Router (`src/app/`). Non-route code stays outside `src/app/`.
- **Flow (marketing → auth):** Splash (01) → Onboarding (02–03) → Auth entry (04) → OTP (05) / password placeholder as needed.
- **Role split:** Customer vs Professional after role selector; do not merge guards in UI copy.
- **Back:** Prefer `router.back()` when history exists; otherwise `replace` to a known safe route.
- **Deep links:** scheme `yuktione` in `app.json`.
- Bottom tabs: only on post-auth shells (e.g. professional dashboard preview) — not on splash/auth.

---

## Accessibility standards

Align with UI UX Pro Max React Native stack guidance + platform norms:

- Touch targets ≥ **44×44** (iOS) / **48×48** (Android); project CTAs use 52.
- Labels and roles on every interactive control.
- Error text associated with fields; live region for validation.
- Support Dynamic Type with reasonable `maxFontSizeMultiplier` caps on dense layouts.
- Test critical flows with TalkBack / VoiceOver before shipping auth.
- Do not convey meaning by color alone (pair with text/icons).

---

## Android / iOS responsiveness

- Layout with Flexbox; use `useWindowDimensions` for illustration heights and logo widths (already on splash/onboarding/auth).
- `KeyboardAvoidingView`: `behavior="padding"` on iOS; Android rely on window soft input + scroll (`keyboardShouldPersistTaps="handled"`).
- Respect `insets.bottom` for footers (onboarding curve, auth scroll padding).
- Portrait-first (`orientation: "portrait"`); tablet: keep centered max widths for brand blocks (~320 logo).
- Platform.select only when behavior truly differs — prefer shared tokens.

---

## Loading & error states

- Shared: `LoadingState`, `EmptyState`, `InfoBanner`.
- Fonts not ready → full-screen `LoadingState`, not blank cream.
- API not connected → honest banners/alerts; **no fake Sanctum success**.
- Inline field errors before blocking alerts when possible.

---

## Screen-by-screen consistency rules

| Screen | ID | Consistency rules |
|--------|----|-------------------|
| Splash | 01 | Full-bleed landscape; brand logo hero-level; one CTA; cream/eucalyptus; safe-area top/bottom |
| Onboarding 1 | 02 | Serif headline, DM Sans body, illustration + cream wave footer, Skip + back/next |
| Onboarding 2 | 03 | Same chrome as 02; update copy/art only; dots reflect real step count |
| Login / Sign Up | 04 | Logo, social stubs, identifier field, Continue, legal, create account, role selector, botanical rails |
| OTP | 05 | Same auth chrome family as 04; 6-digit input; resend countdown; no fake verify success |
| Password (placeholder) | 06* | Use `Screen` + `AppHeader` + banners until real API; match form spacing tokens |

\*Screen 06 is not formally numbered in routes; treat password placeholder / next design-set screen as the sixth implemented auth-adjacent surface. Do not invent a third onboarding route without a reference image.

General:

1. Match the supplied reference image first.
2. Read this document.
3. Consult UI UX Pro Max (`--stack react-native`, UX domains) for quality — do not override locked colors or references.
4. Reuse `theme`, `components/ui`, and feature components.
5. Implement only the requested screen.
6. Verify safe area, keyboard, a11y, TypeScript, ESLint.

---

## Motion system

Runtime tokens: `src/theme/motion.ts`  
Primitives: `src/components/motion/` (`FadeInView`, `PressableScale`, `ShakeView`)

| Token | Value | Use |
|-------|-------|-----|
| duration.fast | 160ms | Focus borders, press settle |
| duration.normal | 240ms | Role chips, pagination |
| duration.entrance | 420ms | Screen/block fade-in |
| press.in | 0.97 | Buttons / chips |
| press.deep | 0.94 | Splash CTA |
| offset.soft | 12px | Entrance translateY |

Rules:

- Prefer **transform + opacity** (UI UX Pro Max / RN guidance).
- Respect `useReducedMotion()` — skip decorative entrances and shake.
- Do not block navigation or form submit with animation.
- No infinite decorative loops except `LoadingSkeleton` pulse (disabled under reduce-motion).
- Stack transitions: Expo Router `fade` / onboarding `slide_from_right`.

---

## UI UX Pro Max workflow (Cursor)

Skill path: `.cursor/skills/ui-ux-pro-max/`

```bash
# Requires Python 3 on PATH (Windows: `python`)
python .cursor/skills/ui-ux-pro-max/scripts/search.py "mobile form keyboard accessibility" --domain ux
python .cursor/skills/ui-ux-pro-max/scripts/search.py "touch targets safe area" --stack react-native
```

If Python is unavailable, read CSV guidance under `.cursor/skills/ui-ux-pro-max/data/` (especially `stacks/react-native.csv` and `ux-guidelines.csv`) instead of installing Python automatically.

This skill is **not** an app runtime dependency — never add it to `package.json` production dependencies.

---

## Anti-patterns

- Replacing eucalyptus/lavender/cream/navy with generic AI purple/indigo themes
- Second competing theme system alongside `src/theme`
- Redesigning completed screens without approval
- Fake authentication or invented API success
- Cards/stat strips cluttering splash or onboarding first viewport
- Editing `public_html` or the database from mobile workstreams
