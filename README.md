# Film Radar

Osobní Android aplikace: novinky na **Netflix**, **Disney+** a **Oneplay** (Česko) s hodnocením **ČSFD ≥ 60 %**.

## Jak to funguje

1. **GitHub Actions** (~2× denně) projde služby a uloží výsledek do [`feed/titles.json`](feed/titles.json).
2. **APK** si feed stáhne z GitHubu — žádný vlastní server není potřeba.
3. Seznam (watchlist) a swipe = smazat natrvalo — vše jen v telefonu (AsyncStorage).
4. Notifikace při nových titulech s ČSFD ≥ 75 %.

Podrobnosti hostingu: [HOSTING-ZDARMA.md](HOSTING-ZDARMA.md).

## Instalace (APK)

1. Stáhni nejnovější build:  
   [FilmRadar.apk](https://raw.githubusercontent.com/janekjuchelka/film-radar/main/FilmRadar.apk)
2. V Androidu povol instalaci z neznámého zdroje.
3. Nainstaluj — výchozí feed je už nastavený.

**Obnovení dat:** stáhni seznam dolů (pull-to-refresh).

## Funkce v appce

| Oblast | Popis |
|--------|--------|
| **Objevuj** | Aktuální novinky (nedávné premiéry / nové řady), mimo Seznam a skryté |
| **Nové** | Čerstvé události (cca 7 dní) |
| **Seznam** | Uložené k pozdějšímu sledování |
| **Nastavení ⚙** | Feed URL, disclaimer, verze |

## Vývoj a build APK

```powershell
cd C:\KKLProjekt\film-radar\app
npm install
npx tsc --noEmit
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:GRADLE_USER_HOME = "C:\g"
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Release APK zkopíruj do kořene repa jako `FilmRadar.apk`.

## Volitelný vlastní server

Složka [`server/`](server/) — Express API + lokální sken. Pro běžné použití stačí GitHub feed.

## Verze

Aktuální: **1.1.1** — viz [CHANGELOG.md](CHANGELOG.md).
