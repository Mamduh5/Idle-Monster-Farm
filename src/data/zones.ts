import type { MonsterFamily } from '../types/game-state';

export type ZoneId = 'grass-farm' | 'mushroom-forest' | 'spore-grove' | 'cactus-desert';

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
];

export const ZONE_IDS = ZONE_DEFINITIONS.map((zone) => zone.id);
