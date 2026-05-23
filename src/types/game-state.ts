export type CurrencyState = {
  coins: number;
};

export type MonsterFamily = 'Slime';

export type MonsterDefinition = {
  family: MonsterFamily;
  level: number;
  name: string;
  incomePerSecond: number;
};

export type MonsterInstance = MonsterDefinition & {
  id: string;
};

export type FarmSlotState = {
  id: number;
  monster: MonsterInstance | null;
};

export const ONBOARDING_HINT_IDS = [
  'welcome',
  'hatch',
  'income',
  'merge',
  'upgrades',
  'offline',
] as const;

export type OnboardingHintId = typeof ONBOARDING_HINT_IDS[number];
