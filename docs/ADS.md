# Rewarded Ads

Browser and local development builds use the mock rewarded-ad provider by default:

```env
VITE_ADS_PROVIDER=mock
```

`.env.example` is documentation only; Vite does not load it automatically. Copy it to `.env` for local overrides.

Android native test builds can use AdMob rewarded test ads by setting:

```env
VITE_ADS_PROVIDER=admob
VITE_ADMOB_TESTING=true
VITE_ADMOB_REWARDED_DEFAULT_ANDROID=ca-app-pub-3940256099942544/5224354917
VITE_ADMOB_REWARDED_SAFE_RITUAL_ANDROID=ca-app-pub-3940256099942544/5224354917
VITE_ADMOB_REWARDED_BOSS_REVIVE_ANDROID=ca-app-pub-3940256099942544/5224354917
VITE_ADMOB_REWARDED_BOSS_FIRST_CLEAR_X2_ANDROID=ca-app-pub-3940256099942544/5224354917
VITE_ADMOB_REWARDED_BOSS_AUTO_CLEAR_X2_ANDROID=ca-app-pub-3940256099942544/5224354917
```

Use Google test ad IDs only for testing. Production ad unit IDs and the Android AdMob app ID must be supplied by the app owner's AdMob account before release. Do not click production ads during testing.
For Android debug builds, `android/app/src/main/res/values/strings.xml` uses Google's official test app ID so the native metadata is valid at startup. Replace it with the app owner's production AdMob app ID before release, and do not commit production IDs.

Rewards are granted only after the rewarded ad reports completion. Missing IDs, load failures, show failures, dismissals without reward, and timeouts return `false` and grant nothing.
