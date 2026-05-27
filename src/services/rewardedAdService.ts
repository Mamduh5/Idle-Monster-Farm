export type RewardedAdReason = 'safe-ritual' | 'boss-revive' | 'boss-first-clear-x2' | 'boss-auto-clear-x2';

export async function showRewardedAd(_reason: RewardedAdReason): Promise<boolean> {
  await Promise.resolve();

  return true;
}
