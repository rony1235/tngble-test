type AccessTokenAccessor = () => Promise<string | null>;

let accessor: AccessTokenAccessor | null = null;

/** Wired by ApplicationAuthProvider / AppProviders for non-React callers (e.g. api client). */
export function setAccessTokenAccessor(next: AccessTokenAccessor | null): void {
  accessor = next;
}

export async function getAccessTokenFromAuthService(): Promise<string | null> {
  if (!accessor) return null;
  return accessor();
}
