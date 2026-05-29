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
  futureElementTheme: 'Spark' | 'Fire' | 'Metal' | 'Dream';
  rewardThemeLabel: string;
  attackName: string;
  stages: BossBattleStage[];
};

export const BOSS_BATTLE_DEFINITIONS: BossBattleDefinition[] = [
  {
    id: 'byte-wizard',
    name: 'Byte Wizard',
    classLabel: 'Code Wizard',
    description: 'Crackles with spark code and logic blasts.',
    visualTheme: 'programmer',
    futureElementTheme: 'Spark',
    rewardThemeLabel: 'Spark/Tech branch',
    attackName: 'Bug Blast',
    stages: [
      {
        id: 'training-dummy-1',
        bossId: 'byte-wizard',
        stageNumber: 1,
        name: 'Byte Wizard I',
        hp: 520,
        attack: 32,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 1600 },
        replayReward: { type: 'coins', amount: 90 },
      },
      {
        id: 'training-dummy-2',
        bossId: 'byte-wizard',
        stageNumber: 2,
        name: 'Byte Wizard II',
        hp: 1300,
        attack: 68,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 3800 },
        replayReward: { type: 'coins', amount: 200 },
      },
      {
        id: 'training-dummy-3',
        bossId: 'byte-wizard',
        stageNumber: 3,
        name: 'Byte Wizard III',
        hp: 3200,
        attack: 150,
        teamSize: 1,
        firstClearReward: { type: 'essence', amount: 1 },
        replayReward: { type: 'coins', amount: 380 },
      },
    ],
  },
  {
    id: 'chili-chef',
    name: 'Chili Chef',
    classLabel: 'Master Chef',
    description: 'Serves spicy fire pressure and victory snacks.',
    visualTheme: 'chef',
    futureElementTheme: 'Fire',
    rewardThemeLabel: 'Fire branch',
    attackName: 'Spicy Toss',
    stages: [
      {
        id: 'forest-stump-1',
        bossId: 'chili-chef',
        stageNumber: 1,
        name: 'Chili Chef I',
        hp: 650,
        attack: 30,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 1800 },
        replayReward: { type: 'coins', amount: 100 },
      },
      {
        id: 'forest-stump-2',
        bossId: 'chili-chef',
        stageNumber: 2,
        name: 'Chili Chef II',
        hp: 1600,
        attack: 70,
        teamSize: 1,
        firstClearReward: { type: 'coins', amount: 4300 },
        replayReward: { type: 'coins', amount: 220 },
      },
      {
        id: 'forest-stump-3',
        bossId: 'chili-chef',
        stageNumber: 3,
        name: 'Chili Chef III',
        hp: 3800,
        attack: 145,
        teamSize: 1,
        firstClearReward: { type: 'essence', amount: 1 },
        replayReward: { type: 'coins', amount: 420 },
      },
    ],
  },
  {
    id: 'turbo-driver',
    name: 'Turbo Driver',
    classLabel: 'Road Driver',
    description: 'Rushes in with metal speed and honks.',
    visualTheme: 'driver',
    futureElementTheme: 'Metal',
    rewardThemeLabel: 'Metal/Speed branch',
    attackName: 'Speed Bump',
    stages: [
      {
        id: 'baby-wyvern-1',
        bossId: 'turbo-driver',
        stageNumber: 1,
        name: 'Turbo Driver I',
        hp: 560,
        attack: 40,
        teamSize: 2,
        firstClearReward: { type: 'coins', amount: 2000 },
        replayReward: { type: 'coins', amount: 120 },
      },
      {
        id: 'baby-wyvern-2',
        bossId: 'turbo-driver',
        stageNumber: 2,
        name: 'Turbo Driver II',
        hp: 1400,
        attack: 85,
        teamSize: 2,
        firstClearReward: { type: 'coins', amount: 4800 },
        replayReward: { type: 'coins', amount: 260 },
      },
      {
        id: 'baby-wyvern-3',
        bossId: 'turbo-driver',
        stageNumber: 3,
        name: 'Turbo Driver III',
        hp: 3300,
        attack: 180,
        teamSize: 2,
        firstClearReward: { type: 'essence', amount: 1 },
        replayReward: { type: 'coins', amount: 480 },
      },
    ],
  },
  {
    id: 'doctor-snooze',
    name: 'Doctor Snooze',
    classLabel: 'Clinic Doctor',
    description: 'Uses dream sleep shots and steady clinic tricks.',
    visualTheme: 'doctor',
    futureElementTheme: 'Dream',
    rewardThemeLabel: 'Dream/Sleep branch',
    attackName: 'Sleep Shot',
    stages: [
      {
        id: 'tiny-dragon-1',
        bossId: 'doctor-snooze',
        stageNumber: 1,
        name: 'Doctor Snooze I',
        hp: 850,
        attack: 24,
        teamSize: 3,
        firstClearReward: { type: 'coins', amount: 2200 },
        replayReward: { type: 'coins', amount: 140 },
      },
      {
        id: 'tiny-dragon-2',
        bossId: 'doctor-snooze',
        stageNumber: 2,
        name: 'Doctor Snooze II',
        hp: 2200,
        attack: 55,
        teamSize: 3,
        firstClearReward: { type: 'coins', amount: 5600 },
        replayReward: { type: 'coins', amount: 290 },
      },
      {
        id: 'tiny-dragon-3',
        bossId: 'doctor-snooze',
        stageNumber: 3,
        name: 'Doctor Snooze III',
        hp: 5000,
        attack: 120,
        teamSize: 3,
        firstClearReward: { type: 'essence', amount: 2 },
        replayReward: { type: 'coins', amount: 540 },
      },
    ],
  },
];

export const BOSS_BATTLE_STAGES = BOSS_BATTLE_DEFINITIONS.flatMap((boss) => boss.stages);
export const BOSS_BATTLE_STAGE_IDS = BOSS_BATTLE_STAGES.map((stage) => stage.id);
