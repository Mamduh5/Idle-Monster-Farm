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
  titleKey: string;
  goal: number;
  reward: QuestReward;
  focusTarget: QuestFocusTarget;
  icon: string;
};

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'hatch-3',
    titleKey: 'quest.hatch-3.name',
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
    titleKey: 'quest.merge-1.name',
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
    titleKey: 'quest.own-level-3-slime.name',
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
    titleKey: 'quest.unlock-expansion.name',
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
    titleKey: 'quest.discover-mushroom.name',
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
    titleKey: 'quest.prestige-once.name',
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
    titleKey: 'quest.clear-first-boss-stage.name',
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
    titleKey: 'quest.apply-first-element.name',
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
    titleKey: 'quest.upgrade-element-lv2.name',
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
