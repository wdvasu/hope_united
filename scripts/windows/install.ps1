Param(
  [Parameter(Mandatory=$true)][string]$LanIp,
  [Parameter(Mandatory=$true)][string]$DbUrl,
  [switch]$SkipWinget
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error 'Run this script in an elevated PowerShell (Run as administrator).'
  }
}

function Ensure-Tool($id, $exe) {
  if (Get-Command $exe -ErrorAction SilentlyContinue) { return }
  if ($SkipWinget) { Write-Error "Missing $exe and SkipWinget set" }
  Write-Host "Installing $id via winget..." -ForegroundColor Cyan
  winget install --id $id --accept-package-agreements --accept-source-agreements --silent
}

Assert-Admin

# 1) Dependencies
Ensure-Tool 'OpenJS.NodeJS.LTS' 'node'
Ensure-Tool 'CaddyServer.Caddy' 'caddy'
Ensure-Tool 'NSSM.NSSM' 'nssm'
Ensure-Tool 'FiloSottile.mkcert' 'mkcert'

# 2) Certs
Write-Host 'Installing mkcert root and generating LAN cert...' -ForegroundColor Cyan
mkcert -install
& mkcert -cert-file cert.pem -key-file key.pem $LanIp

# 3) Env
Write-Host 'Writing .env.production.local...' -ForegroundColor Cyan
@(
  'NODE_ENV=production',
  "DATABASE_URL=$DbUrl"
) | Out-File -FilePath (Join-Path $PWD '.env.production.local') -Encoding UTF8

# 4) Caddyfile
Write-Host 'Writing scripts/windows/Caddyfile...' -ForegroundColor Cyan
$caddyDir = Join-Path $PWD 'scripts/windows'
New-Item -ItemType Directory -Force -Path $caddyDir | Out-Null
@(
  "$LanIp {",
  '  encode gzip',
  '  tls ./cert.pem ./key.pem',
  '  reverse_proxy 127.0.0.1:3000',
  '}'
) | Out-File -FilePath (Join-Path $caddyDir 'Caddyfile') -Encoding UTF8

# 5) Build + migrate
Write-Host 'Installing node modules (npm ci)...' -ForegroundColor Cyan
npm ci
Write-Host 'Prisma generate + migrate deploy...' -ForegroundColor Cyan
npx prisma generate
npx prisma migrate deploy
Write-Host 'Building Next.js app...' -ForegroundColor Cyan
npm run build

# 6) Firewall
Write-Host 'Opening firewall for 443 (if needed)...' -ForegroundColor Cyan
netsh advfirewall firewall add rule name="HopeUnited HTTPS" dir=in action=allow protocol=TCP localport=443 | Out-Null

# 7) Services
Write-Host 'Configuring Windows services with NSSM...' -ForegroundColor Cyan
nssm install HopeUnited-Node "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" start -p 3000
nssm set HopeUnited-Node AppDirectory "$PWD"
nssm start HopeUnited-Node

nssm install HopeUnited-Caddy "C:\Program Files\Caddy\caddy.exe" run --config "${PWD}\scripts\windows\Caddyfile"
nssm set HopeUnited-Caddy AppDirectory "$PWD"
nssm start HopeUnited-Caddy

Write-Host "Done. Visit https://$LanIp from iPad/Android after trusting mkcert root (see docs/windows/DEPLOY.md)." -ForegroundColor Green
