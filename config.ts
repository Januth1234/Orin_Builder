export const APP_CONFIG = {
  platformName:    'Orin AI',
  subProductName:  'Orin Builder',
  version:         '0.1.0',
  branding:        '© 2026 JN Productions • Orin AI',
  owner:           'JN Productions',
  legalEntity:     'JN Productions Global',
  mainAppUrl:      'https://www.orinai.org',
  builderUrl:      'https://builder.orinai.org',
  sloganEn:        'From a Sri Lankan to Sri Lankans.',
  defaultModel:    'gemini-2.0-flash',
  premiumModel:    'gemini-2.5-pro-preview-05-06',
} as const;

export const SSO_PARAM = 'ot';        // ?ot=<firebase_id_token> from main app

export const FIRESTORE = {
  builderProjects: 'builder_projects',
  users:           'users',
} as const;

export const PLAN_LIMITS: Record<string, { buildsPerDay: number; premiumModel: boolean }> = {
  'Free':             { buildsPerDay: 3,   premiumModel: false },
  'Basic':            { buildsPerDay: 20,  premiumModel: false },
  'Pro (BYO-Google)': { buildsPerDay: 999, premiumModel: true  },
  'Verified Member':  { buildsPerDay: 999, premiumModel: true  },
};
