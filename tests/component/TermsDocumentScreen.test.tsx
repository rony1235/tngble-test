import { act, cleanup, screen } from '@testing-library/react-native';

import { TermsDocumentScreen } from '@/presentation/screens/TermsDocumentScreen';
import { renderAuthUi } from './renderAuthUi';

describe('TermsDocumentScreen', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('renders Figma Terms document chrome and body', async () => {
    await renderAuthUi(<TermsDocumentScreen />);

    expect(await screen.findByTestId('terms-document-screen')).toBeTruthy();
    expect(screen.getByText('Terms and condition')).toBeTruthy();
    expect(screen.getByText(/Welcome to TNGBLE/)).toBeTruthy();
    expect(screen.getByText('1. Nature of the Platform')).toBeTruthy();
    expect(screen.getByText('2. No Investment, Legal, or Tax Advice')).toBeTruthy();
    expect(screen.getByText(/Service Scope:/)).toBeTruthy();
  });
});
