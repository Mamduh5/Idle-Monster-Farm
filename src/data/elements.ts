export type ElementType = 'Spark' | 'Fire' | 'Metal' | 'Dream';

export type ElementDefinition = {
  id: ElementType;
  name: string;
  description: string;
  color: number;
};

export type ElementFragmentInventory = Record<ElementType, number>;

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

export function getElementDefinition(element: ElementType): ElementDefinition {
  return ELEMENT_DEFINITIONS.find((definition) => definition.id === element) ?? ELEMENT_DEFINITIONS[0];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
