import type { ElementLevel, ElementType } from '../data/elements';

export type CurrencyState = {
  coins: number;
};

export type PrestigeState = {
  monsterEssence: number;
  essencePowerLevel: number;
  rareHatchLevel: number;
  totalRitualsPerformed: number;
};

export const MONSTER_FAMILIES = ['Slime', 'Mushroom', 'Spore', 'Cactus', 'Cell', 'Plant'] as const;

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
  element?: ElementType;
  elementLevel?: ElementLevel;
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

export const QUEST_GUIDE_STEP_IDS = [
  'hatch-1',
  'hatch-2',
  'merge-1',
  'income',
  'shop-open',
  'shop-buy',
  'remove-tip',
  'battle-open',
  'forge-open',
  'ritual-open',
  'essence-upgrade',
] as const;

export type QuestGuideStepId = typeof QUEST_GUIDE_STEP_IDS[number];
