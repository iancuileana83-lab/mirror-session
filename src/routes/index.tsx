import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanFace, UserRound, ScanText, ShieldCheck, ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const STEPS = [
  { icon: ScanFace, title: "Scan your face", text: "A YouCam skin scan, explained in plain words." },
  { icon: UserRound, title: "Tell us about you", text: "Allergies, medicines, pregnancy or breastfeeding." },
  { icon: ScanText, title: "Photo of the label", text: "An AI text reader copies the ingredient list. It never gives advice." },
  { icon: ShieldCheck, title: "Pharmacist check", text: "Fixed rules say if it fits you, and why." },
  { icon: ShoppingBasket, title: "Try, compare, confirm", text: "Preview colours, compare 2-3 products, you decide." },
];

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col items-center px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 60%)",
        }}
      />

      <div className="max-w-2xl text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          Made by someone with twenty years in community pharmacies
        </span>

        <h1 className="font-heading text-5xl leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Counter Check
        </h1>
        <p className="mt-3 font-heading text-2xl text-foreground sm:text-3xl">
          Your pharmacist, right before you buy.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Standing at the shelf? Check a skincare or makeup product against your skin, your medicines
          and your allergies before it goes in the basket.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/skin"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start with a face scan
          </Link>
          <Link
            to="/skin"
            className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium text-foreground transition-colors hover:bg-accent"
          >
            Try the sample
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The sample uses an AI-generated face (not a real person) and a fictional label. No account, nothing to install.
        </p>
      </div>

      <ol className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="rounded-3xl border border-border bg-card p-5 text-left">
              <div className="flex items-center gap-2 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
              </div>
              <h2 className="mt-3 font-heading text-lg text-foreground">{s.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          );
        })}
      </ol>

      <p className="mt-12 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
        Not medical advice. Counter Check does not diagnose or treat anything. When in doubt, ask
        your pharmacist or doctor. Your face photo is sent to YouCam for the scan and is not stored
        on our side. See <Link to="/rules" className="underline underline-offset-2">how the rules work</Link>.
      </p>
    </main>
  );
}
