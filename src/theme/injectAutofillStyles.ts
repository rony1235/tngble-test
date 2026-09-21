import { Platform } from 'react-native';

import { colors } from '@/theme/tokens';

const STYLE_ID = 'tngble-autofill-override';

type WebDocument = {
  getElementById: (id: string) => unknown;
  createElement: (tag: string) => { id: string; textContent: string };
  head?: { appendChild: (node: { id: string; textContent: string }) => void };
};

/**
 * Chrome/Safari paint a yellow (or pale) fill on autofilled inputs.
 * RN Web cannot target `:-webkit-autofill` via StyleSheet.
 */
export function injectAutofillStyles(): void {
  if (Platform.OS !== 'web') return;

  const doc = (globalThis as { document?: WebDocument }).document;
  if (!doc?.head || doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px ${colors.inputFill} inset !important;
  box-shadow: 0 0 0 1000px ${colors.inputFill} inset !important;
  -webkit-text-fill-color: ${colors.white} !important;
  caret-color: ${colors.white};
  background-color: ${colors.inputFill} !important;
  transition: background-color 99999s ease-out 0s;
}
`;
  doc.head.appendChild(style);
}
