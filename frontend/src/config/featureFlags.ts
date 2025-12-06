export const featureFlags = {
  isLiteMode: String(import.meta.env.VITE_PULSE_LITE ?? import.meta.env.PULSE_LITE ?? '').toLowerCase() === 'true',
  weeklyPdfReportsEnabled: true,
  aiTipOfDayEnabled: true,
  trialLengthDays: Number(import.meta.env.VITE_TRIAL_LENGTH_DAYS ?? 30),
  genesisUpgradeUrl: (import.meta.env.VITE_GENESIS_UPGRADE_URL as string) || 'https://genesis.ngx.ai'
};

export type FeatureFlags = typeof featureFlags;
