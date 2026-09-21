import fs from 'fs';
import path from 'path';

import { AUTH0_CUSTOM_SCHEME } from '@/infrastructure/auth/Auth0Config';

/**
 * Phase 9 — keep debug and release on the same Auth0 custom scheme.
 * A debug-only scheme that works locally and fails signed is a classic AUTH-01 regression.
 */
describe('Auth0 customScheme consistency', () => {
  it('Auth0Config, app.config.ts, and app.json all use tngble', () => {
    const root = path.join(__dirname, '../..');
    const appConfig = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
    const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')) as {
      expo: { scheme?: string };
    };

    expect(AUTH0_CUSTOM_SCHEME).toBe('tngble');
    expect(appJson.expo.scheme).toBe('tngble');
    expect(appConfig).toMatch(/customScheme:\s*AUTH0_CUSTOM_SCHEME/);
    expect(appConfig).toMatch(/export const AUTH0_CUSTOM_SCHEME = 'tngble'/);
  });
});
