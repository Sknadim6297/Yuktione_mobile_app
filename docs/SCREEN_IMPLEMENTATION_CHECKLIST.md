# YuktiOne Mobile — Screen Implementation Checklist

Statuses: `Not Started` | `In Progress` | `Implemented` | `Verified` | `Blocked`

Pixel **Verified** only when compared against a unique PNG (image inspection / hash audit). Device screenshot capture was not run in this pass.

---

## Master screens (01–30)

| # | Screen | Reference | Route | Status | Notes |
|---|--------|-----------|-------|--------|-------|
| 01 | Splash | No PNG in `Screens/` | `/` | Implemented | Existing; no folder PNG |
| 02 | Onboarding 1 | No PNG | `/onboarding/step-1` | Implemented | Existing |
| 03 | Onboarding 2 | No PNG | `/onboarding/step-2` | Implemented | Existing |
| 04 | Login / Sign Up | No PNG | `/auth` | Implemented | Existing |
| 05 | OTP Verification | `Screen_05.png` | `/auth/verify-otp` | Implemented | Compared to PNG |
| 06 | Set Password | `Screen_06.png` (+07/08/10 dupes) | `/auth/set-password` | Implemented | Compared to PNG |
| 07 | Home — Mood Check | `Screen_11.png` (+12 dupe) | `/(tabs)/home` | Implemented | 5-tab shell vs 4-tab PNG |
| 08 | Home — Categories | Missing | — | Blocked | No unique image |
| 09 | Home — Quick Tools | `Screen_13.png` (+14 dupe) | `/(tabs)/tools` | Implemented | Compared to PNG |
| 10 | Search | Missing | `/(tabs)/explore` | Blocked | Shell only; 10.png is password dupe |
| 11 | Categories Landing | `Screen_15.png` | `/categories/[slug]` | Implemented | Mental Wellbeing |
| 12 | Tools — Category | Missing | — | Blocked | 12.png is home dupe |
| 13 | Tool Detail — Free | Missing as master name | `/tools/mood-board` etc. | Implemented | See PNG 16/20 free details |
| 14 | Tool Detail — Paid | `Screen_17` (+18/19 dupes) | `/tools/guided-questions` | Implemented | Guided Questions |
| 15 | Tool Result | Missing as master name | `/tools/mood-board/result` | Implemented | PNG 21 Mood Board Result |
| 16 | Mood Board detail | `Screen_16.png` | `/tools/mood-board` | Implemented | Free tool detail |
| 17 | Guided Questions | `Screen_17.png` (+18/19) | `/tools/guided-questions` | Implemented | Paid tool detail |
| 18 | (dupe of 17) | Duplicate PNG | — | Blocked | Same as Screen_17 |
| 19 | (dupe of 17) | Duplicate PNG | — | Blocked | Same as Screen_17 |
| 20 | Daily Reset | `Screen_20.png` | `/tools/daily-reset` | Implemented | Free tool detail |
| 21 | Mood Board Result | `Screen_21.png` | `/tools/mood-board/result` | Implemented | |
| 22 | (missing file) | Missing | — | Blocked | No PNG |
| 23 | Experts categories | `Screen_23.png` | `/(tabs)/experts` | Implemented | |
| 24 | Mental Wellbeing Experts | `Screen_24.png` | `/experts/mental-wellbeing` | Implemented | |
| 25 | My Space | Missing | `/(tabs)/my-space` | Blocked | Shell only |
| 26 | My Tools | Missing | — | Blocked | |
| 27 | My Progress | Missing | — | Blocked | |
| 28 | Professional Join | No PNG | `/professional/join` | Implemented | Existing |
| 29 | Professional Setup | No PNG | `/professional/setup/*` | Implemented | Local form only |
| 30 | Professional Dashboard | No PNG | `/professional/dashboard-preview` | Implemented | Labeled preview |

---

## Extra routes (not in master 30)

| Screen | Route | Status | Notes |
|--------|-------|--------|-------|
| Phase 1 welcome hub | `/welcome` | Implemented | Links to Home UI preview |
| Customer stub home | `/customer` | Implemented | Links to tabs |
| Customer register | `/customer/register` | Implemented | Email → OTP flow starter |
| Professional login | `/professional/login` | Implemented | UI only |
| Professional register | `/professional/register` | Implemented | Starts OTP flow |
| Professional OTP alias | `/professional/verify-otp` | Implemented | Same as Screen 05 |
| Pro status pending/rejected | `/professional/status/*` | Implemented | Local |
| Auth password (login step) | `/auth/password` | Implemented | Login-style; set-password is Screen 06 |
| Public availability | `/explore/availability` | Implemented | Public API |

---

## Unique PNG implementation targets

| Unique design | Status |
|---------------|--------|
| OTP (`Screen_05`) | Implemented |
| Set Password (`Screen_06`) | Implemented |
| Home Mood (`Screen_11`) | Implemented |
| Quick Tools (`Screen_13`) | Implemented |
| Mental Wellbeing (`Screen_15`) | Implemented |
