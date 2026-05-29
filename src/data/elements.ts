export type ElementType = 'Spark' | 'Fire' | 'Metal' | 'Dream';
export type ElementLevel = 1 | 2 | 3;

export type ElementDefinition = {
  id: ElementType;
  name: string;
  description: string;
  color: number;
};

export type ElementFragmentInventory = Record<ElementType, number>;

export const ELEMENT_LEVELS: ElementLevel[] = [1, 2, 3];
export const ELEMENT_FORGE_APPLY_COST = 10;
export const ELEMENT_FORGE_UPGRADE_COST_BY_LEVEL: Record<ElementLevel, number> = {
  1: 10,
  2: 25,
  3: 50,
};
export const ELEMENT_INCOME_MULTIPLIER_BY_LEVEL: Record<ElementLevel, number> = {
  1: 1.1,
  2: 1.18,
  3: 1.3,
};
export const ELEMENT_BOSS_DAMAGE_MATCH_MULTIPLIER_BY_LEVEL: Record<ElementLevel, number> = {
  1: 1.25,
  2: 1.4,
  3: 1.6,
};

export const ELEMENT_DEFINITIONS: ElementDefinition[] = [
  {
    id: 'Spark',
    name: 'Spark',
    description: 'Stored charge from code and tech bosses.',
    color: 0xf8e36f,
  },
  {
    id: 'Fire',
    name: 'Fire',
    description: 'Spicy heat gathered from fire bosses.',
    color: 0xf06b3f,
  },
  {
    id: 'Metal',
    name: 'Metal',
    description: 'Fast, sturdy fragments from speed bosses.',
    color: 0xa9b7c6,
  },
  {
    id: 'Dream',
    name: 'Dream',
    description: 'Quiet sleep energy from dream bosses.',
    color: 0xb593ff,
  },
];

export const ELEMENT_TYPES = ELEMENT_DEFINITIONS.map((element) => element.id);

export function isElementType(value: unknown): value is ElementType {
  return typeof value === 'string' && ELEMENT_TYPES.includes(value as ElementType);
}

export function isElementLevel(value: unknown): value is ElementLevel {
  return typeof value === 'number' && ELEMENT_LEVELS.includes(value as ElementLevel);
}

export function normalizeElementLevel(value: unknown): ElementLevel {
  const level = Number(value);

  return isElementLevel(level) ? level : 1;
}

export function getElementForgeCost(currentElement: ElementType | undefined, currentLevel: ElementLevel | undefined, nextElement: ElementType): number {
  if (currentElement !== nextElement) {
    return ELEMENT_FORGE_UPGRADE_COST_BY_LEVEL[1];
  }

  const level = normalizeElementLevel(currentLevel);

  if (level >= 3) {
    return 0;
  }

  return ELEMENT_FORGE_UPGRADE_COST_BY_LEVEL[(level + 1) as ElementLevel];
}

export function createInitialElementFragments(): ElementFragmentInventory {
  return Object.fromEntries(ELEMENT_TYPES.map((element) => [element, 0])) as ElementFragmentInventory;
}

export function sanitizeElementFragmentAmount(value: unknown): number {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.floor(amount);
}

export function sanitizeElementFragmentInventory(raw: unknown): ElementFragmentInventory {
  const fragments = createInitialElementFragments();

  if (!isRecord(raw)) {
    return fragments;
  }

  ELEMENT_TYPES.forEach((element) => {
    fragments[element] = sanitizeElementFragmentAmount(raw[element]);
  });

  return fragments;
}

export function addElementFragments(
  inventory: ElementFragmentInventory,
  element: ElementType,
  amount: number,
): ElementFragmentInventory {
  return {
    ...inventory,
    [element]: sanitizeElementFragmentAmount(inventory[element]) + sanitizeElementFragmentAmount(amount),
  };
}

export function canAffordElementForge(
  inventory: ElementFragmentInventory,
  element: ElementType,
  cost = ELEMENT_FORGE_APPLY_COST,
): boolean {
  return sanitizeElementFragmentAmount(inventory[element]) >= sanitizeElementFragmentAmount(cost);
}

export function spendElementFragments(
  inventory: ElementFragmentInventory,
  element: ElementType,
  amount: number,
): ElementFragmentInventory {
  const safeAmount = sanitizeElementFragmentAmount(amount);

  return {
    ...inventory,
    [element]: Math.max(0, sanitizeElementFragmentAmount(inventory[element]) - safeAmount),
  };
}

export function getElementDefinition(element: ElementType): ElementDefinition {
  return ELEMENT_DEFINITIONS.find((definition) => definition.id === element) ?? ELEMENT_DEFINITIONS[0];
}

export function getElementIncomeMultiplier(element?: ElementType, level?: ElementLevel): number {
  return element ? ELEMENT_INCOME_MULTIPLIER_BY_LEVEL[normalizeElementLevel(level)] : 1;
}

export function isElementStrongAgainstBoss(
  monsterElement: ElementType | undefined,
  bossElementTheme: ElementType | undefined,
): boolean {
  return Boolean(monsterElement && bossElementTheme && monsterElement === bossElementTheme);
}

export function getElementBossDamageMultiplier(
  monsterElement: ElementType | undefined,
  monsterElementLevel: ElementLevel | undefined,
  bossElementTheme: ElementType | undefined,
): number {
  return isElementStrongAgainstBoss(monsterElement, bossElementTheme)
    ? ELEMENT_BOSS_DAMAGE_MATCH_MULTIPLIER_BY_LEVEL[normalizeElementLevel(monsterElementLevel)]
    : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
