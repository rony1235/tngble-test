# AUTH-01 — 200% text scale (a11y)

Sprint requirement: labels + **layout holds at 200% system text size**.

## In-repo controls

| Control | Where |
| --- | --- |
| Cap OS text scale at **2×** | `MAX_FONT_SIZE_MULTIPLIER` in `src/theme/accessibility.ts` |
| Applied on fields / CTAs / errors | `TextField`, `Button`, `ErrorBanner` |
| Flexible heights (no fixed 48 clip) | Login fields + brand/social buttons use `minHeight` |

## Manual visual audit (device)

1. Android: **Settings → Display → Font size** (or **Display size**) → largest / ~200%.  
   iOS: **Settings → Accessibility → Display & Text Size → Larger Text** → max.
2. Cold-start the app (dev client or **standalone** build).
3. Walk and confirm **no clipped labels**, **no overlapping CTAs**, scroll still works:

| Screen | Check |
| --- | --- |
| Onboarding | Title/body + Login / Create account still tappable |
| Login | Email, password, Forgot Password?, Login, social, Sign up |
| Create Account | All fields + Create Account |
| Verify OTP | Code cells + Resend |
| Terms | Agree + Accept |
| Forgot password (all steps) | Fields + primary CTA |

4. Sign off below when walked on a physical device or emulator.

| Platform | Build | Auditor | Date | Pass? |
| --- | --- | --- | --- | --- |
| Android | | | | |
| iOS | | | | |
