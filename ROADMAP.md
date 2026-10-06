# Counter Check — Roadmap

*(formerly Mirror Session; repo `iancuileana83-lab/mirror-session`, old live app https://mirror-prep-pal.lovable.app)*

Entry for the **YouCam API Skin AI & eCommerce VTO Hackathon**.
Deadline: **Nov 2, 2026, 11:45 AM EST = 18:45 Romania time** (confirmed against the official rules).
API units valid until **2027-01-03**.

> Read this file at the start of every work session. Tick boxes and update the status table as you go.
> Lovable syncs from `main`: never rewrite pushed history (see AGENTS.md). Nothing is pushed yet.
> **Nothing below is built until the pharmacist approves this plan.**

## Idea

**Counter Check — your pharmacist, right before you buy.** Stand at the shelf, check the product
before it goes in the basket.

1. **Scan your face** with YouCam Skin AI (12 concerns, plain words).
2. **Photo of a product's ingredient label** (INCI list). Gemini is used **only to transcribe** the
   list into text, never to judge or advise. The user can correct the text before it is checked.
3. **Pharmacist check** (fixed rules written and reviewed by the pharmacist, no AI): does the product
   fit the skin results, clash with the user's routine, with medicines they list (e.g. photosensitising
   drugs such as doxycycline, or isotretinoin: daily SPF, no strong exfoliants), with pregnancy or
   breastfeeding, or with their allergy/intolerance profile (fragrance, specific preservatives,
   lanolin…). Always phrased as "ask your pharmacist or doctor".
4. **YouCam makeup Virtual Try-On** for coloured products (foundation, lipstick) before buying.
5. **Shopping agent**: compares 2–3 products and proposes a basket; **acts only after the user confirms**.
6. **"Is it working?"**: re-scan after 4–6 weeks and compare concerns honestly (including "no change").

Later, only if time allows: cheaper alternative with the same actives; pharmacy QR handoff; photo-quality coach.

Author: a former community pharmacist (20 years). **No diagnosis, no medical advice.**
All products and labels in the app, demo and video are **fictional** (no real brands).

## Mandatory competition rules (checklist)

- [ ] Uses **at least one YouCam API**: Skin Analysis (core) and makeup Virtual Try-On. Verify the exact makeup VTO endpoint on our key before relying on it (phase 6).
- [ ] **Major upgrade explained clearly**: README "What's new" table + Devpost text, before (event look-check) vs after (Counter Check).
- [ ] **Public repo with an open-source license** (MIT, done).
- [ ] **Free, unrestricted testing access for judges**: public link, no login, no paywall, judges never need a key; sample photos and sample labels so nothing needs a real face or a real product; usage caps so API units and the Gemini key last. App stays live through judging.
- [ ] **Public YouTube video, 1–3 min**, shows the app **running**, and **says which YouCam API is used**; **no third-party trademarks, no copyrighted music** (fictional products only; check whether naming Gemini on screen counts as a trademark, otherwise say "an AI text reader").
- [ ] **Screenshots** for the submission form.
- [ ] **First-time users grasp the value instantly**: one line on the home page ("Check a product before you buy it"), one-tap sample demo, a verdict readable in 10 seconds.
- [ ] Winners do an **exit interview and a blog feature**: stay reachable after Nov 2.
- [ ] Submit before **Nov 2, 18:45 Romania time** (aim for Nov 1 evening).
- [ ] Original work; no secrets in the repo; no brand names or logos anywhere.

## What we keep from the current code

| Keep | Where | Use in Counter Check |
|------|-------|----------------------|
| YouCam Skin Analysis, tested and working (12 concerns, retry on slow poll, safe error logging, score direction fixed) | `src/lib/skin-analysis.functions.ts`, `src/lib/skin-concerns.ts`, `src/routes/skin.tsx` | Step 1 and the re-scan in step 6 |
| Reviewed routine and safety rules (ingredients, start strengths, pregnancy/breastfeeding, user-reported escalation, paused mode, combos, general rules) | `src/lib/routine-rules.ts`, `/routine`, `/rules` | The base for the "fits the routine/skin" checks; the rules page doubles as "how the check works" |
| API-key handling (server-side only, `.env` ignored, `.env.example`) | `src/lib/*.functions.ts`, `.gitignore` | Same pattern for the Gemini key |
| README, MIT license, build, TanStack Start + Tailwind + shadcn setup | repo root | Rewritten README |
| Clothes Virtual Try-On | `src/lib/cloth-tryon.functions.ts`, `/outfit` | Dropped from the main flow; kept in the code only if spare time (the focus is makeup VTO) |
| Event picker, "coherence score", live camera page | `/prepare`, `/result`, `/session` | **Removed** (no pharmacist value) |

## Plan (Oct 6 – Nov 1)

New data stays on the device (localStorage): profile, scans, checked products. Every phase ends with
build + typecheck + a browser test; phases marked **REVIEW** stop for the pharmacist.

| # | Dates | Phase | Result |
|---|-------|-------|--------|
| 1 | Oct 6–8 | **Concept shell** | New name and home ("Check a product before you buy it"), simple flow Scan → Profile → Product → Check → Basket, one-tap sample mode skeleton, remove old event pages, README rewrite. |
| 2 | Oct 8–12 | **Profile + ingredient knowledge base** | Profile page (pregnant/breastfeeding, sensitive skin, allergies/intolerances, medicines the user lists), stored locally. Draft knowledge base as plain data: INCI names and synonyms, ingredient groups (fragrance, essential oils, strong exfoliants, retinoids, vitamin C, lanolin, specific preservatives, drying alcohols…), medicine list with effects (photosensitising, drying…). **REVIEW: every ingredient, medicine and allergy rule.** |
| 3 | Oct 12–16 | **Label reader (Gemini, transcription only)** | Server function: label photo → ingredient list as JSON with a strict prompt ("transcribe, do not interpret"); the user sees and edits the text before checking; honest note that INCI order, not percentages, is all a label gives. Fictional sample labels (generated images) for the demo. Gemini key server-side from `.env`. |
| 4 | Oct 16–20 | **Pharmacist check engine + verdict screen** | Deterministic rules: fits skin results? clashes with routine (combos from our rules)? medicine flags? pregnancy/breastfeeding? allergy match? Verdict cards ("fits / check with your pharmacist / better to skip"), each with the reason; fixed wording "ask your pharmacist or doctor"; unknown ingredients are listed, never guessed. **REVIEW: wording and verdict thresholds.** |
| 5 | Oct 20 | **Decision: hosting** (Cloud Run as for another project, or other; Lovable credits are used up). Needs to be fixed by now to leave time for deploy and testing. | |
| 6 | Oct 20–23 | **Makeup Virtual Try-On (YouCam)** | First verify the makeup VTO endpoint and our units; then try-on for fictional foundation/lipstick shades on the user's scan photo, before the check/basket. If the endpoint is not usable on our key: fall back to the clothes VTO already built, and tell the pharmacist at once. |
| 7 | Oct 23–26 | **Shopping agent** | Compare 2–3 checked products side by side (fit, flags, shade preview), proposes a basket with the reasons; **nothing is saved or "bought" until the user confirms**; edit/decline always possible; rules-only, no AI model. |
| 8 | Oct 26–28 | **"Is it working?"** | Save each scan; re-scan prompt after 4–6 weeks (date saved after confirmation); honest comparison per concern, including "no clear change", with fair-comparison tips (same light, no makeup). Demo data for judges so the screen is not empty. |
| 9 | Oct 28–30 | **Judge access and deploy** | Sample photos and sample labels, per-visitor and daily caps with a friendly "saved example" fallback, deploy to the chosen host, test on a clean browser and phone, keys only in host secrets. Fix the existing `tsc` errors (`outfit.tsx`, `__root.tsx`). |
| 10 | Oct 30–Nov 1 | **Submission** | Screenshots, 1–3 min video (says the YouCam APIs used, shows the app running, fictional products only, no music or only my own), YouTube public, Devpost text, checklist above ticked. Nov 1 evening = buffer and submit. |
| S | only if time | Stretch | Cheaper alternative with the same actives (from the knowledge base); pharmacy QR handoff of the basket; photo-quality coach before the scan. |

## API key handling

- YouCam and Gemini keys are read **only on the server** (`process.env.YOUCAM_API_KEY`, `process.env.GEMINI_API_KEY`), never in the browser or the repo.
- You put them in `.env` yourself (new Gemini key from a separate Google project); I never ask for them in chat and never print them. `.env.example` lists the names with empty values.
- Logs show status codes and messages only, never keys, signed upload links or photos.
- On the live host the keys go in that host's secrets. If a key is ever pasted in chat, a commit or a video: revoke and replace.
- YouCam units are valid until 2027-01-03; caps in phase 9 protect them, and the Gemini key's quota.

## Risks and open questions

1. **Privacy**: face photos go to YouCam and label photos to Gemini; the app says so plainly and stores nothing on a server.
2. **Label reading errors**: the user edits the transcribed list; low-confidence text is flagged; the check never guesses.
3. **Scope**: six features in four weeks. Cut order if late: shopping agent polish → "Is it working?" → stretch items. The core that must work: scan → label → pharmacist check → try-on.
4. **Makeup VTO availability** on our key: verified at the start of phase 6.
5. **Gemini on screen** in the video: check the rules about third-party trademarks.
6. **Hosting** decision by Oct 20.

## Status

| Phase | Status |
|-------|--------|
| Earlier work (before the change of direction): README, MIT license, `.env` handling, 12-concern skin scan, reviewed routine/safety rules, real scan tested | done, committed locally (not pushed) |
| Oct 6 probe: makeup Virtual Try-On endpoint (`POST /s2s/v2.0/task/makeup-vto`) | **works on our key** (task accepted; a bad test image failed with no unit used; 1 unit per successful try-on; needs `src_file_url` public URL or file upload via `/s2s/v2.0/file`, to confirm in phase 6) |
| 1 | done: new home and name, old event pages removed (clothes try-on code kept), sample face button on the scan page (drawn face), README rewritten, `tsc` clean, build passes |
| 2 | done: `/profile` page (stored in the browser) and the reviewed knowledge base `src/lib/knowledge-base.ts`, shown on `/rules` (ingredient groups incl. citrus extracts, plant extracts, Compositae, propolis, colophonium, nuts+shea; 12 medicines and their effects; pregnancy/breastfeeding, sensitive-skin and allergy-profile flags; preferences kept apart from allergies). Pharmacist review applied Oct 7. |
| 3 | next: label reader (needs `GEMINI_API_KEY` in `.env`) |
| 3–10 | not started |
| Approved Oct 6 | Plan approved. Judge sample mode: generated face + fictional label. Video narration says "an AI text reader" (no logos); Gemini named only in README and the written description. Cut order: shopping-agent polish, then "Is it working?", then stretch. |
