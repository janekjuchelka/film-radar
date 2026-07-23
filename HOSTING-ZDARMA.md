# Hosting zdarma (bez kreditky)

Fly.io / Render často chtějí kartu. Proto používáme **GitHub Actions**:

1. Jednou denně GitHub sám prohledá Netflix / Disney+ / Oneplay + ČSFD
2. Výsledek uloží do `feed/titles.json`
3. Appka si ten soubor stáhne z pevné adresy

## Adresa pro appku

```text
https://raw.githubusercontent.com/janekjuchelka/film-radar/main/feed/titles.json
```

## Ruční spuštění scanu na GitHubu

GitHub → záložka **Actions** → **Daily Film Radar scan** → **Run workflow**
