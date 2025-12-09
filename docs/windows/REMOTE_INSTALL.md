# Remote Install (Zoho Assist) — Printable Steps

Goal: Install Hope United on a Windows 10/11 desktop over Zoho Assist and get tablets working over HTTPS on the LAN.

You will transfer the project folder (zip) and run a single PowerShell script with two parameters.

What you need ready before the session:
- PostgreSQL connection string (DATABASE_URL) with a database and user that Prisma can access
- The LAN IP to serve on (static recommended), e.g. 192.168.0.99
- A zip of this repo from your machine to send via Zoho Assist (right‑click folder → Compress)

On the remote Windows machine (as Administrator):

1) Prepare PowerShell
- Right‑click Start → Windows Terminal (Admin)
- Run: `Set-ExecutionPolicy Bypass -Scope Process -Force`

2) Transfer files via Zoho Assist
- Send the repo zip to, e.g., `C:\Users\Public\Downloads\hope_united.zip`
- Extract to `C:\HopeUnited` (so the repo root is `C:\HopeUnited\package.json`)

3) Open the folder
- In the Admin PowerShell: `cd C:\HopeUnited`

4) Run the installer script (this installs tools, builds the app, sets up services)
```
./scripts/windows/install.ps1 -LanIp 192.168.0.99 -DbUrl "<YOUR_DATABASE_URL>"
```
Notes:
- The script uses winget to install Node.js LTS, Caddy, NSSM, and mkcert if missing.
- It generates TLS certs for your LAN IP, writes the Caddyfile, applies Prisma migrations, and builds the app.
- It registers two services: HopeUnited-Node and HopeUnited-Caddy.

Fresh install option
- If you want a clean reinstall from a deployment ZIP in one step (without touching PostgreSQL), use:
```
powershell -ExecutionPolicy Bypass -File .\\scripts\\windows\\fresh-install.ps1 \
  -ZipPath "C:\\Users\\Public\\Downloads\\hope_united.zip" \
  -LanIp 192.168.0.99 \
  -DbUrl "<YOUR_DATABASE_URL>"
```
See docs/windows/FRESH_INSTALL.md for details.

5) Open firewall for HTTPS (one‑time)
```
netsh advfirewall firewall add rule name="HopeUnited HTTPS" dir=in action=allow protocol=TCP localport=443
```

6) Verify services
```
sc query HopeUnited-Node
sc query HopeUnited-Caddy
```
Both should be RUNNING.

7) Trust mkcert root on tablets
- On Windows: `mkcert -CAROOT` to find rootCA.pem
- Copy `rootCA.pem` to the iPad/Android and install as a trusted CA
- iPad: Settings → Profile (install) → General → About → Certificate Trust Settings (enable full trust)
- Android: rename to `rootCA.cer`, then Settings → Security → Encryption & Credentials → Install from storage

8) Smoke test from tablet
- Open: `https://192.168.0.99`
- Admin → Enroll → generate a QR
- Tablet Login → scan QR
- Register → submit a test entry
- Admin → Activity/Registrations show new data
- Activity → login, select multiple categories, Save; confirm it returns to login

9) Reboot test
- Reboot Windows, wait 30–60 seconds
- Verify `https://192.168.0.99` loads again automatically (services auto‑start)

Troubleshooting quick refs
- Show service logs/status with NSSM GUI: `nssm edit HopeUnited-Node` / `nssm edit HopeUnited-Caddy`
- Check port 443: `netstat -ano | findstr ":443"`
- Test app directly: `curl http://127.0.0.1:3000/api/version`
- Check cookies endpoint: `curl http://127.0.0.1:3000/api/debug/cookies`

Uninstall
```
nssm stop HopeUnited-Caddy
nssm remove HopeUnited-Caddy confirm
nssm stop HopeUnited-Node
nssm remove HopeUnited-Node confirm
```

That’s it — this page is formatted to print cleanly for field use.
