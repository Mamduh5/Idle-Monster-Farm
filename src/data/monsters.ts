import type { MonsterDefinition, MonsterFamily } from '../types/game-state';

export type MonsterLevelDefinition = {
  level: number;
  name: string;
  incomePerSecond: number;
};

export type MonsterFamilyDefinition = {
  family: MonsterFamily;
  levels: MonsterLevelDefinition[];
};

export const MONSTER_FAMILY_DEFINITIONS: MonsterFamilyDefinition[] = [
  {
    family: 'Slime',
    levels: [
      { level: 1, name: 'Baby Slime', incomePerSecond: 2 },
      { level: 2, name: 'Level 2 Slime', incomePerSecond: 6 },
      { level: 3, name: 'Level 3 Slime', incomePerSecond: 16 },
      { level: 4, name: 'Horned Slime', incomePerSecond: 38 },
      { level: 5, name: 'King Slime', incomePerSecond: 88 },
      { level: 6, name: 'Crystal Slime', incomePerSecond: 205 },
      { level: 7, name: 'Ancient Slime', incomePerSecond: 480 },
      { level: 8, name: 'Galaxy Slime', incomePerSecond: 1120 },
      { level: 9, name: 'Nebula Slime', incomePerSecond: 2600 },
      { level: 10, name: 'Solar Slime', incomePerSecond: 6000 },
      { level: 11, name: 'Eclipse Slime', incomePerSecond: 13800 },
      { level: 12, name: 'Cosmic Slime', incomePerSecond: 32000 },
      { level: 13, name: 'Stardust Slime', incomePerSecond: 74000 },
      { level: 14, name: 'Nova Slime', incomePerSecond: 170000 },
      { level: 15, name: 'Eternal Slime', incomePerSecond: 390000 },
    ],
  },
  {
    family: 'Mushroom',
    levels: [
      { level: 1, name: 'Button Mushroom', incomePerSecond: 4 },
      { level: 2, name: 'Spotted Mushroom', incomePerSecond: 12 },
      { level: 3, name: 'Elder Mushroom', incomePerSecond: 34 },
      { level: 4, name: 'Mystic Mushroom', incomePerSecond: 92 },
      { level: 5, name: 'Giant Mushroom', incomePerSecond: 250 },
      { level: 6, name: 'Mooncap Mushroom', incomePerSecond: 620 },
      { level: 7, name: 'Starlit Mushroom', incomePerSecond: 1500 },
      { level: 8, name: 'Worldcap Mushroom', incomePerSecond: 3600 },
      { level: 9, name: 'Dreamcap Mushroom', incomePerSecond: 8600 },
      { level: 10, name: 'Starcap Mushroom', incomePerSecond: 20500 },
      { level: 11, name: 'Crystalcap Mushroom', incomePerSecond: 49000 },
      { level: 12, name: 'Eclipse Mushroom', incomePerSecond: 116000 },
      { level: 13, name: 'Nebula Mushroom', incomePerSecond: 275000 },
      { level: 14, name: 'Celestial Mushroom', incomePerSecond: 650000 },
      { level: 15, name: 'Eternal Mushroom', incomePerSecond: 1500000 },
    ],
  },
  {
    family: 'Spore',
    levels: [
      { level: 1, name: 'Sporeling', incomePerSecond: 5 },
      { level: 2, name: 'Bouncy Spore', incomePerSecond: 15 },
      { level: 3, name: 'Bloom Spore', incomePerSecond: 42 },
      { level: 4, name: 'Elder Spore', incomePerSecond: 120 },
      { level: 5, name: 'Royal Spore', incomePerSecond: 340 },
      { level: 6, name: 'Cosmic Spore', incomePerSecond: 950 },
      { level: 7, name: 'Astral Spore', incomePerSecond: 2600 },
      { level: 8, name: 'Dream Spore', incomePerSecond: 7200 },
      { level: 9, name: 'Mythic Spore', incomePerSecond: 20000 },
      { level: 10, name: 'Eternal Spore', incomePerSecond: 55000 },
      { level: 11, name: 'Solar Spore', incomePerSecond: 130000 },
      { level: 12, name: 'Eclipse Spore', incomePerSecond: 305000 },
      { level: 13, name: 'Nebula Spore', incomePerSecond: 720000 },
      { level: 14, name: 'Celestial Spore', incomePerSecond: 1700000 },
      { level: 15, name: 'Infinite Spore', incomePerSecond: 4000000 },
    ],
  },
  {
    family: 'Cactus',
    levels: [
      { level: 1, name: 'Tiny Cactus', incomePerSecond: 7 },
      { level: 2, name: 'Prickly Cactus', incomePerSecond: 22 },
      { level: 3, name: 'Bloom Cactus', incomePerSecond: 64 },
      { level: 4, name: 'Barrel Cactus', incomePerSecond: 180 },
      { level: 5, name: 'Guardian Cactus', incomePerSecond: 510 },
      { level: 6, name: 'Crystal Cactus', incomePerSecond: 1450 },
      { level: 7, name: 'Desert Cactus', incomePerSecond: 4100 },
      { level: 8, name: 'Mirage Cactus', incomePerSecond: 11500 },
      { level: 9, name: 'Thorn King Cactus', incomePerSecond: 32500 },
      { level: 10, name: 'Solar Cactus', incomePerSecond: 92000 },
      { level: 11, name: 'Oasis Cactus', incomePerSecond: 260000 },
      { level: 12, name: 'Ancient Cactus', incomePerSecond: 730000 },
      { level: 13, name: 'Starbloom Cactus', incomePerSecond: 2050000 },
      { level: 14, name: 'Cosmic Cactus', incomePerSecond: 5750000 },
      { level: 15, name: 'Eternal Cactus', incomePerSecond: 16000000 },
    ],
  },
  {
    family: 'Cell',
    levels: [
      { level: 1, name: 'Tiny Cell', incomePerSecond: 6 },
      { level: 2, name: 'Bouncy Cell', incomePerSecond: 18 },
      { level: 3, name: 'Glow Cell', incomePerSecond: 52 },
      { level: 4, name: 'Split Cell', incomePerSecond: 145 },
      { level: 5, name: 'Core Cell', incomePerSecond: 420 },
      { level: 6, name: 'Crystal Cell', incomePerSecond: 1180 },
      { level: 7, name: 'Pulse Cell', incomePerSecond: 3350 },
      { level: 8, name: 'Nebula Cell', incomePerSecond: 9400 },
      { level: 9, name: 'Plasma Cell', incomePerSecond: 26500 },
      { level: 10, name: 'Solar Cell', incomePerSecond: 74000 },
      { level: 11, name: 'Eclipse Cell', incomePerSecond: 190000 },
      { level: 12, name: 'Cosmic Cell', incomePerSecond: 520000 },
      { level: 13, name: 'Star Cell', incomePerSecond: 1420000 },
      { level: 14, name: 'Nova Cell', incomePerSecond: 3900000 },
      { level: 15, name: 'Eternal Cell', incomePerSecond: 10500000 },
    ],
  },
  {
    family: 'Plant',
    levels: [
      { level: 1, name: 'Tiny Sprout', incomePerSecond: 9 },
      { level: 2, name: 'Leaf Sprout', incomePerSecond: 28 },
      { level: 3, name: 'Bloom Sprout', incomePerSecond: 82 },
      { level: 4, name: 'Vine Plant', incomePerSecond: 235 },
      { level: 5, name: 'Guardian Plant', incomePerSecond: 680 },
      { level: 6, name: 'Crystal Plant', incomePerSecond: 1950 },
      { level: 7, name: 'Grove Plant', incomePerSecond: 5600 },
      { level: 8, name: 'Dream Plant', incomePerSecond: 15800 },
      { level: 9, name: 'Thornbloom Plant', incomePerSecond: 45000 },
      { level: 10, name: 'Solar Plant', incomePerSecond: 128000 },
      { level: 11, name: 'Oasis Plant', incomePerSecond: 360000 },
      { level: 12, name: 'Ancient Plant', incomePerSecond: 1020000 },
      { level: 13, name: 'Starbloom Plant', incomePerSecond: 2850000 },
      { level: 14, name: 'Cosmic Plant', incomePerSecond: 8000000 },
      { level: 15, name: 'Eternal Plant', incomePerSecond: 22000000 },
    ],
  },
];

export const MONSTER_DEFINITIONS: MonsterDefinition[] = MONSTER_FAMILY_DEFINITIONS.flatMap((familyDefinition) => (
  familyDefinition.levels.map((levelDefinition) => ({
    family: familyDefinition.family,
    ...levelDefinition,
  }))
));

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

function requireMonsterDefinition(family: MonsterFamily, level: number): MonsterDefinition {
  const definition = getMonsterDefinition(family, level);

  if (!definition) {
    throw new Error(`Missing monster definition: ${family} level ${level}`);
  }

  return definition;
}

export const BABY_SLIME = requireMonsterDefinition('Slime', 1);
export const LEVEL_2_SLIME = requireMonsterDefinition('Slime', 2);
export const LEVEL_3_SLIME = requireMonsterDefinition('Slime', 3);
export const LEVEL_4_SLIME = requireMonsterDefinition('Slime', 4);
export const LEVEL_5_SLIME = requireMonsterDefinition('Slime', 5);
export const LEVEL_6_SLIME = requireMonsterDefinition('Slime', 6);
export const LEVEL_7_SLIME = requireMonsterDefinition('Slime', 7);
export const LEVEL_8_SLIME = requireMonsterDefinition('Slime', 8);
export const LEVEL_9_SLIME = requireMonsterDefinition('Slime', 9);
export const LEVEL_10_SLIME = requireMonsterDefinition('Slime', 10);
export const LEVEL_11_SLIME = requireMonsterDefinition('Slime', 11);
export const LEVEL_12_SLIME = requireMonsterDefinition('Slime', 12);
export const LEVEL_13_SLIME = requireMonsterDefinition('Slime', 13);
export const LEVEL_14_SLIME = requireMonsterDefinition('Slime', 14);
export const LEVEL_15_SLIME = requireMonsterDefinition('Slime', 15);

export const BUTTON_MUSHROOM = requireMonsterDefinition('Mushroom', 1);
export const SPOTTED_MUSHROOM = requireMonsterDefinition('Mushroom', 2);
export const ELDER_MUSHROOM = requireMonsterDefinition('Mushroom', 3);
export const MYSTIC_MUSHROOM = requireMonsterDefinition('Mushroom', 4);
export const GIANT_MUSHROOM = requireMonsterDefinition('Mushroom', 5);
export const LEVEL_6_MUSHROOM = requireMonsterDefinition('Mushroom', 6);
export const LEVEL_7_MUSHROOM = requireMonsterDefinition('Mushroom', 7);
export const LEVEL_8_MUSHROOM = requireMonsterDefinition('Mushroom', 8);
export const LEVEL_9_MUSHROOM = requireMonsterDefinition('Mushroom', 9);
export const LEVEL_10_MUSHROOM = requireMonsterDefinition('Mushroom', 10);
export const LEVEL_11_MUSHROOM = requireMonsterDefinition('Mushroom', 11);
export const LEVEL_12_MUSHROOM = requireMonsterDefinition('Mushroom', 12);
export const LEVEL_13_MUSHROOM = requireMonsterDefinition('Mushroom', 13);
export const LEVEL_14_MUSHROOM = requireMonsterDefinition('Mushroom', 14);
export const LEVEL_15_MUSHROOM = requireMonsterDefinition('Mushroom', 15);

export const SPORELING = requireMonsterDefinition('Spore', 1);
export const BOUNCY_SPORE = requireMonsterDefinition('Spore', 2);
export const BLOOM_SPORE = requireMonsterDefinition('Spore', 3);
export const ELDER_SPORE = requireMonsterDefinition('Spore', 4);
export const ROYAL_SPORE = requireMonsterDefinition('Spore', 5);
export const COSMIC_SPORE = requireMonsterDefinition('Spore', 6);
export const ASTRAL_SPORE = requireMonsterDefinition('Spore', 7);
export const DREAM_SPORE = requireMonsterDefinition('Spore', 8);
export const MYTHIC_SPORE = requireMonsterDefinition('Spore', 9);
export const ETERNAL_SPORE = requireMonsterDefinition('Spore', 10);
export const LEVEL_11_SPORE = requireMonsterDefinition('Spore', 11);
export const LEVEL_12_SPORE = requireMonsterDefinition('Spore', 12);
export const LEVEL_13_SPORE = requireMonsterDefinition('Spore', 13);
export const LEVEL_14_SPORE = requireMonsterDefinition('Spore', 14);
export const LEVEL_15_SPORE = requireMonsterDefinition('Spore', 15);

export const TINY_CACTUS = requireMonsterDefinition('Cactus', 1);
export const PRICKLY_CACTUS = requireMonsterDefinition('Cactus', 2);
export const BLOOM_CACTUS = requireMonsterDefinition('Cactus', 3);
export const BARREL_CACTUS = requireMonsterDefinition('Cactus', 4);
export const GUARDIAN_CACTUS = requireMonsterDefinition('Cactus', 5);
export const CRYSTAL_CACTUS = requireMonsterDefinition('Cactus', 6);
export const DESERT_CACTUS = requireMonsterDefinition('Cactus', 7);
export const MIRAGE_CACTUS = requireMonsterDefinition('Cactus', 8);
export const THORN_KING_CACTUS = requireMonsterDefinition('Cactus', 9);
export const SOLAR_CACTUS = requireMonsterDefinition('Cactus', 10);
export const OASIS_CACTUS = requireMonsterDefinition('Cactus', 11);
export const ANCIENT_CACTUS = requireMonsterDefinition('Cactus', 12);
export const STARBLOOM_CACTUS = requireMonsterDefinition('Cactus', 13);
export const COSMIC_CACTUS = requireMonsterDefinition('Cactus', 14);
export const ETERNAL_CACTUS = requireMonsterDefinition('Cactus', 15);

export const TINY_CELL = requireMonsterDefinition('Cell', 1);
export const ETERNAL_CELL = requireMonsterDefinition('Cell', 15);

export const TINY_SPROUT = requireMonsterDefinition('Plant', 1);
export const ETERNAL_PLANT = requireMonsterDefinition('Plant', 15);
