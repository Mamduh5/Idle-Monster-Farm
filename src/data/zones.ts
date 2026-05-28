import type { MonsterFamily } from '../types/game-state';

export type ZoneId =
  | 'grass-farm'
  | 'mushroom-forest'
  | 'spore-grove'
  | 'cactus-desert'
  | 'cell-marsh'
  | 'bloom-garden';

export type ZoneDefinition = {
  id: ZoneId;
  name: string;
  description: string;
  hatchSpecialtyKey: string;
  hatchWeightMultipliers: Partial<Record<MonsterFamily, number>>;
};

export const GRASS_FARM_ZONE_ID: ZoneId = 'grass-farm';
export const MUSHROOM_FOREST_ZONE_ID: ZoneId = 'mushroom-forest';
export const SPORE_GROVE_ZONE_ID: ZoneId = 'spore-grove';
export const CACTUS_DESERT_ZONE_ID: ZoneId = 'cactus-desert';
export const CELL_MARSH_ZONE_ID: ZoneId = 'cell-marsh';
export const BLOOM_GARDEN_ZONE_ID: ZoneId = 'bloom-garden';

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: GRASS_FARM_ZONE_ID,
    name: 'Grass Farm',
    description: 'A gentle field where Slimes thrive.',
    hatchSpecialtyKey: 'ui.zone.specialty.grassFarm',
    hatchWeightMultipliers: {
      Slime: 1.18,
    },
  },
  {
    id: MUSHROOM_FOREST_ZONE_ID,
    name: 'Mushroom Forest',
    description: 'A damp grove that favors Mushrooms and Spores.',
    hatchSpecialtyKey: 'ui.zone.specialty.mushroomForest',
    hatchWeightMultipliers: {
      Mushroom: 1.45,
      Spore: 1.25,
    },
  },
  {
    id: SPORE_GROVE_ZONE_ID,
    name: 'Spore Grove',
    description: 'A glowing grove thick with rare spores.',
    hatchSpecialtyKey: 'ui.zone.specialty.sporeGrove',
    hatchWeightMultipliers: {
      Spore: 1.75,
      Cell: 1.25,
    },
  },
  {
    id: CACTUS_DESERT_ZONE_ID,
    name: 'Cactus Desert',
    description: 'A hot desert where sturdy rare families grow.',
    hatchSpecialtyKey: 'ui.zone.specialty.cactusDesert',
    hatchWeightMultipliers: {
      Cactus: 1.8,
      Plant: 1.25,
    },
  },
  {
    id: CELL_MARSH_ZONE_ID,
    name: 'Cell Marsh',
    description: 'A wet glowing marsh where Cell families thrive.',
    hatchSpecialtyKey: 'ui.zone.specialty.cellMarsh',
    hatchWeightMultipliers: {
      Cell: 1.8,
      Spore: 1.2,
    },
  },
  {
    id: BLOOM_GARDEN_ZONE_ID,
    name: 'Bloom Garden',
    description: 'A lush garden where Plant families grow.',
    hatchSpecialtyKey: 'ui.zone.specialty.bloomGarden',
    hatchWeightMultipliers: {
      Plant: 1.9,
      Cactus: 1.2,
    },
  },
];

export const ZONE_IDS = ZONE_DEFINITIONS.map((zone) => zone.id);
