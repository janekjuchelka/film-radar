# Trvalý hosting (Fly.io)

Cíl: appka na telefonu bez kabelu, se **stálou HTTPS adresou**.

## Co potřebuješ
- účet na [fly.io](https://fly.io) (zdarma na start)
- nainstalované `flyctl` (už připravujeme)

## Nasazení (na PC)

V PowerShell:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cd C:\KKLProjekt\film-radar\server

fly auth login
fly launch --copy-config --yes --name film-radar-cz --region ams
fly deploy
```

Po deployi uvidíš URL typu:

```text
https://film-radar-cz.fly.dev
```

Ověření:

```text
https://film-radar-cz.fly.dev/health
https://film-radar-cz.fly.dev/titles
```

První scan po startu může trvat několik minut.

## Appka
V **Nastavení** nastav URL na `https://film-radar-cz.fly.dev`  
(nebo nainstaluj novou APK s touto adresou jako výchozí).
