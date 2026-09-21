/** Public legal document URLs (replace when final hosted pages are ready). */
export const TERMS_OF_SERVICE_URL = 'https://tngble.app/terms';
export const PRIVACY_POLICY_URL = 'https://tngble.app/privacy';

export type TermsDocumentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'bullet'; label: string; text: string };

/**
 * Figma `#24 T&C Screen 6` (node 776:4223) body copy.
 * Replace when legal publishes the final document.
 */
export const TERMS_DOCUMENT_BLOCKS: TermsDocumentBlock[] = [
  {
    type: 'paragraph',
    text: 'Welcome to TNGBLE. These Terms and Conditions ("Terms") constitute a legally binding agreement governing your access to, downloading of, and use of the TNGBLE mobile application, website, smart contracts, and associated services (collectively, the "Platform").',
  },
  {
    type: 'paragraph',
    text: 'By creating an account, accessing, or utilizing the Platform in any capacity, you expressly acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to these Terms, you must not access or use the Platform.',
  },
  {
    type: 'heading',
    text: '1. Nature of the Platform',
  },
  {
    type: 'paragraph',
    text: 'TNGBLE provides a proprietary technology interface designed to facilitate the fractionalization, tokenization, and tracking of physical and digital assets on blockchain networks.',
  },
  {
    type: 'bullet',
    label: 'Service Scope:',
    text: 'We provide the software tools that allow users to view, manage, and interact with digital tokens representing fractional ownership or participation in various underlying assets.',
  },
  {
    type: 'bullet',
    label: 'Third-Party Interactions:',
    text: 'The Platform may interact with third-party protocols, decentralized applications (dApps), and blockchain networks. TNGBLE does not control these underlying networks and is not responsible for their performance, uptime, or security.',
  },
  {
    type: 'bullet',
    label: 'Asset Custody:',
    text: 'Unless explicitly stated otherwise for specific services, TNGBLE does not take custody of your digital assets or private keys. You retain full control and responsibility over your digital wallets.',
  },
  {
    type: 'heading',
    text: '2. No Investment, Legal, or Tax Advice',
  },
  {
    type: 'paragraph',
    text: 'TNGBLE operates strictly as a technology and software provider.',
  },
  {
    type: 'bullet',
    label: 'Not a Financial Institution:',
    text: 'We are not a registered broker-dealer, investment advisor, financial institution, or custodian.',
  },
  {
    type: 'bullet',
    label: 'No Endorsement:',
    text: 'The availability of any tokenized asset on the Platform does not constitute a recommendation, endorsement, or offer to sell any specific security or financial instrument.',
  },
];

/** @deprecated Prefer TERMS_DOCUMENT_BLOCKS for the Figma document screen. */
export const TERMS_PLACEHOLDER_BODY = TERMS_DOCUMENT_BLOCKS.map((block) => {
  if (block.type === 'heading') return `\n${block.text}\n`;
  if (block.type === 'bullet') return `• ${block.label} ${block.text}`;
  return block.text;
}).join('\n\n');
