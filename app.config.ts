import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Must match authorize/clearSession customScheme and app.json scheme. */
export const AUTH0_CUSTOM_SCHEME = 'tngble';

/**
 * Auth0 native config plugin requires a domain at prebuild time.
 * Prefer EXPO_PUBLIC_AUTH0_DOMAIN; placeholder only allows tooling without secrets.
 * Never ship a release build still using the placeholder.
 */
function resolveAuth0Domain(): string {
  const fromEnv = process.env.EXPO_PUBLIC_AUTH0_DOMAIN?.trim();
  if (fromEnv) return fromEnv;
  return 'YOUR_AUTH0_DOMAIN.auth0.com';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: ExpoConfig['plugins'] = [...(config.plugins ?? [])];

  plugins.push([
    'react-native-auth0',
    {
      domain: resolveAuth0Domain(),
      customScheme: AUTH0_CUSTOM_SCHEME,
    },
  ]);
  plugins.push('./plugins/withTransparentAutofillHighlight');

  return {
    ...config,
    name: config.name ?? 'TNGBLE',
    slug: config.slug ?? 'tngble',
    scheme: config.scheme ?? AUTH0_CUSTOM_SCHEME,
    plugins,
    extra: {
      ...config.extra,
      auth0: {
        customScheme: AUTH0_CUSTOM_SCHEME,
      },
    },
  };
};
