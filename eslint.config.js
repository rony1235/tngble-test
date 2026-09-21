// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'android/*',
      'ios/*',
      '.artifacts/*',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/infrastructure/auth/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native-auth0',
              message:
                'Auth0 SDK is restricted to src/infrastructure/auth (AUTH-01 D06). Use AuthService / application hooks.',
            },
          ],
        },
      ],
    },
  },
]);
