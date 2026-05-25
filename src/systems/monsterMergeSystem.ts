import { getNextMonsterDefinition } from '../data/monsters';
import type { MonsterDefinition } from '../types/game-state';

// Pure monster merge rules. Keep this module free of Phaser, storage, and scene state.
type MergeableMonster = Pick<MonsterDefinition, 'family' | 'level'>;

export function isSameFamilySameLevelMerge(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): boolean {
  if (!sourceMonster || !targetMonster) {
    return false;
  }

  return sourceMonster.family === targetMonster.family
    && sourceMonster.level === targetMonster.level;
}

export function getSameFamilyNextMonsterDefinition(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  if (!isSameFamilySameLevelMerge(sourceMonster, targetMonster) || !sourceMonster) {
    return undefined;
  }

  return getNextMonsterDefinition(sourceMonster.family, sourceMonster.level);
}

export function getMonsterMergeResult(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): MonsterDefinition | undefined {
  return getSameFamilyNextMonsterDefinition(sourceMonster, targetMonster);
}

export function canMergeMonsters(
  sourceMonster: MergeableMonster | null | undefined,
  targetMonster: MergeableMonster | null | undefined,
): boolean {
  return Boolean(getMonsterMergeResult(sourceMonster, targetMonster));
}
