# Android / Play Store Checklist

## Build Setup

1. Install dependencies: `npm install`
2. Configure rewarded ads in `.env` from `.env.example`.
3. Build and sync Android: `npm run android:sync`
4. Open Android Studio: `npm run android:open`

## App Identity

- App ID: `com.mamduh.idlemonsterfarm`
- App name: `Idle Monster Farm`
- Web output: `dist`

## AdMob

- Set `VITE_ADS_PROVIDER=admob` for Android builds that should use real rewarded ads.
- Replace `REPLACE_WITH_ADMOB_APP_ID` in `android/app/src/main/res/values/strings.xml` before release.
- Supply rewarded ad unit IDs through the `VITE_ADMOB_REWARDED_*_ANDROID` variables.
- Use Google test ad IDs only for testing.
- Do not ship test ad IDs or placeholder IDs to production.

## Release Prep

- Set Android `versionCode` and `versionName` in Android Studio.
- Configure release signing with developer-owned keys.
- Do not commit signing keys or keystore passwords.
- Prepare an app icon and splash assets before production release.
- Upload first to the Play Store internal testing track.

## Store Disclosures

- Privacy policy is required before production release.
- Data Safety should disclose rewarded ads/AdMob SDK usage.
- Progress is stored locally in browser/native app storage.
- There is no custom backend, cloud account, analytics, or in-app purchase system in this build.
