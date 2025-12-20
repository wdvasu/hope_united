# Windows deployment via GitHub (PowerShell)

Use an elevated PowerShell (Run as Administrator). One command per line. Prefer `npm.cmd` / `npx.cmd` on Windows.
## Prerequisites
- Windows 10/11
- Node.js 20 LTS (node -v shows >= 20.9)
- Git
- PostgreSQL reachable at 127.0.0.1:5432 with database `hope_united`
- The repository cloned at `C:\\HopeUnited` and `.env` configured

## Standard update
1. Stop app on port 3000 (if running)
```
netstat -ano | findstr :3000
# if a PID appears, replace <PID> and run:
Stop-Process -Id <PID> -Force
```

2. Pull latest and install
```
cd C:\\HopeUnited
git pull origin main
npm.cmd ci
```

3. Migrate DB and generate Prisma client
```
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```
Fallbacks if `npx` is blocked by execution policy:
```
.\\node_modules\\.bin\\prisma.cmd migrate deploy
.\\node_modules\\.bin\\prisma.cmd generate
```

4. Build
```
npm.cmd run build
```

5. Start the app (choose one)
- Background (detached):
```
Start-Process -NoNewWindow -FilePath npm.cmd -ArgumentList 'run','start','--','-p','3000','-H','0.0.0.0'
```
- Foreground (in the same window):
```
npm.cmd run start -- --port 3000 --hostname 0.0.0.0
```

6. Verify
- Admin: `http://<server-ip>:3000/admin`
- Kiosk: `http://<server-ip>:3000/start`

## If migrations fail (permissions or failed state)
If you see errors like P3018 (must be owner) or P3009 (failed migration):

A) Temporarily use the postgres superuser for migration only
```
$sec = Read-Host -AsSecureString "Postgres password"
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$enc   = [System.Uri]::EscapeDataString($plain)
$env:DATABASE_URL = "postgresql://postgres:$enc@127.0.0.1:5432/hope_united?schema=public"
```

B) If Prisma reports a specific migration as failed, mark it rolled back, then deploy
```
# Only if Prisma told you the migration name failed (e.g. 20251219_add_registration_link_to_activity)
npx.cmd prisma migrate resolve --rolled-back <migration_name>
npx.cmd prisma migrate deploy
```
Fallbacks if `npx` is blocked:
```
.\\node_modules\\.bin\\prisma.cmd migrate resolve --rolled-back <migration_name>
.\\node_modules\\.bin\\prisma.cmd migrate deploy
```

C) Restore normal DATABASE_URL
```
Remove-Item Env:DATABASE_URL
```

## Troubleshooting
- Execution policy blocks `npm`/`npx`: always use `npm.cmd` / `npx.cmd`.
- Port 3000 in use: find the PID with `netstat -ano | findstr :3000` and stop it via `Stop-Process -Id <PID> -Force`.
- Firewall: allow inbound TCP 3000 in Windows Defender Firewall if tablets cannot connect.
- Node version: `node -v` must be >= 20.9 (Next.js 16 requirement). Install Node 20 LTS if needed.

## Optional: manage with PM2
```
npm.cmd i -g pm2
pm2 start npm --name hope -- run start -- --port 3000 --hostname 0.0.0.0
pm2 save
pm2 startup
```
