import { getDefaultLanguage, isLanguageCode, type LanguageCode } from '../i18n/translations';

export const SETTINGS_STORAGE_KEY = 'idle-monster-farm-settings';

export type GameSettings = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  outsideTapClosesPanels: boolean;
  language: LanguageCode;
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  soundEnabled: true,
  outsideTapClosesPanels: true,
  language: 'en',
};

export function loadSettings(): GameSettings {
  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!rawSettings) {
      return createDefaultSettings();
    }

    return normalizeSettings(JSON.parse(rawSettings));
  } catch {
    return createDefaultSettings();
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
    return createDefaultSettings();
  }

  const settingsRecord = rawSettings as Record<string, unknown>;
  const defaults = createDefaultSettings();

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
    language: isLanguageCode(settingsRecord.language)
      ? settingsRecord.language
      : defaults.language,
  };
}

function createDefaultSettings(): GameSettings {
  return {
    ...DEFAULT_SETTINGS,
    language: getDefaultLanguage(),
  };
}
