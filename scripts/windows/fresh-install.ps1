Param(
  [Parameter(Mandatory=$true)][string]$ZipPath,
  [Parameter(Mandatory=$true)][string]$LanIp,
  [Parameter(Mandatory=$true)][string]$DbUrl,
  [string]$InstallDir = 'C:\\HopeUnited',
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

function Stop-And-Remove-Service($name) {
  try {
    if (Get-Service -Name $name -ErrorAction SilentlyContinue) {
      Write-Host "Stopping service $name ..." -ForegroundColor Cyan
      nssm stop $name | Out-Null
      Start-Sleep -Seconds 1
      nssm remove $name confirm | Out-Null
    }
  } catch {}
}

function Kill-Processes {
  Write-Host 'Killing lingering node/caddy processes (if any)...' -ForegroundColor Cyan
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
  Get-Process caddy -ErrorAction SilentlyContinue | Stop-Process -Force
}

function Remove-Dir-IfExists([string]$path) {
  if (-not (Test-Path $path)) { return }
  Write-Host "Removing $path ..." -ForegroundColor Cyan
  $retries = 5
  for ($i=0; $i -lt $retries; $i++) {
    try {
      Remove-Item -Recurse -Force -LiteralPath $path
      if (-not (Test-Path $path)) { return }
    } catch {
      Start-Sleep -Milliseconds 600
    }
  }
  if (Test-Path $path) {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $old = "${path}._old_${stamp}"
    Write-Warning "Could not delete $path after retries; renaming to $old"
    Rename-Item -LiteralPath $path -NewName $old -Force
  }
}

function Flatten-If-Single-Root([string]$root) {
  $children = Get-ChildItem -LiteralPath $root
  if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
    $only = $children[0].FullName
    if (Test-Path (Join-Path $only 'package.json')) {
      Write-Host 'Flattening extracted folder structure...' -ForegroundColor Cyan
      Get-ChildItem -LiteralPath $only -Force | Move-Item -Destination $root -Force
      Remove-Item -Recurse -Force -LiteralPath $only
    }
  }
}

Assert-Admin

Write-Host 'Preparing for fresh install...' -ForegroundColor Cyan
Stop-And-Remove-Service 'HopeUnited-Caddy'
Stop-And-Remove-Service 'HopeUnited-Node'
Kill-Processes

Remove-Dir-IfExists $InstallDir
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Host "Expanding archive from $ZipPath to $InstallDir ..." -ForegroundColor Cyan
Expand-Archive -LiteralPath $ZipPath -DestinationPath $InstallDir -Force
Flatten-If-Single-Root $InstallDir

Write-Host 'Running installer...' -ForegroundColor Cyan
Set-Location -LiteralPath $InstallDir
$args = @('-LanIp', $LanIp, '-DbUrl', $DbUrl)
if ($SkipWinget) { $args += '-SkipWinget' }
powershell -ExecutionPolicy Bypass -File '.\\scripts\\windows\\install.ps1' @args

Write-Host 'Fresh install completed.' -ForegroundColor Green
