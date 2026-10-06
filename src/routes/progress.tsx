import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import {
  checkinIcs,
  clearCheckin,
  clearScans,
  loadCheckin,
  loadDemoScans,
  loadScans,
  saveCheckin,
  today,
  type Checkin,
  type ScanRecord,
} from "@/lib/history";
import { CHANGE_THRESHOLD, FAIR_TIPS, compareScans, proposeCheckin, type Change } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Is it working? - Counter Check" },
      {
        name: "description",
        content: "Compare two skin scans a few weeks apart, honestly, including when nothing has changed.",
      },
    ],
  }),
  component: ProgressPage,
});

const CHANGE_STYLE: Record<Change, { text: string; cls: string; Icon: typeof ArrowUp }> = {
  better: { text: "Looks better", cls: "text-emerald-800", Icon: ArrowUp },
  worse: { text: "Looks worse", cls: "text-rose-800", Icon: ArrowDown },
  same: { text: "No clear change", cls: "text-muted-foreground", Icon: ArrowRight },
};

const SOURCE_LABEL = { photo: "photo", sample: "sample face (AI-generated)", demo: "demo (fictional)" } as const;

function ProgressPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [ready, setReady] = useState(false);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [chosenDate, setChosenDate] = useState("");

  const refresh = (list: ScanRecord[]) => {
    setScans(list);
    setAId(list[0]?.id ?? "");
    setBId(list[list.length - 1]?.id ?? "");
  };

  useEffect(() => {
    refresh(loadScans());
    setCheckin(loadCheckin());
    setReady(true);
  }, []);

  const a = scans.find((s) => s.id === aId);
  const b = scans.find((s) => s.id === bId);
  const cmp = useMemo(() => (a && b && a.id !== b.id ? compareScans(a, b) : null), [a, b]);
  const proposed = useMemo(() => proposeCheckin(scans[scans.length - 1] ?? null), [scans]);

  const confirmCheckin = (date: string) => {
    const c = { date, confirmedOn: today() };
    saveCheckin(c);
    setCheckin(c);
  };

  const downloadIcs = (date: string) => {
    const blob = new Blob([checkinIcs(date)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "counter-check-rescan.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/skin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to scan
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-24">
        <section>
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Is it working?</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Scan again after 4 to 6 weeks and compare honestly, including when nothing has changed. Only
            scores are kept, in this browser; photos are not.
          </p>
        </section>

        {ready && scans.length < 2 && (
          <section className="rounded-3xl border border-border bg-card p-6 text-sm">
            <p className="text-foreground">
              {scans.length === 0
                ? "No scans saved yet. Scan your skin first; each scan is saved here."
                : "One scan saved. Scan again in 4 to 6 weeks to compare."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Link to="/skin" className="inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground">
                Scan now
              </Link>
              <button
                type="button"
                onClick={() => refresh(loadDemoScans())}
                className="text-muted-foreground underline underline-offset-4"
              >
                Demo: load two scans 5 weeks apart (fictional)
              </button>
            </div>
          </section>
        )}

        {ready && scans.length >= 2 && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Earlier scan</span>
                <select value={aId} onChange={(e) => setAId(e.target.value)} className="h-10 w-full rounded-full border border-input bg-background px-4">
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>{s.date} ({SOURCE_LABEL[s.source]})</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted-foreground">Later scan</span>
                <select value={bId} onChange={(e) => setBId(e.target.value)} className="h-10 w-full rounded-full border border-input bg-background px-4">
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>{s.date} ({SOURCE_LABEL[s.source]})</option>
                  ))}
                </select>
              </label>
            </div>

            {!cmp && <p className="text-sm text-muted-foreground">Choose two different scans to compare.</p>}

            {cmp && (
              <>
                <div className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-base text-foreground">{cmp.summary}</p>
                  {cmp.timing && <p className="mt-2 text-sm text-amber-800">{cmp.timing}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {cmp.days} days apart. A difference under {CHANGE_THRESHOLD} points counts as no clear change, because photo readings vary with light, angle and makeup.
                  </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-border bg-card">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-accent/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Concern</th>
                        <th className="px-4 py-2">Before</th>
                        <th className="px-4 py-2">After</th>
                        <th className="px-4 py-2">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cmp.rows.map((r) => {
                        const s = CHANGE_STYLE[r.change];
                        return (
                          <tr key={r.id} className="border-t border-border">
                            <td className="px-4 py-2 text-foreground">{r.label}</td>
                            <td className="px-4 py-2">{r.before}</td>
                            <td className="px-4 py-2">{r.after}</td>
                            <td className={`px-4 py-2 ${s.cls}`}>
                              <span className="inline-flex items-center gap-1">
                                <s.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {s.text} ({r.delta > 0 ? "+" : ""}{r.delta})
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-foreground">
                  If it is getting worse, or you are worried about your skin, ask your pharmacist or doctor.
                </p>
              </>
            )}
          </section>
        )}

        {ready && (
          <section className="rounded-3xl border border-border bg-accent/40 p-6">
            <h2 className="font-serif text-2xl text-foreground">Next check-in</h2>
            {checkin ? (
              <>
                <p className="mt-2 text-sm text-foreground">Your next check-in is on <strong>{checkin.date}</strong> (confirmed {checkin.confirmedOn}).</p>
                <div className="mt-3 flex gap-4 text-sm">
                  <button type="button" onClick={() => downloadIcs(checkin.date)} className="underline underline-offset-4">Download a calendar reminder (.ics)</button>
                  <button type="button" onClick={() => { clearCheckin(); setCheckin(null); }} className="text-muted-foreground underline underline-offset-4">Remove</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-foreground">
                  The coach suggests <strong>{proposed}</strong>: 4 weeks after your {scans.length ? "last" : "first"} scan,
                  a fair gap for skin to show a change. A proposal only: nothing is saved until you confirm.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <button type="button" onClick={() => confirmCheckin(proposed)} className="inline-flex h-10 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground">
                    Confirm {proposed}
                  </button>
                  <label className="flex items-center gap-2">
                    <span className="text-muted-foreground">or another date</span>
                    <input type="date" min={today()} value={chosenDate} onChange={(e) => setChosenDate(e.target.value)} className="h-10 rounded-full border border-input bg-background px-3" />
                  </label>
                  {chosenDate && (
                    <button type="button" onClick={() => confirmCheckin(chosenDate)} className="underline underline-offset-4">Confirm {chosenDate}</button>
                  )}
                </div>
              </>
            )}
            <h3 className="mt-5 text-sm font-medium text-foreground">For a fair comparison</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground/90">
              {FAIR_TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {ready && scans.length > 0 && (
          <section className="text-sm text-muted-foreground">
            <p>{scans.length} scan{scans.length === 1 ? "" : "s"} saved on this device.</p>
            <button type="button" onClick={() => { clearScans(); refresh([]); }} className="mt-1 underline underline-offset-4">
              Delete all saved scans
            </button>
          </section>
        )}
        <p className="text-center text-xs text-muted-foreground">Not medical advice. Ask your pharmacist or doctor.</p>
      </main>
    </div>
  );
}
