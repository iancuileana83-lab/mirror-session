import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Briefcase, Camera, Heart, Users, Sparkles, Check } from "lucide-react";

export const Route = createFileRoute("/prepare")({
  head: () => ({
    meta: [
      { title: "What are you preparing for? — Mirror Session" },
      {
        name: "description",
        content: "Select the event you're preparing for to personalize your mirror session.",
      },
      {
        property: "og:title",
        content: "What are you preparing for? — Mirror Session",
      },
      {
        property: "og:description",
        content: "Select the event you're preparing for to personalize your mirror session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prepare,
});

const events = [
  {
    id: "job-interview",
    label: "Job Interview",
    description: "Look polished, confident, and ready to make an impression.",
    icon: Briefcase,
  },
  {
    id: "professional-photoshoot",
    label: "Professional Photoshoot",
    description: "Check your hair, skin, and outfit under camera-ready light.",
    icon: Camera,
  },
  {
    id: "date-night",
    label: "Date Night",
    description: "A quick once-over so you feel your best before heading out.",
    icon: Heart,
  },
  {
    id: "family-event",
    label: "Family Event",
    description: "Look natural and put-together for photos and reunions.",
    icon: Users,
  },
  {
    id: "other",
    label: "Other",
    description: "Any special moment where you want to look and feel great.",
    icon: Sparkles,
  },
];

function Prepare() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    void navigate({ to: "/session", search: { event: selected } });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center border-b border-border px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-3xl">
          <div className="text-center">
            <h1 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl md:text-5xl">
              What are you preparing for?
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Choose an event so we can tailor your mirror session.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const Icon = event.icon;
              const isSelected = selected === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelected(event.id)}
                  className={`relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg text-foreground">{event.label}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selected}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
