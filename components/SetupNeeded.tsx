import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";

export default function SetupNeeded({ error }: { error: string }) {
  return (
    <div className="space-y-5">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">Setup needed</div>
        <h1 className="mt-2 text-[32px] font-semibold leading-none tracking-tight">Connect your database</h1>
      </header>

      <div className="card space-y-3 p-5">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Database size={16} className="text-accent" />
          Life OS needs a Turso database in production.
        </div>
        <ol className="space-y-2 pl-5 text-sm text-ink/85 list-decimal">
          <li>
            Create a free Turso DB at{" "}
            <a href="https://app.turso.tech" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent underline-offset-2 hover:underline">
              app.turso.tech <ExternalLink size={11} />
            </a>
            . Copy the <span className="text-ink">Database URL</span> and <span className="text-ink">Auth Token</span>.
          </li>
          <li>
            On your laptop, seed the DB once:
            <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-bg/60 p-3 text-xs text-ink/90">{`$env:TURSO_DATABASE_URL="libsql://..."
$env:TURSO_AUTH_TOKEN="..."
npm run db:seed`}</pre>
          </li>
          <li>
            In your Vercel project → <span className="text-ink">Settings → Environment Variables</span>, add:
            <ul className="mt-1 space-y-0.5 text-xs">
              <li><code className="rounded bg-bg/60 px-1.5 py-0.5">TURSO_DATABASE_URL</code></li>
              <li><code className="rounded bg-bg/60 px-1.5 py-0.5">TURSO_AUTH_TOKEN</code></li>
            </ul>
          </li>
          <li>Redeploy from the Deployments tab.</li>
        </ol>
      </div>

      <div className="card p-4">
        <div className="label">Error from server</div>
        <pre className="mt-2 overflow-x-auto text-[11px] text-sub">{error}</pre>
      </div>

      <Link href="/api/health" className="inline-flex items-center gap-1.5 text-xs text-sub underline underline-offset-2 hover:text-ink">
        Open /api/health for diagnostics <ExternalLink size={11} />
      </Link>
    </div>
  );
}
