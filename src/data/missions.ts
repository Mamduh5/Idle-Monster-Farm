export type MissionReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  };

export type MissionId =
  | 'hatch-3'
  | 'merge-1'
  | 'own-level-3-slime'
  | 'discover-mushroom'
  | 'buy-upgrade-1'
  | 'unlock-expansion'
  | 'prestige-once';

export type MissionDefinition = {
  id: MissionId;
  name: string;
  goal: number;
  reward: MissionReward;
};

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    id: 'hatch-3',
    name: 'Hatch 3 monsters',
    goal: 3,
    reward: {
      type: 'coins',
      amount: 25,
    },
  },
  {
    id: 'merge-1',
    name: 'Merge 1 pair',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 40,
    },
  },
  {
    id: 'own-level-3-slime',
    name: 'Own a Level 3 Slime',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 75,
    },
  },
  {
    id: 'discover-mushroom',
    name: 'Discover a Mushroom',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 100,
    },
  },
  {
    id: 'buy-upgrade-1',
    name: 'Buy 1 upgrade',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 120,
    },
  },
  {
    id: 'unlock-expansion',
    name: 'Unlock expansion slots',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 200,
    },
  },
  {
    id: 'prestige-once',
    name: 'Prestige once',
    goal: 1,
    reward: {
      type: 'essence',
      amount: 1,
    },
  },
];

export const MISSION_IDS = MISSION_DEFINITIONS.map((mission) => mission.id);
