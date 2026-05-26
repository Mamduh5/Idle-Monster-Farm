import type { MonsterDefinition, MonsterFamily } from '../types/game-state';

export type DiscoveryKey = `${MonsterFamily}:${number}`;

export type ParsedDiscoveryKey = {
  family: MonsterFamily;
  level: number;
};

export type CompendiumListItem =
  | {
    type: 'family';
    family: MonsterFamily;
  }
  | {
    type: 'monster';
    monster: MonsterDefinition;
  };

export type FamilyDiscoveryProgress = {
  family: MonsterFamily;
  discovered: number;
  total: number;
};

export function createDiscoveryKey(family: MonsterFamily, level: number): DiscoveryKey {
  return `${family}:${level}`;
}

export function parseDiscoveryKey(discoveryKey: DiscoveryKey): ParsedDiscoveryKey {
  const [family, level] = discoveryKey.split(':');

  return {
    family: family as MonsterFamily,
    level: Number(level),
  };
}

export function isMonsterDiscovered(
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  monster: MonsterDefinition,
): boolean {
  return discoveredMonsters.has(createDiscoveryKey(monster.family, monster.level));
}

export function discoverMonster(
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  monster: MonsterDefinition,
): Set<DiscoveryKey> {
  const nextDiscoveredMonsters = new Set(discoveredMonsters);
  nextDiscoveredMonsters.add(createDiscoveryKey(monster.family, monster.level));
  return nextDiscoveredMonsters;
}

export function discoverMonsters(
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  monsters: readonly MonsterDefinition[],
): Set<DiscoveryKey> {
  return monsters.reduce(
    (nextDiscoveredMonsters, monster) => discoverMonster(nextDiscoveredMonsters, monster),
    new Set(discoveredMonsters),
  );
}

export function hasDiscoveredFamily(
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  family: MonsterFamily,
): boolean {
  return Array.from(discoveredMonsters).some((discoveryKey) => parseDiscoveryKey(discoveryKey).family === family);
}

export function getDiscoveredMonsterCount(
  monsterDefinitions: readonly MonsterDefinition[],
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
): number {
  return monsterDefinitions.filter((monster) => isMonsterDiscovered(discoveredMonsters, monster)).length;
}

export function getFamilyDiscoveredCount(
  monsterDefinitions: readonly MonsterDefinition[],
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  family: MonsterFamily,
): number {
  return monsterDefinitions
    .filter((monster) => monster.family === family && isMonsterDiscovered(discoveredMonsters, monster))
    .length;
}

export function getFamilyTotalCount(
  monsterDefinitions: readonly MonsterDefinition[],
  family: MonsterFamily,
): number {
  return monsterDefinitions.filter((monster) => monster.family === family).length;
}

export function getFamilyProgress(
  monsterDefinitions: readonly MonsterDefinition[],
  discoveredMonsters: ReadonlySet<DiscoveryKey>,
  familyOrder: readonly MonsterFamily[],
): FamilyDiscoveryProgress[] {
  return familyOrder.map((family) => ({
    family,
    discovered: getFamilyDiscoveredCount(monsterDefinitions, discoveredMonsters, family),
    total: getFamilyTotalCount(monsterDefinitions, family),
  }));
}

export function getCompendiumListItems(
  monsterDefinitions: readonly MonsterDefinition[],
  familyOrder: readonly MonsterFamily[],
): CompendiumListItem[] {
  return familyOrder.flatMap<CompendiumListItem>((family) => {
    const definitions = monsterDefinitions
      .filter((definition) => definition.family === family)
      .sort((first, second) => first.level - second.level);

    return [
      { type: 'family', family },
      ...definitions.map((monster) => ({ type: 'monster' as const, monster })),
    ];
  });
}

export function getCompendiumPageItems(
  items: readonly CompendiumListItem[],
  pageIndex: number,
  rowsPerPage: number,
): CompendiumListItem[] {
  return items.slice(pageIndex * rowsPerPage, (pageIndex + 1) * rowsPerPage);
}

export function getCompendiumPageCount(
  items: readonly CompendiumListItem[],
  rowsPerPage: number,
): number {
  return Math.max(1, Math.ceil(items.length / Math.max(1, rowsPerPage)));
}

export function clampCompendiumPageIndex(pageIndex: number, pageCount: number): number {
  return Math.min(Math.max(pageIndex, 0), Math.max(0, pageCount - 1));
}

export function getCompendiumPageFamilies(
  pageItems: readonly CompendiumListItem[],
): MonsterFamily[] {
  return Array.from(new Set(pageItems.map((item) => (
    item.type === 'family' ? item.family : item.monster.family
  ))));
}
