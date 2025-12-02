# Windows LAN Deployment (iPad + Android tablets)

This guide installs the Hope United server on a Windows desktop for LAN-only usage, with HTTPS suitable for tablet camera access (QR scanning). It uses:

- PostgreSQL 16 (local)
- Node.js 20 LTS
- Caddy as reverse proxy and TLS terminator
- mkcert to generate a trusted certificate for your LAN IP
- NSSM to run processes as Windows services (auto-start on boot)

Prereqs: Windows 10/11 with administrator rights and a static LAN IP (example: `192.168.0.99`).

If you are doing a remote install (Zoho Assist), see the printable guide:
- docs/windows/REMOTE_INSTALL.md

## 1) Install PostgreSQL 16 (once)

Option A — Winget (interactive):
- Open an elevated PowerShell and run: `winget install PostgreSQL.PostgreSQL.16`
- During setup, note the postgres superuser password.

Option B — EDB installer: download from postgresql.org and install normally.

Create app database/user (replace <PASSWORD> as needed):

Option A — if `psql` is on PATH:
```
psql -U postgres -h localhost -c "CREATE USER hopeunited WITH PASSWORD '<PASSWORD>';"
psql -U postgres -h localhost -c "CREATE DATABASE hope_united OWNER hopeunited;"
```

Option B — use full path (PostgreSQL 16 default install path):
```
"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -U postgres -h localhost -c "CREATE USER hopeunited WITH PASSWORD '<PASSWORD>';"
"C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -U postgres -h localhost -c "CREATE DATABASE hope_united OWNER hopeunited;"
```

## 2) One-time dependencies

Install via winget (elevated PowerShell):
```
winget install OpenJS.NodeJS.LTS
winget install CaddyServer.Caddy
winget install NSSM.NSSM
winget install FiloSottile.mkcert
```

## 3) Configure certificate for your LAN IP

Example IP: `192.168.0.99`

```
mkcert -install
mkcert -cert-file cert.pem -key-file key.pem 192.168.0.99
```

Note: iPad/Android must trust the mkcert root to avoid HTTPS camera issues. See section 7.

## 4) App configuration

Create `.env.production.local` in the repo root with:
- `NODE_ENV=production`
- A Prisma connection string named `DATABASE_URL` using your local PostgreSQL credentials. Example shape: user/password@localhost:5432/hope_united

Ensure `next.config.ts` includes your IP in `allowedDevOrigins` if you use dev assets; production build is unaffected.

## 5) Build and migrate

In an elevated PowerShell from the repo folder:
```
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

## 6) Caddy reverse proxy

Create `Caddyfile` (repo/scripts/windows/Caddyfile) like:
```
192.168.0.99 {
  encode gzip
  tls ./cert.pem ./key.pem
  reverse_proxy 127.0.0.1:3000
}
```

Open firewall for 443 (once):
```
netsh advfirewall firewall add rule name="HopeUnited HTTPS" dir=in action=allow protocol=TCP localport=443
```

## 7) Trust the root CA on tablets

Find mkcert root: `mkcert -CAROOT` → copy `rootCA.pem` to devices.

- iPad (iOS/iPadOS): AirDrop/email `rootCA.pem`, open and install profile (Settings → Profile Downloaded), then enable full trust (Settings → General → About → Certificate Trust Settings).
- Samsung/Android: copy `rootCA.pem`, rename to `rootCA.cer`, install as CA certificate (Settings → Security → Encryption & Credentials → Install from storage). Some devices require screen lock to install.

After trust, browsing `https://192.168.0.99` should show a secure padlock and allow camera access for QR.

## 8) Run as Windows services (auto-start)

From repo root (adjust paths if needed):

Node app service:
```
nssm install HopeUnited-Node "C:\\Program Files\\nodejs\\node.exe" "node_modules\\next\\dist\\bin\\next" start -p 3000
nssm set HopeUnited-Node AppDirectory "%CD%"
nssm start HopeUnited-Node
```

Caddy service:
```
nssm install HopeUnited-Caddy "C:\\Program Files\\Caddy\\caddy.exe" run --config "%CD%\\scripts\\windows\\Caddyfile"
nssm set HopeUnited-Caddy AppDirectory "%CD%"
nssm start HopeUnited-Caddy
```

Verify: visit `https://192.168.0.99` from iPad/Samsung.

## 9) PowerShell one-shot installer (optional)

See `scripts/windows/install.ps1` for a guided install which:
- Installs prerequisites via winget
- Generates mkcert certs for your IP
- Writes Caddyfile
- Installs Node/Caddy services via NSSM
- Builds the app and applies DB migrations

Run:
```
Set-ExecutionPolicy Bypass -Scope Process -Force; ./scripts/windows/install.ps1 -LanIp 192.168.0.99 -DbUrl "<your PostgreSQL connection string>"
```

## 10) Windows installer (Inno Setup)

We provide `scripts/windows/installer.iss` (Inno Setup script). It now prompts for LAN IP and DATABASE_URL at install time and will:
- Generate mkcert certs for your LAN IP
- Write `scripts/windows/Caddyfile`
- Create/update `.env.production.local` with `NODE_ENV=production` and your `DATABASE_URL`
- Run `npm ci`, `prisma generate`, `prisma migrate deploy`, and `npm run build`
- Register Node and Caddy as Windows services (NSSM)

Steps:
1. Install Inno Setup
2. Build the app first (section 5) or let the installer run the build
3. Double-click the generated `HopeUnitedSetup.exe`
4. Enter your LAN IP and PostgreSQL `DATABASE_URL` when prompted

Start Menu will include a shortcut to open `https://<LAN_IP>`.

---

## 11) Smoke tests (tablet workflow)

After install, verify the end-to-end flow over HTTPS:

1. Enroll device: https://<LAN_IP>/admin/enroll → enroll and print QR
2. Tablet device login: https://<LAN_IP>/login → scan the QR
3. Registration form: https://<LAN_IP>/register → submit a test registration
4. Admin tables: https://<LAN_IP>/admin/registrations and /admin/activity → verify data and exports
5. Activity login: https://<LAN_IP>/activity
   - Enter First name / Last initial / Birth year
   - If multiple matches, a dropdown should appear to choose the correct person
   - After login, the header should show: "Client: {Full Name}"
6. Activity multi-select and submit:
   - Select multiple activity categories and click "Save Selected Activities"
   - Success message shows the count saved
   - You are automatically logged out of the attendee session and returned to /activity login
7. Reboot test: reboot Windows and confirm services start and the site loads over HTTPS

If anything fails, capture NSSM service status and logs, and Caddy output.

---

Uninstall:
```
nssm stop HopeUnited-Caddy
nssm remove HopeUnited-Caddy confirm
nssm stop HopeUnited-Node
nssm remove HopeUnited-Node confirm
```
