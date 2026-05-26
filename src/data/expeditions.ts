export type ExpeditionReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  };

export type ExpeditionId =
  | 'training-dummy'
  | 'wobbly-sprout'
  | 'forest-guardian'
  | 'baby-wyvern'
  | 'ancient-stump'
  | 'tiny-dragon';

export type ExpeditionDefinition = {
  id: ExpeditionId;
  name: string;
  requiredPower: number;
  reward: ExpeditionReward;
};

export const EXPEDITION_DEFINITIONS: ExpeditionDefinition[] = [
  {
    id: 'training-dummy',
    name: 'Training Dummy',
    requiredPower: 10,
    reward: {
      type: 'coins',
      amount: 50,
    },
  },
  {
    id: 'wobbly-sprout',
    name: 'Wobbly Sprout',
    requiredPower: 30,
    reward: {
      type: 'coins',
      amount: 120,
    },
  },
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    requiredPower: 80,
    reward: {
      type: 'coins',
      amount: 300,
    },
  },
  {
    id: 'baby-wyvern',
    name: 'Baby Wyvern',
    requiredPower: 180,
    reward: {
      type: 'essence',
      amount: 1,
    },
  },
  {
    id: 'ancient-stump',
    name: 'Ancient Stump',
    requiredPower: 400,
    reward: {
      type: 'coins',
      amount: 900,
    },
  },
  {
    id: 'tiny-dragon',
    name: 'Tiny Dragon',
    requiredPower: 900,
    reward: {
      type: 'essence',
      amount: 2,
    },
  },
];

export const EXPEDITION_IDS = EXPEDITION_DEFINITIONS.map((expedition) => expedition.id);
