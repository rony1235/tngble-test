/**
 * @deprecated Legacy SecureStore session APIs removed in Phase 9.
 * Auth0 tokens use Credentials Manager only. Prefer `clearLegacySession`
 * from `@/infrastructure/storage/clearLegacySession` on sign-out.
 */
export { clearLegacySession } from '@/infrastructure/storage/clearLegacySession';
