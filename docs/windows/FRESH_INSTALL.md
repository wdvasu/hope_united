# Fresh Install on Windows (One-Command)

Use this when you want a clean reinstall of the Hope United app without touching PostgreSQL.

What this does
- Stops and removes existing app services
- Deletes the app folder (C:\\HopeUnited) safely
- Expands your deployment ZIP into C:\\HopeUnited
- Runs the hardened installer to build and (re)register services
- Does NOT install or modify PostgreSQL

Prereqs
- A working PostgreSQL DATABASE_URL (DB is already provisioned)
- Your LAN IP (static preferred), e.g., 192.168.0.99
- A deployment ZIP of the repo (created on your machine)
- Admin PowerShell on the Windows host

Steps
1) Open Admin PowerShell
```
Set-ExecutionPolicy Bypass -Scope Process -Force
cd C:\\
```

2) Place the deployment ZIP on the machine, e.g.
```
C:\\Users\\Public\\Downloads\\hope_united.zip
```

3) Run the fresh installer
```
cd C:\\HopeUnited  # if not present, any working dir is fine
powershell -ExecutionPolicy Bypass -File .\\scripts\\windows\\fresh-install.ps1 \
  -ZipPath "C:\\Users\\Public\\Downloads\\hope_united.zip" \
  -LanIp 192.168.0.99 \
  -DbUrl "<YOUR_DATABASE_URL>"
```

Notes
- Add `-SkipWinget` if the machine has no internet or you want to skip dependency installs (Node, Caddy, NSSM, mkcert). The base installer will assume they are already present.
- Certificates are generated for your LAN IP via mkcert and used by Caddy automatically.
- Services created: `HopeUnited-Node` and `HopeUnited-Caddy`.

Verify
- https://192.168.0.99/admin (ignore browser warnings until tablets trust mkcert root)
- `sc query HopeUnited-Node` and `sc query HopeUnited-Caddy` should be RUNNING

Tablet trust (iPad/Android)
- On Windows, `mkcert -CAROOT` to find rootCA.pem
- Copy rootCA.pem to tablet and install as trusted CA
- iPad: Settings → Profile (install) → General → About → Certificate Trust Settings → enable full trust
- Android: rename to rootCA.cer → Settings → Security → Encryption & Credentials → Install from storage

Troubleshooting
- Logs: `C:\\HopeUnited\\logs\\` (use `nssm edit HopeUnited-Node`/`HopeUnited-Caddy` for live view)
- Test app directly: `curl http://127.0.0.1:3000/api/version`
- Port 443: `netstat -ano | findstr ":443"`

Uninstall
```
nssm stop HopeUnited-Caddy
nssm remove HopeUnited-Caddy confirm
nssm stop HopeUnited-Node
nssm remove HopeUnited-Node confirm
Remove-Item -Recurse -Force C:\\HopeUnited
```

See also: REMOTE_INSTALL.md for guided, step-by-step remote setup.
