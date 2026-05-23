import type { MonsterDefinition, MonsterFamily } from '../types/game-state';

export const BABY_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 1,
  name: 'Baby Slime',
  incomePerSecond: 1,
};

export const LEVEL_2_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 2,
  name: 'Level 2 Slime',
  incomePerSecond: 3,
};

export const LEVEL_3_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 3,
  name: 'Level 3 Slime',
  incomePerSecond: 8,
};

export const LEVEL_4_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 4,
  name: 'Horned Slime',
  incomePerSecond: 20,
};

export const LEVEL_5_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 5,
  name: 'King Slime',
  incomePerSecond: 48,
};

export const LEVEL_6_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 6,
  name: 'Crystal Slime',
  incomePerSecond: 115,
};

export const LEVEL_7_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 7,
  name: 'Ancient Slime',
  incomePerSecond: 275,
};

export const LEVEL_8_SLIME: MonsterDefinition = {
  family: 'Slime',
  level: 8,
  name: 'Galaxy Slime',
  incomePerSecond: 660,
};

export const MONSTER_DEFINITIONS: MonsterDefinition[] = [
  BABY_SLIME,
  LEVEL_2_SLIME,
  LEVEL_3_SLIME,
  LEVEL_4_SLIME,
  LEVEL_5_SLIME,
  LEVEL_6_SLIME,
  LEVEL_7_SLIME,
  LEVEL_8_SLIME,
];

export function getNextMonsterDefinition(
  family: MonsterFamily,
  currentLevel: number,
): MonsterDefinition | undefined {
  return MONSTER_DEFINITIONS.find((definition) => (
    definition.family === family
    && definition.level === currentLevel + 1
  ));
}

export function getMonsterDefinition(
  family: MonsterFamily,
  level: number,
): MonsterDefinition | undefined {
  return MONSTER_DEFINITIONS.find((definition) => (
    definition.family === family
    && definition.level === level
  ));
}
