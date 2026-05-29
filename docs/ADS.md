# Rewarded Ads

Browser and local development builds use the mock rewarded-ad provider by default:

```env
VITE_ADS_PROVIDER=mock
```

Android native builds can use AdMob rewarded ads by setting:

```env
VITE_ADS_PROVIDER=admob
VITE_ADMOB_REWARDED_DEFAULT_ANDROID=
VITE_ADMOB_REWARDED_SAFE_RITUAL_ANDROID=
VITE_ADMOB_REWARDED_BOSS_REVIVE_ANDROID=
VITE_ADMOB_REWARDED_BOSS_FIRST_CLEAR_X2_ANDROID=
VITE_ADMOB_REWARDED_BOSS_AUTO_CLEAR_X2_ANDROID=
```

Use Google test ad IDs only for testing. Production ad unit IDs and the Android AdMob app ID must be supplied by the app owner's AdMob account before release.
For Android, replace `REPLACE_WITH_ADMOB_APP_ID` in `android/app/src/main/res/values/strings.xml` before enabling the real AdMob provider.

Rewards are granted only after the rewarded ad reports completion. Missing IDs, load failures, show failures, dismissals without reward, and timeouts return `false` and grant nothing.
