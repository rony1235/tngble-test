# AUTH-01 — 200% text scale (a11y)

Sprint requirement: accessibility **labels** + **layout holds at 200% system text size**.

## Status

| Item | Status |
| --- | --- |
| Accessibility labels / roles on auth CTAs | **Done** (Login, Register, Verify, Forgot, Onboarding, Terms) |
| `maxFontSizeMultiplier` cap at 2× | **Done** — `TextField`, `Button` (+ `ErrorBanner` inherits via theme text) |
| Flexible control heights (no fixed 48 clip) | **Done** on primary auth fields / brand buttons |
| Manual visual audit at ~200% on device | **Pending** — use checklist below (Android Dev Client or standalone APK) |

## In-repo controls

| Control | Where |
| --- | --- |
| Cap OS text scale at **2×** | `MAX_FONT_SIZE_MULTIPLIER` in `src/theme/accessibility.ts` |
| Applied on fields / CTAs | `TextField`, `Button` |
| Flexible heights | Login / register fields + brand/social buttons use `minHeight` |

## Manual visual audit (device)

1. Android: **Settings → Display → Font size** (or **Display size**) → largest / ~200%.  
   iOS: **Settings → Accessibility → Display & Text Size → Larger Text** → max.
2. Cold-start the app (dev client or **standalone** build — see [`android-standalone-build.md`](./android-standalone-build.md)).
3. Walk and confirm **no clipped labels**, **no overlapping CTAs**, scroll still works:

| Screen | Check |
| --- | --- |
| Onboarding | Title/body + Login / Create account still tappable |
| Login | Email, password, Forgot Password?, Login, social, Sign up |
| Create Account | All fields + Create Account |
| Verify OTP | Code cells + Resend |
| Terms | Agree + Accept |
| Forgot password (all steps) | Fields + primary CTA |

4. Sign off when walked on a physical device or emulator.

| Platform | Build | Auditor | Date | Pass? |
| --- | --- | --- | --- | --- |
| Android | Dev Client (`iv8h955t4tbiizee`) | | | Pending |
| Android | Standalone APK | | | Pending |
| iOS | | | | Pending |
