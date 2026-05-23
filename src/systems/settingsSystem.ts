export const SETTINGS_STORAGE_KEY = 'idle-monster-farm-settings';

export type GameSettings = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  outsideTapClosesPanels: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  soundEnabled: true,
  outsideTapClosesPanels: true,
};

export function loadSettings(): GameSettings {
  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!rawSettings) {
      return { ...DEFAULT_SETTINGS };
    }

    return normalizeSettings(JSON.parse(rawSettings));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings: GameSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Settings are non-critical placeholder preferences.
  }
}

function normalizeSettings(rawSettings: unknown): GameSettings {
  if (typeof rawSettings !== 'object' || rawSettings === null) {
    return { ...DEFAULT_SETTINGS };
  }

  const settingsRecord = rawSettings as Record<string, unknown>;

  return {
    musicEnabled: typeof settingsRecord.musicEnabled === 'boolean'
      ? settingsRecord.musicEnabled
      : DEFAULT_SETTINGS.musicEnabled,
    soundEnabled: typeof settingsRecord.soundEnabled === 'boolean'
      ? settingsRecord.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled,
    outsideTapClosesPanels: typeof settingsRecord.outsideTapClosesPanels === 'boolean'
      ? settingsRecord.outsideTapClosesPanels
      : DEFAULT_SETTINGS.outsideTapClosesPanels,
  };
}
