This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel
## Local HTTPS for tablet camera (mkcert)

Camera access on tablets requires HTTPS. Without a public domain, use mkcert on the host:

1) Install mkcert on macOS: `brew install mkcert`
2) Create a local CA: `mkcert -install`
3) Generate a cert for your LAN IP/host: `mkcert 192.168.1.10`
4) Configure your reverse proxy (Caddy/Nginx) to serve HTTPS on 443 using the generated cert/key and proxy to `127.0.0.1:3000`.
5) Install the mkcert root CA on iPad/Android so the LAN cert is trusted.

This enables the Login page camera scanner over your LAN.

## Windows Deployment (No Docker)

Target: Windows Server or Windows 10/11 machine. Components: Node.js 20 LTS, PostgreSQL, Caddy (reverse proxy with HTTPS), pm2 (process manager).

1) Install prerequisites
   - Node.js 20 LTS (x64) from nodejs.org
   - PostgreSQL (v15+) using the official Windows installer; record the port, user, password
   - Caddy: Download caddy.exe from caddyserver.com and place it in C:\caddy\
   - mkcert (optional, for LAN HTTPS): install via Chocolatey: `choco install mkcert`

2) Application setup
   - Clone repo to e.g. C:\apps\hope_united
   - Open PowerShell in that folder
   - Create a .env file with the following keys (values per your environment):
     - DATABASE_URL
     - SESSION_SECRET
     - APP_BASE_URL
   - Install deps and build:
     - npm ci
     - npx prisma generate
     - npx prisma migrate deploy (after you have created the database)
     - npm run build

3) Run with pm2
   - Install: `npm i -g pm2`
   - Start: `pm2 start npm --name hope_united -- start`
   - Boot: `pm2 save && pm2 startup` (follow the printed command to register the service)

4) Caddy reverse proxy with HTTPS
   - Create C:\caddy\Caddyfile:
     ```
     YOUR_DOMAIN_OR_LAN_IP {
       reverse_proxy 127.0.0.1:3000
     }
     ```
   - For public domains, Caddy will get certificates automatically via Let’s Encrypt.
   - For LAN IP, use mkcert to generate a cert and add to Caddyfile:
     ```
     192.168.1.10 {
       tls C:\\path\\to\\cert.pem C:\\path\\to\\key.pem
       reverse_proxy 127.0.0.1:3000
     }
     ```
   - Run Caddy: `caddy run --config C:\caddy\Caddyfile`

5) Database migration and backups
   - Create DB: use pgAdmin or psql to create database `hope_united`
   - Run: `npx prisma migrate deploy`
   - Schedule backups via pg_dump or a managed tool

6) Testing the flow
   - Visit https://YOUR_HOST/admin/enroll to enroll a tablet and print QR
   - On the tablet open https://YOUR_HOST/login and scan the QR
   - Open https://YOUR_HOST/register to submit a registration
   - Admin table at https://YOUR_HOST/admin/registrations; CSV available


The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
