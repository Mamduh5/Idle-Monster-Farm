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

export const MONSTER_DEFINITIONS: MonsterDefinition[] = [
  BABY_SLIME,
  LEVEL_2_SLIME,
  LEVEL_3_SLIME,
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
