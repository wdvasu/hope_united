# ACTUAL Windows Deployment Process (CONFIRMED WORKING)

**Last verified:** 2026-01-07

## Current Setup
- Location: `C:\HopeUnited`
- Method: Direct npm start (NO pm2, NO NSSM)
- Port: 3000
- Start command: `npm.cmd run start`

## Standard Update Process

### Step 1: Stop the application
```powershell
# Stop any running node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Update code
```powershell
cd C:\HopeUnited
git pull origin main
```

### Step 3: Build (only if code changed, not for config changes)
```powershell
npm.cmd run build
```

### Step 4: Start the application
```powershell
npm.cmd run start
```

## When to run additional commands

### Only run `npm.cmd ci` if:
- package.json dependencies changed
- You're getting module errors

### Only run database migrations if:
- There are new migration files in `prisma/migrations/`
```powershell
npx.cmd prisma migrate deploy
```

## Troubleshooting

### If port 3000 is busy:
```powershell
netstat -ano | findstr :3000
# Find the PID and kill it:
Stop-Process -Id <PID> -Force
```

### If you get EPERM errors:
- Make sure all node processes are stopped first
- Close any code editors or file explorers looking at the folder
- Rerun the command

## DO NOT:
- Use NSSM commands
- Use pm2 commands
- Follow complex deployment guides without confirming first
