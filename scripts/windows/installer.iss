; Inno Setup script for Hope United Windows LAN deployment
; Requires: Inno Setup 6

#define MyAppName "Hope United"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Hope United"
#define InstallDirName "HopeUnited"

; Customize these before building
#define LanIp "192.168.0.99"

[Setup]
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={pf64}\{#InstallDirName}
DisableDirPage=no
OutputBaseFilename=HopeUnitedSetup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Files]
; Copy app repo contents (build before running installer)
Source: "{#SourcePath}\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Run]
; Ensure prereqs available (require manual install if missing)
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js not found. Install Node.js 20 LTS and re-run.' }\""; Flags: runhidden
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) { throw 'NSSM not found. Install NSSM and re-run.' }\""; Flags: runhidden
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"if (-not (Get-Command caddy -ErrorAction SilentlyContinue)) { throw 'Caddy not found. Install Caddy and re-run.' }\""; Flags: runhidden
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) { throw 'mkcert not found. Install mkcert and re-run.' }\""; Flags: runhidden

; Generate certs and write Caddyfile
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; mkcert -install; mkcert -cert-file cert.pem -key-file key.pem {#LanIp}; $c=@('{#LanIp} {{','  encode gzip','  tls ./cert.pem ./key.pem','  reverse_proxy 127.0.0.1:3000','}}'); $c -replace '{{','{' -replace '}}','}' | Out-File -Encoding UTF8 'scripts/windows/Caddyfile'\""; Flags: runhidden

; Build and migrate
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; if (-not (Test-Path .env.production.local)) { echo 'NODE_ENV=production' > .env.production.local }; npm ci; npx prisma generate; npx prisma migrate deploy; npm run build\""; Flags: runhidden

; Register services
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; nssm install HopeUnited-Node 'C:\\Program Files\\nodejs\\node.exe' 'node_modules\\next\\dist\\bin\\next' start -p 3000; nssm set HopeUnited-Node AppDirectory '{app}'; nssm start HopeUnited-Node\""; Flags: runhidden
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; nssm install HopeUnited-Caddy 'C:\\Program Files\\Caddy\\caddy.exe' run --config '{app}\\scripts\\windows\\Caddyfile'; nssm set HopeUnited-Caddy AppDirectory '{app}'; nssm start HopeUnited-Caddy\""; Flags: runhidden

[Icons]
Name: "{autoprograms}\{#MyAppName} (Open)"; Filename: "https://{#LanIp}"
