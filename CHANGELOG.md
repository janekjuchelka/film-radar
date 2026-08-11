# Changelog

## 1.1.2 (2026-08-11)

- Seriály: do feedu jako „nový seriál“ jen nedávné premiéry (ne Šógun jen proto, že je v trendu).
- Staré seriály se dál sledují kvůli nové řadě / novému provideru.
- Filmy: first-seen na službě zůstává (i starší premiéry).

## 1.1.1 (2026-08-10)

- Oprava: sken znovu bere **nově objevené tituly na službě** (ne jen filmové premiéry 2025+).
- Novinka i při **novém poskytovateli** u už sledovaného titulu.
- Záložka Nové: okno **7 dní**.
- Do feedu zpětně doplněny tituly objevené v posledních 14 dnech.

## 1.1.0 (2026-07-30)

- Přísnější „Nové“: ve feedu jen premiéry z posledních ~2 let, nebo reálně nová řada (ne starý katalog).
- Širší sken (více kandidátů / POPULAR + TRENDING + RELEASE_YEAR).
- UI: méně textu nahoře, větší taby, české „Seznam“, hint jen u Seznamu.
- Neutrální značky služeb místo oficiálních log + disclaimer v Nastavení.
- Lokální notifikace při nových titulech s ČSFD ≥ 75 %.
- Práh ČSFD ≥ 60 %.

## 1.0.2 (2026-07-30)

- Práh ČSFD snížen z 70 % na **60 %** (sken + export feedu).

## 1.0.1 (2026-07-28)

- Odebrána funkce `Viděno` / `Viděl jsem`.
- Watchlist sjednocený napříč celou appkou.
- Smazané tituly zůstávají trvale skryté bez UI pro obnovu.

## 1.0.0 (2026-07-27)

- První stabilní verze Film Radar pro Android.
- Feed z GitHubu (`feed/titles.json`), denní sken Netflix / Disney+ / Oneplay + ČSFD ≥ 70 %.
- Taby Objevuj, Nové, Watchlist, Viděno; filtry typu a služby.
- Watchlist, označení jako viděné, trvalé skrytí swipem.
- Offline: poslední úspěšný feed zůstane v paměti po výpadku sítě.
- Nastavení: vlastní URL feedu, obnova skrytých titulů.
