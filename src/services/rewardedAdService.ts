import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

export type RewardedAdReason = 'safe-ritual' | 'boss-revive' | 'boss-first-clear-x2' | 'boss-auto-clear-x2';

type AdsProviderMode = 'mock' | 'admob';

type ViteEnv = Record<string, string | undefined>;

export interface RewardedAdProvider {
  showRewardedAd(reason: RewardedAdReason): Promise<boolean>;
}

const REWARDED_AD_TIMEOUT_MS = 45_000;

const AD_UNIT_ENV_BY_REASON: Record<RewardedAdReason, string> = {
  'safe-ritual': 'VITE_ADMOB_REWARDED_SAFE_RITUAL_ANDROID',
  'boss-revive': 'VITE_ADMOB_REWARDED_BOSS_REVIVE_ANDROID',
  'boss-first-clear-x2': 'VITE_ADMOB_REWARDED_BOSS_FIRST_CLEAR_X2_ANDROID',
  'boss-auto-clear-x2': 'VITE_ADMOB_REWARDED_BOSS_AUTO_CLEAR_X2_ANDROID',
};

class MockRewardedAdProvider implements RewardedAdProvider {
  async showRewardedAd(_reason: RewardedAdReason): Promise<boolean> {
    await Promise.resolve();

    return true;
  }
}

class CapacitorAdMobRewardedProvider implements RewardedAdProvider {
  private initializePromise?: Promise<void>;

  async showRewardedAd(reason: RewardedAdReason): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return true;
    }

    const adId = getRewardedAdUnitId(reason);

    if (!adId) {
      return false;
    }

    try {
      await this.initialize();
      await AdMob.prepareRewardVideoAd({
        adId,
        immersiveMode: true,
        isTesting: getBooleanEnv('VITE_ADMOB_TESTING'),
      });

      return await this.showPreparedRewardedAd();
    } catch {
      return false;
    }
  }

  private initialize(): Promise<void> {
    this.initializePromise ??= AdMob.initialize({
      initializeForTesting: getBooleanEnv('VITE_ADMOB_TESTING'),
    });

    return this.initializePromise;
  }

  private async showPreparedRewardedAd(): Promise<boolean> {
    let rewarded = false;
    let settled = false;
    const listenerHandles = await Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewarded = true;
      }),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
        settled = true;
      }),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        settled = true;
      }),
    ]);

    try {
      const showPromise = AdMob.showRewardVideoAd()
        .then((reward) => {
          rewarded = Boolean(reward);
          settled = true;
        })
        .catch(() => {
          settled = true;
        });

      await withTimeout(waitForAdToSettle(showPromise, () => settled), REWARDED_AD_TIMEOUT_MS);

      return rewarded;
    } finally {
      await Promise.all(listenerHandles.map((handle) => handle.remove().catch(() => undefined)));
    }
  }
}

const mockProvider = new MockRewardedAdProvider();
const admobProvider = new CapacitorAdMobRewardedProvider();

export async function showRewardedAd(reason: RewardedAdReason): Promise<boolean> {
  return getRewardedAdProvider().showRewardedAd(reason);
}

function getRewardedAdProvider(): RewardedAdProvider {
  const mode = getAdsProviderMode();

  if (mode === 'admob') {
    return admobProvider;
  }

  return mockProvider;
}

function getAdsProviderMode(): AdsProviderMode {
  return getEnv('VITE_ADS_PROVIDER') === 'admob' ? 'admob' : 'mock';
}

function getRewardedAdUnitId(reason: RewardedAdReason): string | undefined {
  return getEnv(AD_UNIT_ENV_BY_REASON[reason]) ?? getEnv('VITE_ADMOB_REWARDED_DEFAULT_ANDROID');
}

function getBooleanEnv(key: string): boolean {
  return getEnv(key) === 'true';
}

function getEnv(key: string): string | undefined {
  const value = getViteEnv()[key];

  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function getViteEnv(): ViteEnv {
  return ((import.meta as unknown as { env?: ViteEnv }).env ?? {});
}

async function waitForAdToSettle(showPromise: Promise<void>, isSettled: () => boolean): Promise<void> {
  await showPromise;

  if (isSettled()) {
    return;
  }

  await new Promise<void>((resolve) => window.setTimeout(resolve, 250));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Rewarded ad timed out'));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}
