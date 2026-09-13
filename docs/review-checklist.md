# Login design — review checklist (internal)

Hidden evaluation criteria for the login UI task. Do not share with candidates.

## Must pass

- [ ] Work landed in `app/(auth)/login.tsx` (not a new parallel route)
- [ ] Still calls `useAuth().signIn`
- [ ] Uses `@/theme/tokens` (no raw hex in the screen stylesheet)
- [ ] Reuses or extends `Button` / `TextField`
- [ ] `testID`s still present for Maestro
- [ ] Safe area + keyboard avoidance still work
- [ ] `pnpm test` and `pnpm typecheck` pass

## Nice signals

- [ ] Accessibility labels / roles
- [ ] Loading + error states handled cleanly
- [ ] No new auth/state libraries without discussion
- [ ] Small, reviewable diff

## Red flags

- Hard-coded Circle / wallet SDK in the client
- Rewriting navigation or AuthProvider “because design”
- Dropping tests / testIDs
- Copy-pasting a full UI kit without fitting tokens
