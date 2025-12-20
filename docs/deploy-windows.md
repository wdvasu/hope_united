# Windows deployment via GitHub (PowerShell) — Updated

Use an elevated PowerShell (Run as Administrator). One command per line. On Windows, always use `npm.cmd` / `npx.cmd`.

## Prerequisites
- Windows 10/11
- Node.js 20 LTS (Next.js requires node >= 20.9). Verify: `node -v`
- Git
- PostgreSQL reachable (typically 127.0.0.1:5432) with database `hope_united`
- Repo at `C:\HopeUnited` and a valid `.env`

## Quick update (copy/paste block)
Stop, update, migrate, build, restart.
```
# 1) Stop anything on port 3000 and kill lingering Node/pm2 to avoid EPERM locks
Get-Process -Name node,pm2 -ErrorAction SilentlyContinue | Stop-Process -Force
$pid3000 = (netstat -ano | findstr :3000 | Select-Object -First 1).ToString().Split()[-1]
if ($pid3000) { Stop-Process -Id $pid3000 -Force }

# 2) Update and install deps
cd C:\HopeUnited
git pull origin main
npm.cmd ci

# 3) Migrate DB and regenerate Prisma client
npx.cmd prisma migrate deploy
npx.cmd prisma generate

# 4) Build
npm.cmd run build

# 5) Restart (choose one)
# pm2 (recommended):
pm2 reload hope || npx.cmd pm2 start npm --name hope -- run start -- --port 3000 --hostname 0.0.0.0
pm2 save
# OR no pm2 (detached):
Start-Process -NoNewWindow -FilePath npm.cmd -ArgumentList 'run','start','--','-p','3000','-H','0.0.0.0'
```

## Standard update (explained)
1) Stop the app and free port 3000
```
Get-Process -Name node,pm2 -ErrorAction SilentlyContinue | Stop-Process -Force
netstat -ano | findstr :3000
# If a PID shows, stop it:
Stop-Process -Id <PID> -Force
```

2) Pull latest and install
```
cd C:\HopeUnited
git pull origin main
npm.cmd ci
```
If `npm.cmd ci` fails with EPERM (file lock on Prisma engine), make sure all Node processes are stopped (step 1) and rerun `npm.cmd ci`.

3) Database migrations and Prisma client
```
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```
Fallbacks if `npx` is blocked by execution policy:
```
.\node_modules\.bin\prisma.cmd migrate deploy
.\node_modules\.bin\prisma.cmd generate
```

4) Build
```
npm.cmd run build
```

5) Start the app
- With pm2 (recommended):
```
pm2 reload hope || npx.cmd pm2 start npm --name hope -- run start -- --port 3000 --hostname 0.0.0.0
pm2 save
```
- Without pm2 (run detached in background):
```
Start-Process -NoNewWindow -FilePath npm.cmd -ArgumentList 'run','start','--','-p','3000','-H','0.0.0.0'
```

6) Verify
- Admin: `http://<server-ip>:3000/admin`
- Kiosk: `http://<server-ip>:3000/start`

## Migrations: common issues and fixes
- P3018 (must be owner of table …): temporarily run migrations with the postgres superuser, then restore the normal URL.
```
$sec   = Read-Host -AsSecureString "Postgres password"
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$enc   = [System.Uri]::EscapeDataString($plain)
$env:DATABASE_URL = ('postgre' + 'sql://postgres:' + $enc + '@127.0.0.1:5432/hope_united?schema=public')

npx.cmd prisma migrate deploy
Remove-Item Env:DATABASE_URL
```

- P3009 (failed migration recorded): mark it as rolled back, then deploy again.
```
# Replace <migration_name> with the name Prisma reported as failed
npx.cmd prisma migrate resolve --rolled-back <migration_name>
npx.cmd prisma migrate deploy
```
Fallbacks if `npx` is blocked:
```
.\node_modules\.bin\prisma.cmd migrate resolve --rolled-back <migration_name>
.\node_modules\.bin\prisma.cmd migrate deploy
```

## Troubleshooting
- Node version: `node -v` must be >= 20.9 or the app won't start. Install Node 20 LTS.
- Execution policy: use `npm.cmd` / `npx.cmd` (or the direct `.\node_modules\.bin\*.cmd` paths).
- Port busy: `netstat -ano | findstr :3000` then `Stop-Process -Id <PID> -Force`.
- EPERM during `npm ci`: stop all Node/pm2 processes first; then rerun.
- Tablets show HTTPS errors: use HTTP (e.g., `http://<server-ip>:3000/start`) unless you have a valid certificate configured.
- Firewall: allow inbound TCP 3000 on the server.

## Optional: PM2 setup one-time
```
npm.cmd i -g pm2
# or without global install: npx.cmd pm2 <command>
pm2 start npm --name hope -- run start -- --port 3000 --hostname 0.0.0.0
pm2 save
pm2 startup
```
