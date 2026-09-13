import { render, screen } from '@testing-library/react-native';

import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders the label', async () => {
    await render(<Button label="Sign in" onPress={() => undefined} />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });
});
