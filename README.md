# Mirror Session

**Pharmacist-guided skin routine.** Scan your face with YouCam Skin AI, understand the result in
plain words, get a simple morning/evening routine of *active ingredients* (no brand names) with the
reason for each step, and track progress by comparing scans over time. A rules-based "skin coach"
proposes the routine and the next check-in, and saves nothing until you confirm.

Created by a former community pharmacist (20 years of practice) for the YouCam API Skin AI &
eCommerce VTO Hackathon.

> Not medical advice. Mirror Session does not diagnose or treat anything. If results go beyond
> cosmetics, it tells you to see a pharmacist or dermatologist.

## YouCam APIs used

- **Skin Analysis API**: the core of the app (skin concerns from a face photo).
- **Clothes Virtual Try-On API**: a bonus "try a look" step.

All YouCam calls run on the server (`src/lib/*.functions.ts`); the API key never reaches the browser.

## What's new in this upgrade

| Before (original Mirror Session) | After |
|---|---|
| Look-good check before an event | Skin routine with reasons, safety notes and progress |
| 4 fixed product-style tips | Deterministic ingredient routine (morning/evening), no brands |
| No safety content | Patch test, combinations to avoid, "see a pharmacist or dermatologist" |
| Results lost when the tab closes | Scan history saved on your device, compared over time |
| No agent | Rules-based coach: proposes, you confirm, then it saves |
| Virtual Try-On was the main feature | Virtual Try-On kept as a bonus |

(Rows are completed as the phases in [ROADMAP.md](ROADMAP.md) are finished.)

## Run locally

Windows (PowerShell), Node 20+:

```sh
npm.cmd install
copy .env.example .env      # then put your own YouCam key in .env
npm.cmd run dev
```

`.env` is ignored by git. Never paste the key into the code, an issue or a chat.

## Stack

TanStack Start, React 19, TypeScript, Tailwind 4, shadcn/ui, recharts.

## License

MIT, see [LICENSE](LICENSE).
