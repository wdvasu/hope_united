; Inno Setup script for Hope United Windows LAN deployment
; Requires: Inno Setup 6

#define MyAppName "Hope United"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Hope United"
#define InstallDirName "HopeUnited"

; Customize these before building
#define LanIp "192.168.0.99" ; default, can be overridden in wizard

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
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; mkcert -install; mkcert -cert-file cert.pem -key-file key.pem {code:GetLanIp}; $c=@('{code:GetLanIp} {{','  encode gzip','  tls ./cert.pem ./key.pem','  reverse_proxy 127.0.0.1:3000','}}'); $c -replace '{{','{' -replace '}}','}' | Out-File -Encoding UTF8 'scripts/windows/Caddyfile'\""; Flags: runhidden

; Build and migrate
; Write/merge .env.production.local with DATABASE_URL and NODE_ENV, then build
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; if (-not (Test-Path .env.production.local)) { New-Item -ItemType File -Path .env.production.local | Out-Null }; $envPath = Join-Path (Get-Location) '.env.production.local'; $existing = Get-Content $envPath -ErrorAction SilentlyContinue; $kv = @{}; foreach($line in $existing){ if($line -match '^([^#=]+)=(.*)$'){ $kv[$matches[1]]=$matches[2] } }; $kv['NODE_ENV']='production'; $kv['DATABASE_URL']='{code:GetDbUrl}'; $out=@(); foreach($k in $kv.Keys){ $out += ($k+'='+$kv[$k]) }; $out | Out-File -FilePath $envPath -Encoding UTF8; npm ci; npx prisma generate; npx prisma migrate deploy; npm run build\""; Flags: runhidden

; Register services
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; nssm install HopeUnited-Node 'C:\\Program Files\\nodejs\\node.exe' 'node_modules\\next\\dist\\bin\\next' start -p 3000; nssm set HopeUnited-Node AppDirectory '{app}'; nssm start HopeUnited-Node\""; Flags: runhidden
Filename: "powershell"; Parameters: "-ExecutionPolicy Bypass -NoProfile -Command \"cd '{app}'; nssm install HopeUnited-Caddy 'C:\\Program Files\\Caddy\\caddy.exe' run --config '{app}\\scripts\\windows\\Caddyfile'; nssm set HopeUnited-Caddy AppDirectory '{app}'; nssm start HopeUnited-Caddy\""; Flags: runhidden

[Icons]
Name: "{autoprograms}\{#MyAppName} (Open)"; Filename: "https://{code:GetLanIp}"

[Code]
var
  InputPage: TWizardPage;
  LanIpEdit, DbUrlEdit: TNewEdit;

function GetLanIp(Param: string): string;
begin
  if (LanIpEdit.Text <> '') then
    Result := LanIpEdit.Text
  else
    Result := '{#LanIp}';
end;

function GetDbUrl(Param: string): string;
begin
  Result := DbUrlEdit.Text;
end;

procedure InitializeWizard;
var
  lbl: TNewStaticText;
begin
  InputPage := CreateCustomPage(wpWelcome, 'Network and Database', 'Configure LAN IP and database connection');

  lbl := TNewStaticText.Create(InputPage);
  lbl.Parent := InputPage.Surface;
  lbl.Caption := 'LAN IP address (used for TLS certificate and Start Menu link):';
  lbl.Left := ScaleX(0);
  lbl.Top := ScaleY(8);

  LanIpEdit := TNewEdit.Create(InputPage);
  LanIpEdit.Parent := InputPage.Surface;
  LanIpEdit.Left := ScaleX(0);
  LanIpEdit.Top := lbl.Top + ScaleY(18);
  LanIpEdit.Width := ScaleX(300);
  LanIpEdit.Text := '{#LanIp}';

  lbl := TNewStaticText.Create(InputPage);
  lbl.Parent := InputPage.Surface;
  lbl.Caption := 'DATABASE_URL (PostgreSQL connection string):';
  lbl.Left := ScaleX(0);
  lbl.Top := LanIpEdit.Top + ScaleY(34);

  DbUrlEdit := TNewEdit.Create(InputPage);
  DbUrlEdit.Parent := InputPage.Surface;
  DbUrlEdit.Left := ScaleX(0);
  DbUrlEdit.Top := lbl.Top + ScaleY(18);
  DbUrlEdit.Width := ScaleX(500);
  DbUrlEdit.Text := '';
end;
