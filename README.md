# Life OS

Personal goal & training tracker. Next.js (App Router) + Drizzle + libSQL/Turso. PWA installable.

## Local dev

```bash
npm install
npm run db:seed   # seed with your goals
npm run dev       # http://localhost:3000
```

Local data lives at `db/data.sqlite` (gitignored).

## Deploy (Vercel + Turso)

1. **Create a Turso DB** at [turso.tech](https://turso.tech) → grab the URL + auth token.
2. **Seed it from your laptop** (one-time):

   ```bash
   # PowerShell
   $env:TURSO_DATABASE_URL="libsql://..."
   $env:TURSO_AUTH_TOKEN="..."
   npm run db:seed
   ```

3. **Import the repo on Vercel** → [vercel.com/new](https://vercel.com/new) → pick this repo.
4. **Add env vars** in Vercel project settings:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
5. **Deploy.** First push triggers a build.
6. On your phone, open the Vercel URL → Share → Add to Home Screen.

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- Drizzle ORM
- libSQL (local file in dev, Turso in prod)
- Tailwind + lucide-react + framer-motion + canvas-confetti
- PWA manifest at `public/manifest.json`
