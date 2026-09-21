/**
 * Phase 9 boundary / D06 honesty checks (static).
 * Complements ESLint `no-restricted-imports` for react-native-auth0.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'coverage') continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('Phase 9 security boundaries', () => {
  const files = walk(SRC);

  it('does not import react-native-auth0 outside infrastructure/auth', () => {
    const offenders = files.filter((file) => {
      const rel = path.relative(SRC, file).replace(/\\/g, '/');
      if (rel.startsWith('infrastructure/auth/')) return false;
      const text = fs.readFileSync(file, 'utf8');
      return /from ['"]react-native-auth0['"]|require\(['"]react-native-auth0['"]\)/.test(text);
    });
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it('does not use AsyncStorage or redux-persist for credentials', () => {
    const offenders = files.filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return (
        /@react-native-async-storage\/async-storage/.test(text) ||
        /redux-persist/.test(text) ||
        /AsyncStorage\.(setItem|getItem)/.test(text)
      );
    });
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it('product screens do not call loginRequest (legacy password grant)', () => {
    const presentation = files.filter((f) =>
      path.relative(SRC, f).replace(/\\/g, '/').startsWith('presentation/'),
    );
    const offenders = presentation.filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return /loginRequest|from ['"]@\/auth\/loginRequest['"]/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it('does not register custom Linking handlers for Auth0 callbacks', () => {
    const offenders = files.filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return (
        /Linking\.(addEventListener|getInitialURL)/.test(text) ||
        /useURL\s*\(/.test(text)
      );
    });
    // Auth0 SDK owns callback URLs via the config plugin + customScheme.
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});
