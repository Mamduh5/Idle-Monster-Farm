import type { MonsterFamily } from '../types/game-state';

export type OrderReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  };

export type OrderUnlockCondition = {
  type: 'discovered';
  family: MonsterFamily;
  level: number;
};

export type OrderId =
  | 'own-slime-2'
  | 'own-slime-3'
  | 'own-slime-4'
  | 'own-spore-1'
  | 'own-spore-3'
  | 'own-spore-4'
  | 'own-spore-7'
  | 'own-spore-8'
  | 'own-spore-10'
  | 'own-cactus-1'
  | 'own-cactus-3'
  | 'own-cactus-6'
  | 'own-cell-1'
  | 'own-cell-3'
  | 'own-cell-6'
  | 'own-plant-1'
  | 'own-plant-3'
  | 'own-plant-6'
  | 'own-mushroom-3'
  | 'own-slime-6'
  | 'own-mushroom-6'
  | 'own-slime-8';

export type OrderDefinition = {
  id: OrderId;
  title: string;
  requiredFamily: MonsterFamily;
  requiredLevel: number;
  reward: OrderReward;
  unlockCondition?: OrderUnlockCondition;
};

export const ORDER_DEFINITIONS: OrderDefinition[] = [
  {
    id: 'own-slime-2',
    title: 'Own Level 2 Slime',
    requiredFamily: 'Slime',
    requiredLevel: 2,
    reward: {
      type: 'coins',
      amount: 50,
    },
  },
  {
    id: 'own-slime-3',
    title: 'Own Level 3 Slime',
    requiredFamily: 'Slime',
    requiredLevel: 3,
    reward: {
      type: 'coins',
      amount: 150,
    },
  },
  {
    id: 'own-slime-4',
    title: 'Own Horned Slime',
    requiredFamily: 'Slime',
    requiredLevel: 4,
    reward: {
      type: 'coins',
      amount: 400,
    },
  },
  {
    id: 'own-spore-1',
    title: 'Own Sporeling',
    requiredFamily: 'Spore',
    requiredLevel: 1,
    reward: {
      type: 'coins',
      amount: 150,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 1,
    },
  },
  {
    id: 'own-spore-3',
    title: 'Own Bloom Spore',
    requiredFamily: 'Spore',
    requiredLevel: 3,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 1,
    },
  },
  {
    id: 'own-spore-4',
    title: 'Own Elder Spore',
    requiredFamily: 'Spore',
    requiredLevel: 4,
    reward: {
      type: 'essence',
      amount: 2,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 3,
    },
  },
  {
    id: 'own-spore-7',
    title: 'Own Astral Spore',
    requiredFamily: 'Spore',
    requiredLevel: 7,
    reward: {
      type: 'essence',
      amount: 3,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 6,
    },
  },
  {
    id: 'own-spore-8',
    title: 'Own Dream Spore',
    requiredFamily: 'Spore',
    requiredLevel: 8,
    reward: {
      type: 'essence',
      amount: 5,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 7,
    },
  },
  {
    id: 'own-spore-10',
    title: 'Own Eternal Spore',
    requiredFamily: 'Spore',
    requiredLevel: 10,
    reward: {
      type: 'essence',
      amount: 10,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Spore',
      level: 8,
    },
  },
  {
    id: 'own-cactus-1',
    title: 'Own Tiny Cactus',
    requiredFamily: 'Cactus',
    requiredLevel: 1,
    reward: {
      type: 'coins',
      amount: 900,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cactus',
      level: 1,
    },
  },
  {
    id: 'own-cactus-3',
    title: 'Own Bloom Cactus',
    requiredFamily: 'Cactus',
    requiredLevel: 3,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cactus',
      level: 1,
    },
  },
  {
    id: 'own-cactus-6',
    title: 'Own Crystal Cactus',
    requiredFamily: 'Cactus',
    requiredLevel: 6,
    reward: {
      type: 'essence',
      amount: 2,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cactus',
      level: 3,
    },
  },
  {
    id: 'own-cell-1',
    title: 'Own Tiny Cell',
    requiredFamily: 'Cell',
    requiredLevel: 1,
    reward: {
      type: 'coins',
      amount: 1200,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cell',
      level: 1,
    },
  },
  {
    id: 'own-cell-3',
    title: 'Own Glow Cell',
    requiredFamily: 'Cell',
    requiredLevel: 3,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cell',
      level: 1,
    },
  },
  {
    id: 'own-cell-6',
    title: 'Own Crystal Cell',
    requiredFamily: 'Cell',
    requiredLevel: 6,
    reward: {
      type: 'essence',
      amount: 2,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Cell',
      level: 3,
    },
  },
  {
    id: 'own-plant-1',
    title: 'Own Tiny Sprout',
    requiredFamily: 'Plant',
    requiredLevel: 1,
    reward: {
      type: 'coins',
      amount: 1600,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Plant',
      level: 1,
    },
  },
  {
    id: 'own-plant-3',
    title: 'Own Bloom Sprout',
    requiredFamily: 'Plant',
    requiredLevel: 3,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Plant',
      level: 1,
    },
  },
  {
    id: 'own-plant-6',
    title: 'Own Crystal Plant',
    requiredFamily: 'Plant',
    requiredLevel: 6,
    reward: {
      type: 'essence',
      amount: 2,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Plant',
      level: 3,
    },
  },
  {
    id: 'own-mushroom-3',
    title: 'Own Level 3 Mushroom',
    requiredFamily: 'Mushroom',
    requiredLevel: 3,
    reward: {
      type: 'coins',
      amount: 500,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Mushroom',
      level: 1,
    },
  },
  {
    id: 'own-slime-6',
    title: 'Own Crystal Slime',
    requiredFamily: 'Slime',
    requiredLevel: 6,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Slime',
      level: 4,
    },
  },
  {
    id: 'own-mushroom-6',
    title: 'Own Mooncap Mushroom',
    requiredFamily: 'Mushroom',
    requiredLevel: 6,
    reward: {
      type: 'essence',
      amount: 1,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Mushroom',
      level: 3,
    },
  },
  {
    id: 'own-slime-8',
    title: 'Own Level 8 Slime',
    requiredFamily: 'Slime',
    requiredLevel: 8,
    reward: {
      type: 'essence',
      amount: 2,
    },
    unlockCondition: {
      type: 'discovered',
      family: 'Slime',
      level: 6,
    },
  },
];

export const ORDER_IDS = ORDER_DEFINITIONS.map((order) => order.id);
