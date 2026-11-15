# YuktiOne Mobile — Screen Design Audit

**Audit date:** 2026-11-08  
**Reference folder:** `yukti-mobile-app/Screens/`  
**Website (read-only):** `public_html`  
**Rule:** Images are the master visual reference. Missing images are Blocked — not invented.

---

## Inventory summary

| Metric | Count |
|--------|------:|
| PNG files discovered | 18 |
| Unique designs (by SHA-256) | 11 |
| Duplicate copies | 7 |
| Master list screens (01–30) | 30 |
| Newly added unique PNGs | 16, 17, 20, 21, 23, 24 |
| Still missing / blocked | 01–04 images, 08–10 true designs, 22, 25–30 pixel refs |

### File hashes

| File | Bytes | SHA-256 | Unique design |
|------|------:|---------|---------------|
| `Screen_05.png` | 1,345,453 | `A660EC7582AC…E062B0` | OTP Verification |
| `Screen_06.png` | 1,398,991 | `C64C5F19C7B4…BAC352` | Set your password |
| `Screen_07.png` | 1,398,991 | same as 06 | **Duplicate of 06** |
| `Screen_08.png` | 1,398,991 | same as 06 | **Duplicate of 06** |
| `Screen_10.png` | 1,398,991 | same as 06 | **Duplicate of 06** |
| `Screen_11.png` | 2,054,636 | `1D863BC77A77…26C97A` | Home — Mood Check |
| `Screen_12.png` | 2,054,636 | same as 11 | **Duplicate of 11** |
| `Screen_13.png` | 1,353,145 | `2E33D226713D…B73E43` | Quick Tools |
| `Screen_14.png` | 1,353,145 | same as 13 | **Duplicate of 13** |
| `Screen_15.png` | 1,359,588 | `48C40F08C673…666B6D7A33` | Mental Wellbeing category |

**Missing from folder:** `Screen_01`–`04`, `Screen_09`, and any files for masters 16–30.

---

## Design conflicts

1. **Mislabeled duplicates:** Filenames 07, 08, 10 contain Set Password (06), not Home Mood / Categories / Search.
2. **Bottom nav clash:** Home PNG uses 4 tabs (`Home | Explore | My Space | Profile`); Quick Tools PNG uses 5 (`Home | Explore | Tools | Experts | My Space`). **App standard:** 5-tab shell from Screen_13/14.
3. **Password rules:** Screen_06 requires 8+ / upper / lower / digit. Laravel customer login uses **min 6**. Mobile Set Password UI follows the image; mismatch documented.

---

## Per-image audit (unique designs only)

### Screen_05.png — OTP Verification (Master 05)

| Field | Detail |
|-------|--------|
| Purpose | Enter 6-digit email OTP during registration |
| Header | Back chevron; YuktiOne logo + tagline; botanical corners |
| Main | “Enter 6-digit code”; “We've sent it to”; email; 6 OTP cells; resend countdown |
| CTA | Continue (pill, eucalyptus) |
| Bottom nav | None |
| Interactions | Digit entry, paste/autofill, resend, continue, back |
| Destinations | Back → prior auth; Continue → Set Password (after real verify) |
| Data | Email, role, OTP purpose (in-memory) |
| APIs | Mobile OTP send/verify/resend (missing) |

### Screen_06.png (+07/08/10 dupes) — Set your password (Master 06)

| Field | Detail |
|-------|--------|
| Purpose | Create account password after OTP |
| Header | Back; logo; botanicals |
| Main | Title; subtitle; password + confirm (lock + visibility); “Password must:” checklist |
| CTA | Create Account |
| Bottom nav | None |
| Interactions | Toggle visibility; live checklist; create |
| Destinations | Back → OTP; Create → unavailable until API (optional Home UI preview) |
| Data | Password (never logged); registration context |
| APIs | Register / set-password Sanctum endpoints (missing) |

### Screen_11.png (+12 dupe) — Home Mood (Master 07)

| Field | Detail |
|-------|--------|
| Purpose | Personalized home: mood check, search, journey, quick actions |
| Header | Logo; bell (badge); avatar |
| Main | Greeting; mood chips; search; Wellness Journey card; Quick Actions grid |
| Bottom nav | PNG: 4 tabs — **app uses 5-tab standard** |
| Interactions | Mood select; search → Explore; journey/actions → category/tools/website |
| Data | Display name (preview if no profile); mood local state |
| APIs | Profile, mood, journey progress, notifications (missing) |

### Screen_13.png (+14 dupe) — Quick Tools (Master 09)

| Field | Detail |
|-------|--------|
| Purpose | List wellness tools with Free/Paid badges |
| Header | Logo; notification bell |
| Main | “Quick Tools”; 4 cards (Mood Board, Journal, Guided Questions, Daily Reset) |
| Bottom nav | 5 tabs; Home active in PNG (Tools route uses Tools tab) |
| Interactions | Open tool detail preview |
| Data | Tool catalog (preview labels until API) |
| APIs | Tools list / entitlement (missing) |

### Screen_15.png — Mental Wellbeing (Master 11 Categories Landing)

| Field | Detail |
|-------|--------|
| Purpose | Category hub with Tools / Experts / Programmes segments |
| Header | Back; title “Mental Wellbeing” |
| Main | Gradient hero; segment control; tool cards |
| Bottom nav | None (drill-in) |
| Interactions | Segment switch; card → tool/expert/programme (preview/unavailable) |
| Data | Category slug; segment; preview tool list |
| APIs | Category tools/experts/programmes (missing) |

---

## Master 01–30 mapping

| # | Master title | PNG status | Route (target) | Notes |
|---|--------------|------------|----------------|-------|
| 01 | Splash | No PNG in folder | `/` | Existing implementation |
| 02 | Onboarding 1 | No PNG | `/onboarding/step-1` | Existing |
| 03 | Onboarding 2 | No PNG | `/onboarding/step-2` | Existing |
| 04 | Login / Sign Up | No PNG | `/auth` | Existing |
| 05 | OTP Verification | `Screen_05.png` | `/auth/verify-otp` | Implemented |
| 06 | Set Password | `Screen_06.png` (+dupes) | `/auth/set-password` | Rebuild to match PNG |
| 07 | Home — Mood Check | `Screen_11/12.png` | `/(tabs)/home` | Filename conflict |
| 08 | Home — Categories | **Missing** | — | Blocked |
| 09 | Home — Quick Tools | `Screen_13/14.png` | `/(tabs)/tools` | Filename conflict |
| 10 | Search | **Missing** (10.png is password dupe) | `/(tabs)/explore` | Shell only / Blocked pixel |
| 11 | Categories Landing | `Screen_15.png` | `/categories/[slug]` | Mental Wellbeing |
| 12 | Tools — Category | **Missing** (12.png is home dupe) | — | Blocked |
| 13 | Tool Detail — Free | **Missing** (13.png is Quick Tools) | `/tools/[id]` | Preview shell |
| 14 | Tool Detail — Paid | **Missing** | `/tools/[id]` | Preview shell |
| 15 | Tool Result | **Missing** (15.png is category) | — | Blocked |
| 16–30 | Experts → Pro Dashboard | **Missing** | partial pro routes exist | Blocked for pixel match |

---

## Laravel rules (read-only)

- OTP: 6 digits, ~10 minute expiry (customer `OtpService`; professional session OTP).
- Customer login password: min length **6** on website.
- Professional status: pending / accepted / rejected.
- Website has tools, experts, bookings, payments, programmes — **no mobile Sanctum OTP/auth/booking APIs yet**.
- Mobile must call Laravel API only; never MySQL directly.

---

## APIs still required

- Auth: register, login, logout, Sanctum token
- OTP: send, verify, resend
- Profile / mood / notifications
- Tools catalog + entitlement + run/result
- Experts list + profile + availability
- Booking + payment + confirmation
- Programmes + lessons
- My Space / progress
- Professional application submit + dashboard feeds
