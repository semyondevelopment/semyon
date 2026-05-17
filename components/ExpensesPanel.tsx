"use client";
import { useTransition } from "react";
import { createExpense, deleteExpense } from "@/app/actions";
import type { Expense } from "@/db/schema";
import { Receipt, Trash2, Plus, Repeat } from "lucide-react";

const CATEGORIES = ["rent", "groceries", "gym", "transport", "software", "marketing", "fun", "other"];

export default function ExpensesPanel({ expenses }: { expenses: Expense[] }) {
  const [pending, start] = useTransition();

  const monthAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const month = expenses.filter((e) => e.dateKey >= monthAgo);
  const total = month.reduce((s, e) => s + e.amount, 0);
  const recurring = month.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);

  const byCat = month.reduce<Record<string, number>>((acc, e) => {
    const k = e.category ?? "other";
    acc[k] = (acc[k] ?? 0) + e.amount;
    return acc;
  }, {});
  const topCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
        <Receipt size={14} />Expenses · 30 days
      </h2>
      <div className="card p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-semibold tabular-nums">${(total / 100).toFixed(0)}</div>
          <div className="text-xs text-sub tabular-nums">${(recurring / 100).toFixed(0)} recurring · {month.length} txns</div>
        </div>
        {topCats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topCats.map(([c, n]) => (
              <span key={c} className="chip tabular-nums">{c} ${(n / 100).toFixed(0)}</span>
            ))}
          </div>
        )}

        <form action={(fd) => start(async () => { await createExpense(fd); (document.getElementById("exp-form") as HTMLFormElement)?.reset(); })} id="exp-form" className="grid grid-cols-12 gap-2">
          <input name="name" placeholder="What" required className="input col-span-5 text-sm" />
          <input name="amount" placeholder="$0" required inputMode="decimal" className="input col-span-2 text-sm" />
          <select name="category" defaultValue="other" className="input col-span-3 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="col-span-1 flex items-center justify-center text-xs text-sub">
            <input name="recurring" type="checkbox" className="mr-1" />
            <Repeat size={12} />
          </label>
          <button className="btn btn-accent col-span-1 px-1"><Plus size={14} /></button>
        </form>

        <details>
          <summary className="cursor-pointer text-xs text-sub">All · {month.length}</summary>
          <div className="mt-2 space-y-1">
            {month.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-line/30">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{e.name}{e.recurring ? <Repeat size={10} className="ml-1 inline text-sub" /> : null}</div>
                  <div className="text-[10px] text-sub">{e.category} · {e.dateKey}</div>
                </div>
                <div className="text-sm tabular-nums shrink-0">${(e.amount / 100).toFixed(2)}</div>
                <button onClick={() => start(() => deleteExpense(e.id))} className="ml-1 rounded p-1 text-sub hover:text-rose-400" aria-label="Delete">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
