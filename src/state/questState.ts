import type { QuestDefinition, QuestId } from '../data/quests';

export type QuestClaimStatus = 'claimed' | 'complete' | 'in-progress';

export function createInitialQuestProgress(
  questDefinitions: readonly QuestDefinition[],
): Record<QuestId, number> {
  return Object.fromEntries(
    questDefinitions.map((quest) => [quest.id, 0]),
  ) as Record<QuestId, number>;
}

export function getQuestDefinition(
  questDefinitions: readonly QuestDefinition[],
  questId: QuestId,
): QuestDefinition | undefined {
  return questDefinitions.find((quest) => quest.id === questId);
}

export function getQuestProgress(
  quest: QuestDefinition,
  questProgress: Readonly<Record<QuestId, number>>,
  completedQuestIds: ReadonlySet<QuestId>,
): number {
  if (completedQuestIds.has(quest.id)) {
    return quest.goal;
  }

  const progress = questProgress[quest.id] ?? 0;

  if (!Number.isFinite(progress) || progress < 0) {
    return 0;
  }

  return Math.min(Math.floor(progress), quest.goal);
}

export function getSanitizedQuestProgress(
  questDefinitions: readonly QuestDefinition[],
  questProgress: Readonly<Record<QuestId, number>>,
  completedQuestIds: ReadonlySet<QuestId>,
): Record<QuestId, number> {
  return Object.fromEntries(
    questDefinitions.map((quest) => [
      quest.id,
      getQuestProgress(quest, questProgress, completedQuestIds),
    ]),
  ) as Record<QuestId, number>;
}

export function canIncrementQuest(
  questId: QuestId,
  completedQuestIds: ReadonlySet<QuestId>,
  claimedQuestIds: ReadonlySet<QuestId>,
): boolean {
  return !completedQuestIds.has(questId) && !claimedQuestIds.has(questId);
}

export function getIncrementedQuestProgress(
  quest: QuestDefinition,
  currentProgress: number,
  amount: number,
): number {
  return Math.min(currentProgress + amount, quest.goal);
}

export function getQuestClaimStatus(
  quest: QuestDefinition,
  completedQuestIds: ReadonlySet<QuestId>,
  claimedQuestIds: ReadonlySet<QuestId>,
): QuestClaimStatus {
  if (claimedQuestIds.has(quest.id)) {
    return 'claimed';
  }

  if (completedQuestIds.has(quest.id)) {
    return 'complete';
  }

  return 'in-progress';
}
