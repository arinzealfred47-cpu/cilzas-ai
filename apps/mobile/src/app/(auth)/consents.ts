export const CONSENTS = [
  { key: 'legal', label: 'Legal Policy' },
  { key: 'refund', label: 'Refund Policy' },
  { key: 'terms', label: 'Terms of Service' },
  { key: 'privacy', label: 'Privacy Policy' },
] as const;

export type ConsentKey = (typeof CONSENTS)[number]['key'];
