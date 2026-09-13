import type { ImageSourcePropType } from 'react-native';

import { HERO_TOP } from '@/onboarding/layout';

export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  artwork: ImageSourcePropType;
  heroWidth: number;
  heroHeight: number;
  heroTop: number;
  heroLeft: number;
};

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'real-estate',
    title: 'INVEST IN PREMIUM\nREAL ESTATE',
    description: 'Own fractional shares of exclusive, high-yield properties worldwide',
    artwork: require('../../assets/onboarding/real-estate.png'),
    heroWidth: 218,
    heroHeight: 429,
    heroTop: HERO_TOP,
    heroLeft: 79,
  },
  {
    id: 'precious-metals',
    title: 'SECURE PRECIOUS METALS',
    description: 'Build wealth with tokenized gold, silver, and rare metals',
    artwork: require('../../assets/onboarding/precious-metals.png'),
    heroWidth: 237,
    heroHeight: 426,
    heroTop: 122,
    heroLeft: 63,
  },
  {
    id: 'fine-art',
    title: 'CURATE FINE ART',
    description: 'Access fractional ownership of iconic, museum-\ngrade masterpieces.',
    artwork: require('../../assets/onboarding/fine-art.png'),
    heroWidth: 224,
    heroHeight: 427,
    heroTop: 121,
    heroLeft: 75.5,
  },
  {
    id: 'luxury-aviation',
    title: 'ACCESS LUXURY AVIATION',
    description: 'Welcome to TNGBLE tokenized\nRWA investment app.',
    artwork: require('../../assets/onboarding/luxury-aviation.png'),
    heroWidth: 216,
    heroHeight: 412,
    heroTop: 120,
    heroLeft: 79.5,
  },
  {
    id: 'rare-jewelry',
    title: 'ACQUIRE RARE JEWELRY',
    description: 'Invest in tokenized luxury diamonds and world-class gems.',
    artwork: require('../../assets/onboarding/rare-jewelry.png'),
    heroWidth: 199,
    heroHeight: 414,
    heroTop: 116,
    heroLeft: 92,
  },
  {
    id: 'superyacht',
    title: 'OWN ELITE SUPERYACHTS',
    description: 'Navigate new asset classes with tokenized superyacht investments.',
    artwork: require('../../assets/onboarding/superyacht.png'),
    heroWidth: 214,
    heroHeight: 395,
    heroTop: 135,
    heroLeft: 80,
  },
];

export const ONBOARDING_SLIDE_COUNT = ONBOARDING_SLIDES.length;
