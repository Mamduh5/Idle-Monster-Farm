export type BossBattleReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  };

export type BossBattleStage = {
  id: string;
  bossId: 'training-dummy' | 'forest-stump' | 'baby-wyvern' | 'tiny-dragon';
  stageNumber: number;
  name: string;
  hp: number;
  attack: number;
  teamSize: number;
  firstClearReward: BossBattleReward;
  replayReward: Extract<BossBattleReward, { type: 'coins' }>;
  description?: string;
};

export const BOSS_BATTLE_STAGES: BossBattleStage[] = [
  {
    id: 'training-dummy-1',
    bossId: 'training-dummy',
    stageNumber: 1,
    name: 'Training Dummy I',
    hp: 80,
    attack: 6,
    teamSize: 1,
    firstClearReward: { type: 'coins', amount: 80 },
    replayReward: { type: 'coins', amount: 8 },
    description: 'A soft target for first battles.',
  },
  {
    id: 'training-dummy-2',
    bossId: 'training-dummy',
    stageNumber: 2,
    name: 'Training Dummy II',
    hp: 160,
    attack: 10,
    teamSize: 1,
    firstClearReward: { type: 'coins', amount: 160 },
    replayReward: { type: 'coins', amount: 14 },
  },
  {
    id: 'training-dummy-3',
    bossId: 'training-dummy',
    stageNumber: 3,
    name: 'Training Dummy III',
    hp: 300,
    attack: 16,
    teamSize: 1,
    firstClearReward: { type: 'coins', amount: 300 },
    replayReward: { type: 'coins', amount: 24 },
  },
  {
    id: 'forest-stump-1',
    bossId: 'forest-stump',
    stageNumber: 1,
    name: 'Forest Stump I',
    hp: 500,
    attack: 24,
    teamSize: 1,
    firstClearReward: { type: 'coins', amount: 600 },
    replayReward: { type: 'coins', amount: 45 },
  },
  {
    id: 'forest-stump-2',
    bossId: 'forest-stump',
    stageNumber: 2,
    name: 'Forest Stump II',
    hp: 900,
    attack: 38,
    teamSize: 1,
    firstClearReward: { type: 'coins', amount: 1000 },
    replayReward: { type: 'coins', amount: 75 },
  },
  {
    id: 'forest-stump-3',
    bossId: 'forest-stump',
    stageNumber: 3,
    name: 'Forest Stump III',
    hp: 1600,
    attack: 58,
    teamSize: 1,
    firstClearReward: { type: 'essence', amount: 1 },
    replayReward: { type: 'coins', amount: 120 },
  },
  {
    id: 'baby-wyvern-1',
    bossId: 'baby-wyvern',
    stageNumber: 1,
    name: 'Baby Wyvern I',
    hp: 2600,
    attack: 90,
    teamSize: 2,
    firstClearReward: { type: 'coins', amount: 2500 },
    replayReward: { type: 'coins', amount: 180 },
  },
  {
    id: 'baby-wyvern-2',
    bossId: 'baby-wyvern',
    stageNumber: 2,
    name: 'Baby Wyvern II',
    hp: 4800,
    attack: 145,
    teamSize: 2,
    firstClearReward: { type: 'coins', amount: 4500 },
    replayReward: { type: 'coins', amount: 320 },
  },
  {
    id: 'baby-wyvern-3',
    bossId: 'baby-wyvern',
    stageNumber: 3,
    name: 'Baby Wyvern III',
    hp: 8500,
    attack: 230,
    teamSize: 2,
    firstClearReward: { type: 'essence', amount: 2 },
    replayReward: { type: 'coins', amount: 500 },
  },
  {
    id: 'tiny-dragon-1',
    bossId: 'tiny-dragon',
    stageNumber: 1,
    name: 'Tiny Dragon I',
    hp: 14000,
    attack: 360,
    teamSize: 3,
    firstClearReward: { type: 'coins', amount: 9000 },
    replayReward: { type: 'coins', amount: 750 },
  },
  {
    id: 'tiny-dragon-2',
    bossId: 'tiny-dragon',
    stageNumber: 2,
    name: 'Tiny Dragon II',
    hp: 26000,
    attack: 620,
    teamSize: 3,
    firstClearReward: { type: 'coins', amount: 18000 },
    replayReward: { type: 'coins', amount: 1300 },
  },
  {
    id: 'tiny-dragon-3',
    bossId: 'tiny-dragon',
    stageNumber: 3,
    name: 'Tiny Dragon III',
    hp: 50000,
    attack: 1000,
    teamSize: 3,
    firstClearReward: { type: 'essence', amount: 3 },
    replayReward: { type: 'coins', amount: 2200 },
  },
];

export const BOSS_BATTLE_STAGE_IDS = BOSS_BATTLE_STAGES.map((stage) => stage.id);
