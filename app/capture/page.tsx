import { AREA_META, AREA_ORDER } from "@/lib/areas";
import { createGoal, createAction, createNote, createPerson } from "@/app/actions";
import CaptureTabs from "@/components/CaptureTabs";

export const dynamic = "force-dynamic";

export default async function CapturePage({ searchParams }: { searchParams: Promise<{ area?: string; type?: string }> }) {
  const sp = await searchParams;
  const defaultArea = (sp.area && AREA_ORDER.includes(sp.area as any) ? sp.area : "tasks");
  const type = (sp.type as "action" | "goal" | "note" | "person") || "action";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[40px] leading-none font-semibold tracking-tight">Add</h1>
        <p className="text-sub text-sm mt-2">Capture a goal, action, idea, or person.</p>
      </header>

      <CaptureTabs type={type} defaultArea={defaultArea} />

      {type === "action" && (
        <form action={createAction} className="card p-5 space-y-4 slide-up">
          <Field label="Title">
            <input name="title" required className="input" placeholder="e.g. 10 cold messages" autoFocus />
          </Field>
          <Field label="Area">
            <AreaSelect defaultValue={defaultArea} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadence">
              <select name="cadence" className="input" defaultValue="daily">
                <option value="once">once</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="custom">custom</option>
              </select>
            </Field>
            <Field label="Every (days)">
              <input name="intervalDays" type="number" min="1" className="input" placeholder="e.g. 3" />
            </Field>
          </div>
          <button className="btn btn-accent w-full text-base h-11">Save action</button>
        </form>
      )}

      {type === "goal" && (
        <form action={createGoal} className="card p-5 space-y-4 slide-up">
          <Field label="Title">
            <input name="title" required className="input" placeholder="e.g. Hit $10k MRR" autoFocus />
          </Field>
          <Field label="Area">
            <AreaSelect defaultValue={defaultArea} />
          </Field>
          <Field label="Why does this matter">
            <textarea name="why" rows={3} className="input" placeholder="Read this on rough days." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metric">
              <input name="targetMetric" className="input" placeholder="MRR, kg, time" />
            </Field>
            <Field label="Target">
              <input name="targetValue" className="input" placeholder="$10,000" />
            </Field>
          </div>
          <button className="btn btn-accent w-full text-base h-11">Save goal</button>
        </form>
      )}

      {type === "note" && (
        <form action={createNote} className="card p-5 space-y-4 slide-up">
          <Field label="Area">
            <AreaSelect defaultValue={defaultArea} />
          </Field>
          <Field label="Idea / note">
            <textarea name="body" rows={6} required className="input" placeholder="Brain dump…" autoFocus />
          </Field>
          <button className="btn btn-accent w-full text-base h-11">Save note</button>
        </form>
      )}

      {type === "person" && (
        <form action={createPerson} className="card p-5 space-y-4 slide-up">
          <Field label="Name">
            <input name="name" required className="input" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relationship">
              <input name="relationship" className="input" placeholder="family, friend, mentor" />
            </Field>
            <Field label="Reach out every">
              <input name="cadenceDays" type="number" min="1" defaultValue="14" className="input" />
            </Field>
          </div>
          <button className="btn btn-accent w-full text-base h-11">Save person</button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function AreaSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select name="area" className="input" defaultValue={defaultValue}>
      {AREA_ORDER.map((a) => (
        <option key={a} value={a}>{AREA_META[a].emoji} {AREA_META[a].label}</option>
      ))}
    </select>
  );
}
