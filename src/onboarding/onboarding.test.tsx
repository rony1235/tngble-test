import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { OnboardingFixedFooter } from '@/onboarding/OnboardingFixedFooter';
import { OnboardingPagination } from '@/onboarding/OnboardingPagination';
import { ONBOARDING_SLIDES } from '@/onboarding/onboarding.data';

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: View,
    BlurTargetView: React.forwardRef((props: object, ref: unknown) =>
      React.createElement(View, { ...props, ref }),
    ),
  };
});

describe('onboarding data', () => {
  it('defines six onboarding slides', () => {
    expect(ONBOARDING_SLIDES).toHaveLength(6);
    expect(ONBOARDING_SLIDES.map((slide) => slide.id)).toEqual([
      'real-estate',
      'precious-metals',
      'fine-art',
      'luxury-aviation',
      'rare-jewelry',
      'superyacht',
    ]);
  });

  it('keeps expected headlines', () => {
    expect(ONBOARDING_SLIDES[0]?.title).toContain('INVEST IN PREMIUM');
    expect(ONBOARDING_SLIDES[1]?.title).toBe('SECURE PRECIOUS METALS');
    expect(ONBOARDING_SLIDES[2]?.title).toBe('CURATE FINE ART');
    expect(ONBOARDING_SLIDES[3]?.title).toBe('ACCESS LUXURY AVIATION');
    expect(ONBOARDING_SLIDES[4]?.title).toBe('ACQUIRE RARE JEWELRY');
    expect(ONBOARDING_SLIDES[5]?.title).toBe('OWN ELITE SUPERYACHTS');
  });

  it('breaks fine-art description after museum-', () => {
    expect(ONBOARDING_SLIDES[2]?.description).toBe(
      'Access fractional ownership of iconic, museum-\ngrade masterpieces.',
    );
  });

  it('breaks luxury-aviation description after tokenized', () => {
    expect(ONBOARDING_SLIDES[3]?.description).toBe(
      'Welcome to TNGBLE tokenized\nRWA investment app.',
    );
  });
});

describe('OnboardingPagination', () => {
  afterEach(cleanup);

  it('marks the active slide indicator', async () => {
    await render(<OnboardingPagination activeIndex={2} count={6} />);
    expect(screen.getByTestId('onboarding-pagination')).toBeTruthy();
    expect(screen.getByTestId('onboarding-pagination-active')).toBeTruthy();
    expect(screen.getByLabelText('Page 3 of 6')).toBeTruthy();
  });
});

describe('OnboardingFixedFooter', () => {
  it('renders luxury-aviation copy with Figma line break', async () => {
    const slide = ONBOARDING_SLIDES[3]!;
    const view = await render(
      <OnboardingFixedFooter
        onCreateAccount={jest.fn()}
        onLogin={jest.fn()}
        slide={slide}
        slideCount={6}
        slideIndex={3}
      />,
    );

    expect(view.getByText('ACCESS LUXURY AVIATION')).toBeTruthy();
    expect(
      view.getByText('Welcome to TNGBLE tokenized\nRWA investment app.'),
    ).toBeTruthy();
    view.unmount();
  });

  it('renders fine-art copy with museum- line break', async () => {
    const slide = ONBOARDING_SLIDES[2]!;
    const view = await render(
      <OnboardingFixedFooter
        onCreateAccount={jest.fn()}
        onLogin={jest.fn()}
        slide={slide}
        slideCount={6}
        slideIndex={2}
      />,
    );

    expect(view.getByTestId('onboarding-description')).toBeTruthy();
    expect(
      view.getByText(
        'Access fractional ownership of iconic, museum-\ngrade masterpieces.',
      ),
    ).toBeTruthy();
    view.unmount();
  });

  it('renders title, description, Login, Create account, and VARA', async () => {
    const onLogin = jest.fn();
    const onCreateAccount = jest.fn();
    const slide = ONBOARDING_SLIDES[0]!;

    const view = await render(
      <OnboardingFixedFooter
        onCreateAccount={onCreateAccount}
        onLogin={onLogin}
        slide={slide}
        slideCount={6}
        slideIndex={0}
      />,
    );

    expect(view.getByTestId('onboarding-title')).toBeTruthy();
    expect(view.getByTestId('onboarding-description')).toBeTruthy();
    expect(view.getByText(/INVEST IN PREMIUM/)).toBeTruthy();
    expect(
      view.getByText('Own fractional shares of exclusive, high-yield properties worldwide'),
    ).toBeTruthy();
    expect(view.getAllByTestId('onboarding-login')).toHaveLength(1);
    expect(view.getAllByTestId('onboarding-create-account')).toHaveLength(1);
    expect(view.getByTestId('licensed-by')).toBeTruthy();
    expect(view.getByTestId('onboarding-pagination')).toBeTruthy();

    fireEvent.press(view.getByTestId('onboarding-login'));
    fireEvent.press(view.getByTestId('onboarding-create-account'));

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onCreateAccount).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
