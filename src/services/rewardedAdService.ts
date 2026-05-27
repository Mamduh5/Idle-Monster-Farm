export type RewardedAdReason = 'safe-ritual' | 'boss-revive';

export async function showRewardedAd(_reason: RewardedAdReason): Promise<boolean> {
  await Promise.resolve();

  return true;
}
