import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PhoneNumberField } from '@/presentation/components/PhoneNumberField';

describe('PhoneNumberField', () => {
  it('renders the Create Account phone chrome', async () => {
    await render(<PhoneNumberField testID="register-phone" />);

    expect(await screen.findByTestId('register-phone-wrap')).toBeTruthy();
    expect(screen.getByTestId('register-phone')).toBeTruthy();
    expect(screen.getByLabelText('Your phone number')).toBeTruthy();
    expect(screen.getByLabelText(/United Arab Emirates/)).toBeTruthy();
  });

  it('renders without a testID', async () => {
    await render(<PhoneNumberField />);
    expect(await screen.findByLabelText('Your phone number')).toBeTruthy();
  });

  it('notifies when the number changes', async () => {
    const onChangePhoneNumber = jest.fn();
    await render(
      <PhoneNumberField onChangePhoneNumber={onChangePhoneNumber} testID="register-phone" />,
    );

    await act(async () => {
      fireEvent.changeText(await screen.findByTestId('register-phone'), '+971501234567');
    });

    expect(onChangePhoneNumber).toHaveBeenCalled();
    expect(onChangePhoneNumber.mock.calls.at(-1)?.[1]).toBe('ae');
  });
});
