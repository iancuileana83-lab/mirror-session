# Mirror Session — Roadmap

Entry for the **YouCam API Skin AI & eCommerce VTO Hackathon**.
Deadline: **Nov 2, 2026, 11:45 AM EST = 18:45 Romania time** (confirmed against the official rules).
API units valid until **2027-01-03**.
Live app today: https://mirror-prep-pal.lovable.app (built in Lovable, repo `iancuileana83-lab/mirror-session`).

> Read this file at the start of every work session. Tick the boxes as items are done.
> Lovable syncs from `main`: never rewrite pushed history (see AGENTS.md).

## Idea

**Mirror Session – pharmacist-guided skin routine.** A scan of the face with YouCam Skin AI,
explained in plain words, turned into a simple morning/evening routine of *active ingredients*
(no brand names), each step with its reason, plus safety notes. Scans are compared over time.
An agentic "skin coach" proposes the routine and the next check-in, and acts only after the
user confirms. Virtual Try-On stays as a bonus. Author: a former community pharmacist (20 years).

Not medical: no diagnosis, no treatment advice. When results go beyond cosmetics, the app says
"see a pharmacist or dermatologist".

## What the app does today (analysis)

- Stack: TanStack Start + React 19 + Tailwind 4 + shadcn/ui, Lovable-hosted. Package manager files: `bun.lock` (use `npm.cmd` locally).
- Flow: `/` home → `/prepare` (pick an event: interview, photoshoot, date…) → `/skin` (upload
  or take a face photo, skin reading) → `/outfit` (upload garment or preset, Virtual Try-On) →
  `/result` (skin + outfit side by side, a "coherence score") ; `/session` is a live camera mirror.
- YouCam use, all in server functions (`src/lib/*.functions.ts`), key read from
  `process.env.YOUCAM_API_KEY`, never sent to the browser:
  - **Skin Analysis** (`skin-analysis.functions.ts`): file upload → task → polling, asks for
    `hd_moisture`, `hd_texture`, `hd_pore`, `hd_redness`.
  - **Clothes VTO** (`cloth-tryon.functions.ts`): person + garment → task → result image URL.
- Weak points for judging:
  - Value is "look good for an event" and a made-up "coherence score": shallow, cosmetic.
  - Skin advice is 4 fixed sentences (hydrating mist, primer, blurring product, corrector):
    product-style, not a routine, no reasons, no safety.
  - Only 4 skin metrics used; no history. Data lives in `sessionStorage` (lost on tab close).
  - No agent, no LICENSE, README is the Lovable template, no `.env` entry in `.gitignore`.
  - The skin reading on `/skin` may fall back to canned text on errors (to check before reuse).

## Requirements checklist (from the rules)

- [ ] Uses **at least one YouCam API** (Skin Analysis = main, Clothes VTO = bonus). Confirm the exact API list and any "must use" wording on the hackathon page.
- [ ] **Major upgrade explained clearly**: a "What's new" section in the README and in the Devpost text: before vs after, in a table.
- [ ] **Public repo with an open-source license** (add `LICENSE`, MIT unless the rules name another).
- [ ] **Free, unrestricted testing access for judges**: public link, no login, no paywall; judges never need their own key. Needs a usage cap and a **sample-photo mode** so judges can test without a face photo and without exhausting API credits. Keep the app live until judging ends.
- [ ] **Public YouTube video, 1–3 minutes**, shows the app working; **no third-party trademarks, no copyrighted music** (no brand names on screen, only synthesized/royalty-free-by-me sound or silence; use generic products/ingredients).
- [ ] **Screenshots** of the app for the submission form.
- [ ] **First-time users grasp the value instantly**: one-line promise on the home page, a one-tap sample demo, results readable in under 10 seconds.
- [ ] The video **explains which YouCam API is used** (say it and show it on screen) and **shows the app running**.
- [ ] Winners do an **exit interview and a blog feature**: be available after Nov 2; keep contact details current.
- [ ] Submission form complete before **Nov 2, 2026, 18:45 Romania time**; aim to submit a day early.
- [ ] Original work, no secrets in the repo, no third-party logos or brand names in app or video.

## Upgrade plan

**Principles:** plain words, ingredients not brands, every step has a "why", every safety note
visible, nothing happens without the user confirming, no medical claims.

| # | Phase | What the user gets |
|---|-------|--------------------|
| 1 | Repo hygiene | README rewrite, LICENSE, `.env.example`, `.env` in `.gitignore`, `npm.cmd` scripts checked, build runs locally. |
| 2 | Skin Analysis explained | Use more YouCam skin concerns where the API allows (to verify in the docs: e.g. spots, wrinkles, dark circles, oiliness, besides the 4 now). Each result as a plain sentence + a "what this means / what it does not mean" line. Remove canned fallback text; show honest errors. |
| 3 | Routine builder | Rules (written by the pharmacist, in code, not free AI text) map results to a **morning** and **evening** routine of active ingredients (e.g. gentle cleanser, humectant, niacinamide, sunscreen, retinoid at night). Each step: ingredient, why, how often. No brands, no doses beyond common label-level guidance. |
| 4 | Safety layer | Patch-test instructions; combinations to avoid (e.g. retinoid + strong acids, same night); sun-protection reminder with retinoids/acids; pregnancy/sensitive-skin "ask a pharmacist" note; **escalation card** "see a pharmacist or dermatologist" for strong redness, changing spots, pain, or anything beyond cosmetics. Always-visible "not medical advice" line. |
| 5 | Progress tracking | Save each scan (date, metrics, routine in use) in the browser (localStorage, user can delete); compare two scans with a simple chart (recharts is already installed) and plain words ("hydration up, redness unchanged"). Fair-comparison tips (same light, no makeup). |
| 6 | Agentic skin coach | Rules-only (decided). The coach reads the latest scan(s), **proposes** a routine and the next check-in date, and shows its reasoning. It acts only on **Confirm** (save routine, set check-in reminder/calendar file); Edit and Decline are always available. Tools are limited to: read scans, draft routine, draft check-in. It also proposes the next check-in and, after comparing two scans, an adjusted routine; nothing is saved until the user confirms. |
| 7 | New home & first-time flow | New promise on `/`: "Understand your skin. Get a simple, safe routine." Big "Try with a sample photo" button; remove the "event/coherence score" framing (or move it behind VTO). |
| 8 | Virtual Try-On (bonus) | Keep `/outfit`, reposition as "Try a look" after the routine; fix known rough edges only. |
| 9 | Judge access & limits (hosting: Lovable credits are used up; Cloud Run like the another project project is an option; decide later, must stay live through judging) | Sample photos (own or generated, no real third parties), per-visitor and daily caps, friendly "demo limit reached, here is a saved example" fallback. Test on a clean browser. |
| 10 | Submission | Real-device test (phone + desktop), screenshots, 1–3 min video script and recording (no brands, no music), YouTube upload public, Devpost text with the before/after table, final check of every box above. |

Suggested time boxes (today is Oct 5): phases 1–4 by Oct 14, 5–7 by Oct 21, 8–9 by Oct 26, submission work Oct 27–31, buffer Nov 1.

## API key handling

- The key is read **only on the server** (`process.env.YOUCAM_API_KEY` inside server functions); it never reaches the browser or the repo.
- Locally: you create `.env` yourself in the project root with `YOUCAM_API_KEY=...`. I never ask for the key in chat and never read or print the file. I will add `.env` to `.gitignore` and a `.env.example` with an empty value.
- Deployed (Lovable): the key is set in Lovable's secrets, not in code.
- To verify when building: that `.env` values reach `process.env` in `vite dev` for this stack (if not, a small server-side loader will be added).
- API units are valid until 2027-01-03; the per-visitor and daily caps in phase 9 protect them.
- If the key is ever pasted in chat, a commit or a video, it must be revoked and replaced.

## Status

| Phase | Status |
|-------|--------|
| 1 | done (README, MIT license, .env.example, .env ignored) |
| 2 | done (12 YouCam concerns, plain words; fixed score direction: higher = healthier). Needs your real-photo test |
| 3–4 | draft built, **waiting for pharmacist review** of src/lib/routine-rules.ts (also shown on the /rules page) |
| 5–10 | not started |

## Open questions for you

1. Check the hackathon page for the exact YouCam APIs to be used, the license wording and how judges get access.
2. Decided: rules-only coach, no second AI model. Routine and safety rules are deterministic; the pharmacist reviews every ingredient and rule.
3. Your pharmacist rules: I draft the ingredient/safety rules, you review and correct every one.



