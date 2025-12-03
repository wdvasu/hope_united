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

function Resolve-Exe([string[]]$candidates, [string]$wingetId) {
  foreach ($name in $candidates) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
  }
  # common WinGet shim location
  foreach ($name in $candidates) {
    $shim = Join-Path "$env:LOCALAPPDATA\Microsoft\WinGet\Links" ($name -replace '\\.exe$','')
    if (Test-Path "$shim.exe") { return "$shim.exe" }
  }
  if ($wingetId) {
    Ensure-Tool $wingetId ($candidates[0])
    foreach ($name in $candidates) {
      $cmd = Get-Command $name -ErrorAction SilentlyContinue
      if ($cmd) { return $cmd.Source }
    }
    foreach ($name in $candidates) {
      $shim = Join-Path "$env:LOCALAPPDATA\Microsoft\WinGet\Links" ($name -replace '\\.exe$','')
      if (Test-Path "$shim.exe") { return "$shim.exe" }
    }
  }
  throw "Could not resolve executable: $($candidates -join ', ')"
}

function Set-ServiceLogs($name, $logDir) {
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  nssm set $name AppStdout (Join-Path $logDir ("$name.out.log")) | Out-Null
  nssm set $name AppStderr (Join-Path $logDir ("$name.err.log")) | Out-Null
}

Assert-Admin

# 1) Dependencies
Ensure-Tool 'OpenJS.NodeJS.LTS' 'node'
Ensure-Tool 'CaddyServer.Caddy' 'caddy'
Ensure-Tool 'NSSM.NSSM' 'nssm'
Ensure-Tool 'FiloSottile.mkcert' 'mkcert'

$mkcert = Resolve-Exe @('mkcert.exe','mkcert') 'FiloSottile.mkcert'
$caddy  = Resolve-Exe @('caddy.exe','caddy')   'CaddyServer.Caddy'
$node   = Resolve-Exe @('node.exe','node')     'OpenJS.NodeJS.LTS'

# 2) Certs
Write-Host 'Installing mkcert root and generating LAN cert...' -ForegroundColor Cyan
& $mkcert -install
& $mkcert -cert-file cert.pem -key-file key.pem $LanIp

# 3) Env
Write-Host 'Writing .env and .env.production.local...' -ForegroundColor Cyan
@(
  'NODE_ENV=production',
  "DATABASE_URL=$DbUrl"
) | Out-File -FilePath (Join-Path $PWD '.env.production.local') -Encoding UTF8
@(
  'NODE_ENV=production',
  "DATABASE_URL=$DbUrl"
) | Out-File -FilePath (Join-Path $PWD '.env') -Encoding UTF8

# 3b) Quiesce services and clean working directory to avoid file locks
Write-Host 'Stopping services and cleaning working directory...' -ForegroundColor Cyan
if (Get-Service -Name 'HopeUnited-Node' -ErrorAction SilentlyContinue) {
  nssm stop HopeUnited-Node | Out-Null
  nssm remove HopeUnited-Node confirm | Out-Null
}
if (Get-Service -Name 'HopeUnited-Caddy' -ErrorAction SilentlyContinue) {
  nssm stop HopeUnited-Caddy | Out-Null
  nssm remove HopeUnited-Caddy confirm | Out-Null
}
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process caddy -ErrorAction SilentlyContinue | Stop-Process -Force
if (Test-Path (Join-Path $PWD 'node_modules')) { Remove-Item -Recurse -Force -Path (Join-Path $PWD 'node_modules') }

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
npx prisma@6.19.0 generate
npx prisma@6.19.0 migrate deploy
Write-Host 'Building Next.js app...' -ForegroundColor Cyan
npm run build

# 6) Firewall
Write-Host 'Opening firewall for 443 (if needed)...' -ForegroundColor Cyan
netsh advfirewall firewall add rule name="HopeUnited HTTPS" dir=in action=allow protocol=TCP localport=443 | Out-Null

# 7) Services
Write-Host 'Configuring Windows services with NSSM...' -ForegroundColor Cyan
if (Get-Service -Name 'HopeUnited-Node' -ErrorAction SilentlyContinue) {
  nssm stop HopeUnited-Node | Out-Null
  nssm remove HopeUnited-Node confirm | Out-Null
}
if (Get-Service -Name 'HopeUnited-Caddy' -ErrorAction SilentlyContinue) {
  nssm stop HopeUnited-Caddy | Out-Null
  nssm remove HopeUnited-Caddy confirm | Out-Null
}

nssm install HopeUnited-Node "$node" "node_modules\next\dist\bin\next" start -p 3000
nssm set HopeUnited-Node AppDirectory "$PWD"
nssm set HopeUnited-Node AppEnvironmentExtra "NODE_ENV=production;DATABASE_URL=$DbUrl"
Set-ServiceLogs -name HopeUnited-Node -logDir (Join-Path $PWD 'logs')
nssm start HopeUnited-Node

nssm install HopeUnited-Caddy "$caddy" run --config "${PWD}\scripts\windows\Caddyfile"
nssm set HopeUnited-Caddy AppDirectory "$PWD"
Set-ServiceLogs -name HopeUnited-Caddy -logDir (Join-Path $PWD 'logs')
nssm start HopeUnited-Caddy

# 8) Health checks
Write-Host 'Health check: Node (http://127.0.0.1:3000/admin)...' -ForegroundColor Cyan
try {
  Invoke-WebRequest -Uri 'http://127.0.0.1:3000/admin' -UseBasicParsing -TimeoutSec 15 | Out-Null
  Write-Host 'Node OK' -ForegroundColor Green
} catch {
  Write-Warning 'Node did not respond as expected. Check C:\\HopeUnited\\logs\\node.err.log'
}

Write-Host "Health check: Caddy (https://$LanIp/admin)..." -ForegroundColor Cyan
$prev = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
try {
  Invoke-WebRequest -Uri ("https://$LanIp/admin") -UseBasicParsing -TimeoutSec 15 | Out-Null
  Write-Host 'Caddy OK' -ForegroundColor Green
} catch {
  Write-Warning 'Caddy did not respond as expected. Check logs/caddy.err.log and cert files.'
} finally {
  [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $prev
}

Write-Host "Done. Visit https://$LanIp from iPad/Android after trusting mkcert root (see docs/windows/DEPLOY.md)." -ForegroundColor Green
