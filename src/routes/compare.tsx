import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleAlert, CircleCheck, CircleHelp, CircleX, Trash2 } from "lucide-react";
import { EMPTY_PROFILE, loadProfile, type Profile } from "@/lib/profile";
import { loadSkin } from "@/lib/mirror-session";
import { loadProduct } from "@/lib/product";
import { splitInci } from "@/lib/knowledge-base";
import type { Scores } from "@/lib/skin-concerns";
import {
  KIND_LABEL,
  MAX_SHELF,
  SAMPLE_SHELF,
  clearBasket,
  loadBasket,
  loadShelf,
  newId,
  saveBasket,
  saveShelf,
  type Basket,
  type ProductKind,
  type ShelfItem,
} from "@/lib/shelf";
import { evaluate, proposeBasket, type Line } from "@/lib/shopping-agent";
import type { Verdict } from "@/lib/pharmacist-check";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare and choose - Counter Check" },
      {
        name: "description",
        content: "Compare up to three checked products. The coach proposes a basket; nothing is saved until you confirm.",
      },
    ],
  }),
  component: ComparePage,
});

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string; Icon: typeof CircleCheck }> = {
  match: { label: "Good match", cls: "bg-emerald-100 text-emerald-900", Icon: CircleCheck },
  ask: { label: "Check first", cls: "bg-amber-100 text-amber-900", Icon: CircleAlert },
  skip: { label: "Better to skip", cls: "bg-rose-100 text-rose-900", Icon: CircleX },
  unmatched: { label: "Couldn't match", cls: "bg-muted text-foreground", Icon: CircleHelp },
};

function ComparePage() {
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [scores, setScores] = useState<Scores | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ProductKind>("moisturiser");
  const [text, setText] = useState("");

  useEffect(() => {
    setShelf(loadShelf());
    setProfile(loadProfile());
    setScores((loadSkin()?.scores as Scores | undefined) ?? null);
    setBasket(loadBasket());
    setReady(true);
  }, []);

  const evals = useMemo(() => evaluate(shelf, profile, scores), [shelf, profile, scores]);
  const proposal = useMemo(() => proposeBasket(evals), [evals]);

  const update = (next: ShelfItem[]) => {
    setShelf(next);
    saveShelf(next);
    setHidden(false);
  };

  const addItem = (item: ShelfItem) => {
    if (shelf.length >= MAX_SHELF) return;
    update([...shelf, item]);
  };

  const addTyped = () => {
    const ingredients = splitInci(text);
    if (!name.trim() || ingredients.length === 0) return;
    addItem({ id: newId(), name: name.trim().slice(0, 40), kind, ingredients });
    setName("");
    setText("");
  };

  const addCurrent = () => {
    const p = loadProduct();
    if (!p || p.ingredients.length === 0) return;
    addItem({ id: newId(), name: `Product ${shelf.length + 1}`, kind, ingredients: p.ingredients });
  };

  const confirm = () => {
    const toLines = (ls: Line[]) => ls.map((l) => ({ name: l.item.name, kind: l.item.kind, why: l.why }));
    const b: Basket = {
      confirmedOn: new Date().toISOString().slice(0, 10),
      buyNow: toLines(proposal.buyNow),
      later: toLines(proposal.later),
    };
    saveBasket(b);
    setBasket(b);
  };

  const hasProposal = proposal.buyNow.length + proposal.later.length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/check" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to the check
        </Link>
        <span className="font-serif text-lg text-foreground">Counter Check</span>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-8 px-6 pb-24">
        <section>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 5 of 5</p>
          <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">Compare and choose</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Put up to {MAX_SHELF} products side by side. The coach proposes a basket with the reasons. It saves
            nothing until you confirm, and you can always change it or say no.
          </p>
        </section>

        {ready && basket && (
          <section className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
            <h2 className="font-serif text-2xl">Your shopping list (confirmed {basket.confirmedOn})</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {basket.buyNow.map((b) => (
                <li key={b.name}>
                  <strong>{b.name}</strong> ({KIND_LABEL[b.kind]})
                </li>
              ))}
            </ul>
            {basket.later.length > 0 && (
              <>
                <p className="mt-3 text-sm font-medium">Later, one new active at a time:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {basket.later.map((b) => (
                    <li key={b.name}>{b.name}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs">This is a list for you to take along. Nothing is bought here. Show it to your pharmacist if you like.</p>
            <div className="mt-4 flex gap-4 text-sm">
              <button type="button" onClick={() => window.print()} className="underline underline-offset-4">Print the list</button>
              <button
                type="button"
                onClick={() => {
                  clearBasket();
                  setBasket(null);
                }}
                className="underline underline-offset-4"
              >
                Remove the list
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-foreground">Your products ({shelf.length} of {MAX_SHELF})</h2>
            <button
              type="button"
              onClick={() => update(SAMPLE_SHELF)}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              Demo: load 3 sample products (fictional)
            </button>
          </div>
          {ready && shelf.length === 0 && <p className="text-sm text-muted-foreground">No products yet. Add one below, or load the samples.</p>}
          <div className="grid gap-4 md:grid-cols-3">
            {evals.map((e) => {
              const v = VERDICT_STYLE[e.check.verdict];
              return (
                <article key={e.item.id} className="rounded-3xl border border-border bg-card p-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg text-foreground">{e.item.name}</h3>
                      <p className="text-xs text-muted-foreground">{KIND_LABEL[e.item.kind]}, {e.item.ingredients.length} ingredients</p>
                    </div>
                    <button type="button" aria-label={`Remove ${e.item.name}`} onClick={() => update(shelf.filter((s) => s.id !== e.item.id))} className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${v.cls}`}>
                    <v.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {v.label}
                  </p>
                  <ul className="mt-3 space-y-2 text-xs text-foreground/90">
                    {e.check.reasons.slice(0, 3).map((r, i) => (
                      <li key={i}>{r.text.split(". ").slice(0, 2).join(". ")}</li>
                    ))}
                    {e.check.reasons.length > 3 && <li className="text-muted-foreground">+ {e.check.reasons.length - 3} more points</li>}
                    {e.check.fits.slice(0, 1).map((f) => (
                      <li key={f} className="text-emerald-800">{f}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {shelf.length < MAX_SHELF && (
          <section className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-serif text-xl text-foreground">Add a product</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (as you like)" className="h-10 rounded-full border border-input bg-background px-4 text-sm" />
              <select value={kind} onChange={(e) => setKind(e.target.value as ProductKind)} className="h-10 rounded-full border border-input bg-background px-4 text-sm">
                {(Object.keys(KIND_LABEL) as ProductKind[]).map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Ingredient list: Aqua, Glycerin, ..." className="mt-3 w-full rounded-2xl border border-input bg-background p-3 text-sm" />
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <button type="button" onClick={addTyped} className="inline-flex h-10 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground">Add</button>
              <button type="button" onClick={addCurrent} className="underline underline-offset-4">Add the product I just read from a label</button>
              <Link to="/product" className="text-muted-foreground underline underline-offset-4">Read another label</Link>
            </div>
          </section>
        )}

        {shelf.length >= 2 && !hidden && (
          <section className="rounded-3xl border border-border bg-accent/40 p-6">
            <h2 className="font-serif text-2xl text-foreground">The coach proposes</h2>
            <p className="mt-1 text-xs text-muted-foreground">A proposal only. Nothing is saved until you press Confirm.</p>

            {proposal.buyNow.length > 0 && <Group title="Put in the basket now" lines={proposal.buyNow} />}
            {proposal.later.length > 0 && <Group title="Later" lines={proposal.later} />}
            {proposal.waitFirst.length > 0 && <Group title="Check first, not in the basket yet" lines={proposal.waitFirst} />}
            {proposal.leaveOut.length > 0 && <Group title="Leave out" lines={proposal.leaveOut} />}
            {proposal.notes.map((n) => (
              <p key={n} className="mt-3 text-sm text-foreground">{n}</p>
            ))}

            <div className="mt-5 flex flex-wrap items-center gap-4">
              {hasProposal && (
                <button type="button" onClick={confirm} className="inline-flex h-11 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20">
                  Confirm this basket
                </button>
              )}
              <button type="button" onClick={() => setHidden(true)} className="text-sm text-muted-foreground underline underline-offset-4">
                Not now
              </button>
              <span className="text-xs text-muted-foreground">To change it, remove or add products above.</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Ask your pharmacist or doctor about anything marked Check first. Not medical advice.</p>
          </section>
        )}
        {shelf.length >= 2 && hidden && (
          <p className="text-center text-sm text-muted-foreground">
            Proposal hidden.{" "}
            <button type="button" onClick={() => setHidden(false)} className="underline underline-offset-4">Show it again</button>
          </p>
        )}
        {shelf.length === 1 && <p className="text-center text-sm text-muted-foreground">Add one more product to compare.</p>}
      </main>
    </div>
  );
}

function Group({ title, lines }: { title: string; lines: Line[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="mt-1 space-y-2 text-sm">
        {lines.map((l) => (
          <li key={l.item.id} className="rounded-2xl border border-border bg-card p-3">
            <strong>{l.item.name}</strong> <span className="text-muted-foreground">({KIND_LABEL[l.item.kind]})</span>
            <p className="mt-1 text-foreground/90">{l.why}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
