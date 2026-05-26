export type CurrencyState = {
  coins: number;
};

export type PrestigeState = {
  monsterEssence: number;
  essencePowerLevel: number;
  totalRitualsPerformed: number;
};

export const MONSTER_FAMILIES = ['Slime', 'Mushroom', 'Spore'] as const;

export type MonsterFamily = typeof MONSTER_FAMILIES[number];

export function isMonsterFamily(value: unknown): value is MonsterFamily {
  return typeof value === 'string' && MONSTER_FAMILIES.includes(value as MonsterFamily);
}

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
