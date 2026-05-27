import type { BossBattleStage } from '../data/bossBattles';
import type { FarmSlotState, MonsterFamily, MonsterInstance } from '../types/game-state';

export type BattleSkillId =
  | 'splash-hit'
  | 'jelly-guard'
  | 'slime-surge'
  | 'spore-bonk'
  | 'healing-spores'
  | 'poison-puff'
  | 'dream-shot'
  | 'daze-dust'
  | 'dream-burst'
  | 'thorn-jab'
  | 'needle-guard'
  | 'thorn-storm';

export type BattleSkillDefinition = {
  id: BattleSkillId;
  family: MonsterFamily;
  levelRequired: number;
  labelKey: string;
  cooldownTurns?: number;
  damageMultiplier?: number;
  healLowestPercentOfCasterMaxHp?: number;
  shieldPercent?: number;
  counterPercentOfCasterAttack?: number;
  bossAttackReductionPercent?: number;
  poisonTurns?: number;
  poisonPercentOfCasterAttack?: number;
};

export type BattleMonsterSnapshot = {
  id: string;
  family: MonsterFamily;
  level: number;
  name: string;
  incomePerSecond: number;
  power: number;
  maxHp: number;
  hp: number;
  attack: number;
  shieldPercent: number;
  counterDamage: number;
};

export type BattleResultStatus = 'ready' | 'victory' | 'defeat';

export type BattleSessionState = {
  stageId: string;
  bossHp: number;
  bossMaxHp: number;
  bossAttack: number;
  team: BattleMonsterSnapshot[];
  activeMonsterIndex: number;
  turnNumber: number;
  status: BattleResultStatus;
  skillCooldowns: Record<string, number>;
  bossAttackReductionPercent: number;
  poisonTurns: number;
  poisonDamagePerTurn: number;
  reviveUsed: boolean;
  replayRewardGranted: boolean;
};

export type BattleTurnResult = {
  session: BattleSessionState;
  status: BattleResultStatus;
  damage: number;
  healing: number;
  bossDamage: number;
  defeatedMonsterId?: string;
};

const SKILL_DEFINITIONS: BattleSkillDefinition[] = [
  {
    id: 'splash-hit',
    family: 'Slime',
    levelRequired: 1,
    labelKey: 'skill.splash-hit.name',
    damageMultiplier: 1,
  },
  {
    id: 'jelly-guard',
    family: 'Slime',
    levelRequired: 5,
    labelKey: 'skill.jelly-guard.name',
    shieldPercent: 0.5,
  },
  {
    id: 'slime-surge',
    family: 'Slime',
    levelRequired: 10,
    labelKey: 'skill.slime-surge.name',
    cooldownTurns: 2,
    damageMultiplier: 1.8,
  },
  {
    id: 'spore-bonk',
    family: 'Mushroom',
    levelRequired: 1,
    labelKey: 'skill.spore-bonk.name',
    damageMultiplier: 1,
  },
  {
    id: 'healing-spores',
    family: 'Mushroom',
    levelRequired: 5,
    labelKey: 'skill.healing-spores.name',
    cooldownTurns: 2,
    healLowestPercentOfCasterMaxHp: 0.25,
  },
  {
    id: 'poison-puff',
    family: 'Mushroom',
    levelRequired: 10,
    labelKey: 'skill.poison-puff.name',
    damageMultiplier: 0.8,
    poisonTurns: 3,
    poisonPercentOfCasterAttack: 0.1,
  },
  {
    id: 'dream-shot',
    family: 'Spore',
    levelRequired: 1,
    labelKey: 'skill.dream-shot.name',
    damageMultiplier: 1.05,
  },
  {
    id: 'daze-dust',
    family: 'Spore',
    levelRequired: 5,
    labelKey: 'skill.daze-dust.name',
    cooldownTurns: 2,
    damageMultiplier: 0.7,
    bossAttackReductionPercent: 0.35,
  },
  {
    id: 'dream-burst',
    family: 'Spore',
    levelRequired: 10,
    labelKey: 'skill.dream-burst.name',
    cooldownTurns: 3,
    damageMultiplier: 1.9,
  },
  {
    id: 'thorn-jab',
    family: 'Cactus',
    levelRequired: 1,
    labelKey: 'skill.thorn-jab.name',
    damageMultiplier: 1,
  },
  {
    id: 'needle-guard',
    family: 'Cactus',
    levelRequired: 5,
    labelKey: 'skill.needle-guard.name',
    cooldownTurns: 2,
    shieldPercent: 0.35,
    counterPercentOfCasterAttack: 0.5,
  },
  {
    id: 'thorn-storm',
    family: 'Cactus',
    levelRequired: 10,
    labelKey: 'skill.thorn-storm.name',
    cooldownTurns: 2,
    damageMultiplier: 1.6,
  },
];

export function getMonsterBattleStats(monster: MonsterInstance): Pick<BattleMonsterSnapshot, 'power' | 'maxHp' | 'attack'> {
  const incomePerSecond = Number.isFinite(monster.incomePerSecond) ? Math.max(0, monster.incomePerSecond) : 0;
  const level = Number.isFinite(monster.level) ? Math.max(1, monster.level) : 1;
  const incomeRoot = Math.sqrt(incomePerSecond);

  return {
    power: Math.floor(level * 10 + incomePerSecond),
    maxHp: Math.floor(40 + level * 20 + incomeRoot * 10),
    attack: Math.floor(5 + level * 4 + incomeRoot * 2),
  };
}

export function getAutoBattleTeam(farmSlots: readonly FarmSlotState[], teamSize: number): BattleMonsterSnapshot[] {
  return farmSlots
    .map((slot) => slot.monster)
    .filter((monster): monster is MonsterInstance => Boolean(monster))
    .sort((a, b) => {
      const aStats = getMonsterBattleStats(a);
      const bStats = getMonsterBattleStats(b);
      return bStats.power - aStats.power || b.level - a.level || a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, Math.floor(teamSize)))
    .map(createBattleMonsterSnapshot);
}

export function getAvailableSkillsForMonster(monster: Pick<BattleMonsterSnapshot, 'family' | 'level'>): BattleSkillDefinition[] {
  return SKILL_DEFINITIONS.filter((skill) => (
    skill.family === monster.family && monster.level >= skill.levelRequired
  ));
}

export function createBattleSession(stage: BossBattleStage, team: readonly BattleMonsterSnapshot[]): BattleSessionState {
  return {
    stageId: stage.id,
    bossHp: Math.max(0, Math.floor(stage.hp)),
    bossMaxHp: Math.max(1, Math.floor(stage.hp)),
    bossAttack: Math.max(0, Math.floor(stage.attack)),
    team: team.map((monster) => ({ ...monster, hp: Math.max(1, monster.maxHp) })),
    activeMonsterIndex: getNextLivingMonsterIndex(team, -1),
    turnNumber: 1,
    status: team.length > 0 ? 'ready' : 'defeat',
    skillCooldowns: {},
    bossAttackReductionPercent: 0,
    poisonTurns: 0,
    poisonDamagePerTurn: 0,
    reviveUsed: false,
    replayRewardGranted: false,
  };
}

export function getActiveBattleMonster(session: BattleSessionState): BattleMonsterSnapshot | undefined {
  const active = session.team[session.activeMonsterIndex];

  if (active && active.hp > 0) {
    return active;
  }

  return session.team.find((monster) => monster.hp > 0);
}

export function canUseBattleSkill(session: BattleSessionState, skillId: BattleSkillId): boolean {
  if (session.status !== 'ready') {
    return false;
  }

  const activeMonster = getActiveBattleMonster(session);

  if (!activeMonster) {
    return false;
  }

  return getAvailableSkillsForMonster(activeMonster).some((skill) => skill.id === skillId)
    && getSkillCooldown(session, activeMonster.id, skillId) <= 0;
}

export function applyPlayerSkill(session: BattleSessionState, skillId: BattleSkillId): BattleTurnResult {
  if (!canUseBattleSkill(session, skillId)) {
    return createTurnResult(session);
  }

  const activeMonster = getActiveBattleMonster(session);
  const skill = activeMonster
    ? getAvailableSkillsForMonster(activeMonster).find((availableSkill) => availableSkill.id === skillId)
    : undefined;

  if (!activeMonster || !skill) {
    return createTurnResult(session);
  }

  const nextSession: BattleSessionState = {
    ...session,
    team: session.team.map((monster) => ({ ...monster })),
    skillCooldowns: { ...session.skillCooldowns },
  };
  const caster = nextSession.team.find((monster) => monster.id === activeMonster.id);
  let damage = 0;
  let healing = 0;

  if (!caster) {
    return createTurnResult(nextSession);
  }

  if (skill.damageMultiplier) {
    damage = Math.max(1, Math.floor(caster.attack * skill.damageMultiplier));
    nextSession.bossHp = Math.max(0, nextSession.bossHp - damage);
  }

  if (skill.healLowestPercentOfCasterMaxHp) {
    const target = getLowestHpLivingMonster(nextSession.team);

    if (target) {
      healing = Math.max(1, Math.floor(caster.maxHp * skill.healLowestPercentOfCasterMaxHp));
      target.hp = Math.min(target.maxHp, target.hp + healing);
    }
  }

  if (skill.shieldPercent) {
    caster.shieldPercent = Math.max(caster.shieldPercent, skill.shieldPercent);
  }

  if (skill.counterPercentOfCasterAttack) {
    caster.counterDamage = Math.max(
      caster.counterDamage,
      Math.floor(caster.attack * skill.counterPercentOfCasterAttack),
    );
  }

  if (skill.bossAttackReductionPercent) {
    nextSession.bossAttackReductionPercent = Math.max(
      nextSession.bossAttackReductionPercent,
      skill.bossAttackReductionPercent,
    );
  }

  if (skill.poisonTurns && skill.poisonPercentOfCasterAttack) {
    nextSession.poisonTurns = Math.max(nextSession.poisonTurns, skill.poisonTurns);
    nextSession.poisonDamagePerTurn = Math.max(
      nextSession.poisonDamagePerTurn,
      Math.max(1, Math.floor(caster.attack * skill.poisonPercentOfCasterAttack)),
    );
  }

  if (skill.cooldownTurns) {
    nextSession.skillCooldowns[getSkillCooldownKey(caster.id, skill.id)] = skill.cooldownTurns + 1;
  }

  if (nextSession.bossHp <= 0) {
    nextSession.status = 'victory';
  }

  return createTurnResult(nextSession, {
    damage,
    healing,
  });
}

export function applyBossTurn(session: BattleSessionState): BattleTurnResult {
  if (session.status !== 'ready') {
    return createTurnResult(session);
  }

  const nextSession: BattleSessionState = {
    ...session,
    team: session.team.map((monster) => ({ ...monster })),
    skillCooldowns: decrementCooldowns(session.skillCooldowns),
  };
  let damage = 0;
  let bossDamage = 0;
  let defeatedMonsterId: string | undefined;

  if (nextSession.poisonTurns > 0 && nextSession.poisonDamagePerTurn > 0) {
    damage += nextSession.poisonDamagePerTurn;
    nextSession.bossHp = Math.max(0, nextSession.bossHp - nextSession.poisonDamagePerTurn);
    nextSession.poisonTurns = Math.max(0, nextSession.poisonTurns - 1);

    if (nextSession.poisonTurns <= 0) {
      nextSession.poisonDamagePerTurn = 0;
    }
  }

  if (nextSession.bossHp <= 0) {
    nextSession.status = 'victory';
    return createTurnResult(nextSession, {
      damage,
    });
  }

  const targetIndex = getLivingActiveIndex(nextSession);
  const target = targetIndex >= 0 ? nextSession.team[targetIndex] : undefined;

  if (!target) {
    nextSession.status = 'defeat';
    return createTurnResult(nextSession);
  }

  const reducedAttack = Math.floor(nextSession.bossAttack * (1 - nextSession.bossAttackReductionPercent));
  nextSession.bossAttackReductionPercent = 0;
  bossDamage = Math.max(0, reducedAttack);

  if (target.shieldPercent > 0) {
    bossDamage = Math.floor(bossDamage * (1 - target.shieldPercent));
  }

  target.hp = Math.max(0, target.hp - bossDamage);
  target.shieldPercent = 0;

  if (target.counterDamage > 0) {
    damage += target.counterDamage;
    nextSession.bossHp = Math.max(0, nextSession.bossHp - target.counterDamage);
    target.counterDamage = 0;
  }

  if (target.hp <= 0) {
    defeatedMonsterId = target.id;
  }

  if (nextSession.bossHp <= 0) {
    nextSession.status = 'victory';
    return createTurnResult(nextSession, {
      bossDamage,
      damage,
      defeatedMonsterId,
    });
  }

  if (nextSession.team.every((monster) => monster.hp <= 0)) {
    nextSession.status = 'defeat';
    return createTurnResult(nextSession, {
      bossDamage,
      damage,
      defeatedMonsterId,
    });
  }

  nextSession.activeMonsterIndex = getNextLivingMonsterIndex(nextSession.team, targetIndex);
  nextSession.turnNumber += 1;

  return createTurnResult(nextSession, {
    bossDamage,
    damage,
    defeatedMonsterId,
  });
}

export function getBattleResultStatus(session: BattleSessionState): BattleResultStatus {
  return session.status;
}

export function getDefaultBossStageIndex(stages: readonly BossBattleStage[], claimedStageIds: ReadonlySet<string>): number {
  const firstUnclearedIndex = stages.findIndex((stage) => !claimedStageIds.has(stage.id));

  if (firstUnclearedIndex >= 0) {
    return firstUnclearedIndex;
  }

  return Math.max(0, stages.length - 1);
}

export function clampBossStageIndex(index: number, stages: readonly BossBattleStage[]): number {
  if (stages.length === 0) {
    return 0;
  }

  return Math.min(Math.max(Math.floor(index), 0), stages.length - 1);
}

export function isBossStageCleared(stageId: string, claimedStageIds: ReadonlySet<string>): boolean {
  return claimedStageIds.has(stageId);
}

export function canClaimBossFirstClearReward(
  stage: BossBattleStage,
  session: BattleSessionState | undefined,
  claimedStageIds: ReadonlySet<string>,
): boolean {
  return Boolean(session)
    && session?.stageId === stage.id
    && session.status === 'victory'
    && !isBossStageCleared(stage.id, claimedStageIds);
}

export function getBossReplayReward(stage: BossBattleStage): BossBattleStage['replayReward'] {
  return stage.replayReward;
}

export function reviveBattleSession(session: BattleSessionState): BattleSessionState {
  return {
    ...session,
    status: 'ready',
    reviveUsed: true,
    team: session.team.map((monster) => ({
      ...monster,
      hp: Math.max(1, Math.floor(monster.maxHp * 0.5)),
      shieldPercent: 0,
      counterDamage: 0,
    })),
  };
}

export function markReplayRewardGranted(session: BattleSessionState): BattleSessionState {
  return {
    ...session,
    replayRewardGranted: true,
  };
}

function createBattleMonsterSnapshot(monster: MonsterInstance): BattleMonsterSnapshot {
  const stats = getMonsterBattleStats(monster);

  return {
    id: monster.id,
    family: monster.family,
    level: monster.level,
    name: monster.name,
    incomePerSecond: monster.incomePerSecond,
    power: stats.power,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    attack: stats.attack,
    shieldPercent: 0,
    counterDamage: 0,
  };
}

function createTurnResult(
  session: BattleSessionState,
  result: Partial<Omit<BattleTurnResult, 'session' | 'status'>> = {},
): BattleTurnResult {
  return {
    session,
    status: session.status,
    damage: result.damage ?? 0,
    healing: result.healing ?? 0,
    bossDamage: result.bossDamage ?? 0,
    defeatedMonsterId: result.defeatedMonsterId,
  };
}

function getSkillCooldown(session: BattleSessionState, monsterId: string, skillId: BattleSkillId): number {
  return session.skillCooldowns[getSkillCooldownKey(monsterId, skillId)] ?? 0;
}

function getSkillCooldownKey(monsterId: string, skillId: BattleSkillId): string {
  return `${monsterId}:${skillId}`;
}

function decrementCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(cooldowns)
      .map(([key, turns]) => [key, Math.max(0, turns - 1)] as const)
      .filter(([, turns]) => turns > 0),
  );
}

function getLowestHpLivingMonster(team: BattleMonsterSnapshot[]): BattleMonsterSnapshot | undefined {
  return team
    .filter((monster) => monster.hp > 0)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
}

function getLivingActiveIndex(session: BattleSessionState): number {
  const active = session.team[session.activeMonsterIndex];

  if (active && active.hp > 0) {
    return session.activeMonsterIndex;
  }

  return session.team.findIndex((monster) => monster.hp > 0);
}

function getNextLivingMonsterIndex(team: readonly Pick<BattleMonsterSnapshot, 'hp'>[], currentIndex: number): number {
  if (team.length === 0) {
    return 0;
  }

  for (let offset = 1; offset <= team.length; offset += 1) {
    const nextIndex = (currentIndex + offset + team.length) % team.length;

    if ((team[nextIndex]?.hp ?? 1) > 0) {
      return nextIndex;
    }
  }

  return 0;
}
