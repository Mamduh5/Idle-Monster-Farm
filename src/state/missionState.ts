import type { MissionDefinition, MissionId } from '../data/missions';

export type MissionClaimStatus = 'claimed' | 'complete' | 'in-progress';

export function createInitialMissionProgress(
  missionDefinitions: readonly MissionDefinition[],
): Record<MissionId, number> {
  return Object.fromEntries(
    missionDefinitions.map((mission) => [mission.id, 0]),
  ) as Record<MissionId, number>;
}

export function getMissionDefinition(
  missionDefinitions: readonly MissionDefinition[],
  missionId: MissionId,
): MissionDefinition | undefined {
  return missionDefinitions.find((mission) => mission.id === missionId);
}

export function getMissionProgress(
  mission: MissionDefinition,
  missionProgress: Readonly<Record<MissionId, number>>,
  completedMissionIds: ReadonlySet<MissionId>,
): number {
  if (completedMissionIds.has(mission.id)) {
    return mission.goal;
  }

  const progress = missionProgress[mission.id] ?? 0;

  if (!Number.isFinite(progress) || progress < 0) {
    return 0;
  }

  return Math.min(Math.floor(progress), mission.goal);
}

export function getSanitizedMissionProgress(
  missionDefinitions: readonly MissionDefinition[],
  missionProgress: Readonly<Record<MissionId, number>>,
  completedMissionIds: ReadonlySet<MissionId>,
): Record<MissionId, number> {
  return Object.fromEntries(
    missionDefinitions.map((mission) => [
      mission.id,
      getMissionProgress(mission, missionProgress, completedMissionIds),
    ]),
  ) as Record<MissionId, number>;
}

export function canIncrementMission(
  missionId: MissionId,
  completedMissionIds: ReadonlySet<MissionId>,
  claimedMissionIds: ReadonlySet<MissionId>,
): boolean {
  return !completedMissionIds.has(missionId) && !claimedMissionIds.has(missionId);
}

export function getIncrementedMissionProgress(
  mission: MissionDefinition,
  currentProgress: number,
  amount: number,
): number {
  return Math.min(currentProgress + amount, mission.goal);
}

export function getMissionClaimStatus(
  mission: MissionDefinition,
  completedMissionIds: ReadonlySet<MissionId>,
  claimedMissionIds: ReadonlySet<MissionId>,
): MissionClaimStatus {
  if (claimedMissionIds.has(mission.id)) {
    return 'claimed';
  }

  if (completedMissionIds.has(mission.id)) {
    return 'complete';
  }

  return 'in-progress';
}

export function isMissionCompleted(
  missionId: MissionId,
  completedMissionIds: ReadonlySet<MissionId>,
): boolean {
  return completedMissionIds.has(missionId);
}

export function isMissionClaimed(
  missionId: MissionId,
  claimedMissionIds: ReadonlySet<MissionId>,
): boolean {
  return claimedMissionIds.has(missionId);
}
