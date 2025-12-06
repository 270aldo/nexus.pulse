export interface TrialStatus {
  startedAt: Date;
  daysRemaining: number;
  expired: boolean;
}

const TRIAL_STORAGE_KEY = 'pulse_trial_started_at';

const parseStoredDate = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getTrialStatus = (trialLengthDays: number): TrialStatus => {
  const today = new Date();
  let startedAt = today;

  if (typeof window !== 'undefined') {
    const storedValue = localStorage.getItem(TRIAL_STORAGE_KEY);
    const storedDate = parseStoredDate(storedValue);

    if (storedDate) {
      startedAt = storedDate;
    } else {
      localStorage.setItem(TRIAL_STORAGE_KEY, today.toISOString());
      startedAt = today;
    }
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.floor((today.getTime() - startedAt.getTime()) / msPerDay);
  const daysRemaining = Math.max(0, trialLengthDays - elapsedDays);

  return {
    startedAt,
    daysRemaining,
    expired: daysRemaining <= 0
  };
};

export const resetTrialStart = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TRIAL_STORAGE_KEY);
  }
};
