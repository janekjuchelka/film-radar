# Film Radar – Android appka

Osobní Android APK: Netflix / Disney+ / Oneplay (CZ) + ČSFD ≥ 70 %.

## Důležité

Telefon **nemůže** číst data z tvého PC bez Wi‑Fi/USB.
Proto:

1. **Server** musí běžet na internetu (např. Render zdarma)
2. **Appka (APK)** se nainstaluje do telefonu a ptá se na adresu serveru

## 1) Server na internetu (Render)

1. Účet na [render.com](https://render.com) (zdarma)
2. **New → Web Service → Deploy from existing image / Dockerfile**
   - Root directory: `film-radar/server`
   - Dockerfile path: `./Dockerfile`
3. Po deployi získej URL typu `https://film-radar-xxxx.onrender.com`
4. Ověř v prohlížeči: `https://…/health` a `https://…/`
5. Jednou spusť scan:  
   `POST https://…/admin/run-scan`  
   (nebo v prohlížeči konzoli / Postman)

Lokálně pořád: `cd server && npm start`

## 2) Android APK

### Varianta A – EAS (cloud build)

```powershell
cd C:\KKLProjekt\film-radar\app
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build -p android --profile preview
```

Stáhni APK z odkazu, v telefonu povol instalaci z neznámých zdrojů, nainstaluj.

### Varianta B – lokálně (Android Studio)

Po instalaci Android Studio + SDK:

```powershell
cd C:\KKLProjekt\film-radar\app
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
adb install app\build\outputs\apk\release\app-release.apk
```

## 3) Po instalaci appky

1. Otevři **Film Radar**
2. **Nastavení** → vlož URL serveru (`https://…onrender.com`)
3. Ulož → uvidíš feed

## USB / prohlížeč (nouzově)

Když server běží na PC a telefon je přes USB ladění:

```powershell
adb reverse tcp:3847 tcp:3847
```

Chrome: `http://127.0.0.1:3847/`
