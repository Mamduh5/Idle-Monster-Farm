export type BossBattleReward =
  | {
    type: 'coins';
    amount: number;
  }
  | {
    type: 'essence';
    amount: number;
  };

export type BossBattleBossId = string;

export type BossVisualTheme = 'programmer' | 'chef' | 'driver' | 'doctor';

export type BossBattleStage = {
  id: string;
  bossId: BossBattleBossId;
  stageNumber: number;
  name: string;
  hp: number;
  attack: number;
  teamSize: number;
  firstClearReward: BossBattleReward;
  replayReward: Extract<BossBattleReward, { type: 'coins' }>;
};

export type BossBattleDefinition = {
  id: BossBattleBossId;
  name: string;
  classLabel: string;
  description: string;
  visualTheme: BossVisualTheme;
  attackName: string;
  stages: BossBattleStage[];
};

export const BOSS_BATTLE_DEFINITIONS: BossBattleDefinition[] = [
  {
    id: 'byte-wizard',
    name: 'Byte Wizard',
    classLabel: 'Code Wizard',
    description: 'Debugs monsters with logic blasts.',
    visualTheme: 'programmer',
    attackName: 'Bug Blast',
    stages: [
      {
        id: 'training-dummy-1',
        bossId: 'byte-wizard',
        stageNumber: 1,
        name: 'Byte Wizard I',
        hp: 80,
        attack: 6,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 250 },
        replayReward: { type: 'coins', amount: 8 },
      },
      {
        id: 'training-dummy-2',
        bossId: 'byte-wizard',
        stageNumber: 2,
        name: 'Byte Wizard II',
        hp: 160,
        attack: 10,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 600 },
        replayReward: { type: 'coins', amount: 14 },
      },
      {
        id: 'training-dummy-3',
        bossId: 'byte-wizard',
        stageNumber: 3,
        name: 'Byte Wizard III',
        hp: 300,
        attack: 16,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 1200 },
        replayReward: { type: 'coins', amount: 24 },
      },
    ],
  },
  {
    id: 'chili-chef',
    name: 'Chili Chef',
    classLabel: 'Master Chef',
    description: 'Throws spicy soup and victory snacks.',
    visualTheme: 'chef',
    attackName: 'Spicy Toss',
    stages: [
      {
        id: 'forest-stump-1',
        bossId: 'chili-chef',
        stageNumber: 1,
        name: 'Chili Chef I',
        hp: 500,
        attack: 24,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 2500 },
        replayReward: { type: 'coins', amount: 45 },
      },
      {
        id: 'forest-stump-2',
        bossId: 'chili-chef',
        stageNumber: 2,
        name: 'Chili Chef II',
        hp: 900,
        attack: 38,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 4500 },
        replayReward: { type: 'coins', amount: 75 },
      },
      {
        id: 'forest-stump-3',
        bossId: 'chili-chef',
        stageNumber: 3,
        name: 'Chili Chef III',
        hp: 1600,
        attack: 58,
        teamSize: 1,
        firstClearReward: { type: 'essence', amount: 2 },
        replayReward: { type: 'coins', amount: 120 },
      },
    ],
  },
  {
    id: 'turbo-driver',
    name: 'Turbo Driver',
    classLabel: 'Road Driver',
    description: 'Rushes in with honks and speed bumps.',
    visualTheme: 'driver',
    attackName: 'Speed Bump',
    stages: [
      {
        id: 'baby-wyvern-1',
        bossId: 'turbo-driver',
        stageNumber: 1,
        name: 'Turbo Driver I',
        hp: 2600,
        attack: 90,
        teamSize: 2,
        firstClearReward: { type: 'coins', amount: 9000 },
        replayReward: { type: 'coins', amount: 180 },
      },
      {
        id: 'baby-wyvern-2',
        bossId: 'turbo-driver',
        stageNumber: 2,
        name: 'Turbo Driver II',
        hp: 4800,
        attack: 145,
        teamSize: 2,
        firstClearReward: { type: 'coins', amount: 16000 },
        replayReward: { type: 'coins', amount: 320 },
      },
      {
        id: 'baby-wyvern-3',
        bossId: 'turbo-driver',
        stageNumber: 3,
        name: 'Turbo Driver III',
        hp: 8500,
        attack: 230,
        teamSize: 2,
        firstClearReward: { type: 'essence', amount: 3 },
        replayReward: { type: 'coins', amount: 500 },
      },
    ],
  },
  {
    id: 'doctor-snooze',
    name: 'Doctor Snooze',
    classLabel: 'Clinic Doctor',
    description: 'Uses sleep shots and calm clinic tricks.',
    visualTheme: 'doctor',
    attackName: 'Sleep Shot',
    stages: [
      {
        id: 'tiny-dragon-1',
        bossId: 'doctor-snooze',
        stageNumber: 1,
        name: 'Doctor Snooze I',
        hp: 14000,
        attack: 360,
        teamSize: 3,
        firstClearReward: { type: 'coins', amount: 30000 },
        replayReward: { type: 'coins', amount: 750 },
      },
      {
        id: 'tiny-dragon-2',
        bossId: 'doctor-snooze',
        stageNumber: 2,
        name: 'Doctor Snooze II',
        hp: 26000,
        attack: 620,
        teamSize: 3,
        firstClearReward: { type: 'coins', amount: 60000 },
        replayReward: { type: 'coins', amount: 1300 },
      },
      {
        id: 'tiny-dragon-3',
        bossId: 'doctor-snooze',
        stageNumber: 3,
        name: 'Doctor Snooze III',
        hp: 50000,
        attack: 1000,
        teamSize: 3,
        firstClearReward: { type: 'essence', amount: 5 },
        replayReward: { type: 'coins', amount: 2200 },
      },
    ],
  },
];

export const BOSS_BATTLE_STAGES = BOSS_BATTLE_DEFINITIONS.flatMap((boss) => boss.stages);
export const BOSS_BATTLE_STAGE_IDS = BOSS_BATTLE_STAGES.map((stage) => stage.id);
