import type { ElementType } from './elements';

export type QuestReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  }
  | {
    type: 'fragments';
    element: ElementType;
    amount: number;
  };

export type QuestFocusTarget =
  | 'hatch'
  | 'merge'
  | 'shop'
  | 'ritual'
  | 'battle'
  | 'forge'
  | 'expansion'
  | 'monster';

export type QuestId =
  | 'hatch-3'
  | 'merge-1'
  | 'own-level-3-slime'
  | 'unlock-expansion'
  | 'discover-mushroom'
  | 'prestige-once'
  | 'clear-first-boss-stage'
  | 'apply-first-element'
  | 'upgrade-element-lv2';

export type QuestDefinition = {
  id: QuestId;
  name: string;
  goal: number;
  reward: QuestReward;
  focusTarget: QuestFocusTarget;
  icon: string;
};

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'hatch-3',
    name: 'Hatch 3 monsters',
    goal: 3,
    reward: {
      type: 'coins',
      amount: 25,
    },
    focusTarget: 'hatch',
    icon: 'egg',
  },
  {
    id: 'merge-1',
    name: 'Merge 1 pair',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 40,
    },
    focusTarget: 'merge',
    icon: 'merge',
  },
  {
    id: 'own-level-3-slime',
    name: 'Own a Level 3 Slime',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 75,
    },
    focusTarget: 'monster',
    icon: 'monster',
  },
  {
    id: 'unlock-expansion',
    name: 'Unlock Expansion',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 200,
    },
    focusTarget: 'expansion',
    icon: 'expand',
  },
  {
    id: 'discover-mushroom',
    name: 'Discover Mushroom',
    goal: 1,
    reward: {
      type: 'coins',
      amount: 100,
    },
    focusTarget: 'hatch',
    icon: 'monster',
  },
  {
    id: 'prestige-once',
    name: 'Perform first Ritual',
    goal: 1,
    reward: {
      type: 'essence',
      amount: 1,
    },
    focusTarget: 'ritual',
    icon: 'ritual',
  },
  {
    id: 'clear-first-boss-stage',
    name: 'Clear first Boss stage',
    goal: 1,
    reward: {
      type: 'fragments',
      element: 'Spark',
      amount: 3,
    },
    focusTarget: 'battle',
    icon: 'battle',
  },
  {
    id: 'apply-first-element',
    name: 'Apply first Element',
    goal: 1,
    reward: {
      type: 'fragments',
      element: 'Spark',
      amount: 5,
    },
    focusTarget: 'forge',
    icon: 'forge',
  },
  {
    id: 'upgrade-element-lv2',
    name: 'Upgrade an Element to Lv2',
    goal: 1,
    reward: {
      type: 'essence',
      amount: 1,
    },
    focusTarget: 'forge',
    icon: 'forge',
  },
];

export const QUEST_IDS = QUEST_DEFINITIONS.map((quest) => quest.id);
