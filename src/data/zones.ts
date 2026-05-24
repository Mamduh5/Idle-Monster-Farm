export type ZoneId = 'grass-farm' | 'mushroom-forest';

export type ZoneDefinition = {
  id: ZoneId;
  name: string;
};

export const GRASS_FARM_ZONE_ID: ZoneId = 'grass-farm';
export const MUSHROOM_FOREST_ZONE_ID: ZoneId = 'mushroom-forest';

export const ZONE_DEFINITIONS: ZoneDefinition[] = [
  {
    id: GRASS_FARM_ZONE_ID,
    name: 'Grass Farm',
  },
  {
    id: MUSHROOM_FOREST_ZONE_ID,
    name: 'Mushroom Forest',
  },
];

export const ZONE_IDS = ZONE_DEFINITIONS.map((zone) => zone.id);
