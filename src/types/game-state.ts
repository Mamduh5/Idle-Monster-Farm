export type CurrencyState = {
  coins: number;
};

export type MonsterFamily = 'Slime';

export type MonsterDefinition = {
  family: MonsterFamily;
  level: number;
  name: string;
};

export type MonsterInstance = MonsterDefinition & {
  id: string;
};

export type FarmSlotState = {
  id: number;
  monster: MonsterInstance | null;
};
