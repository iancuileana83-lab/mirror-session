# Counter Check

**Your pharmacist, right before you buy.** Check a skincare or makeup product against your skin,
your medicines and your allergies before it goes in the basket.

Made by a former community pharmacist (20 years of practice) for the YouCam API Skin AI &
eCommerce VTO Hackathon. Formerly "Mirror Session".

> Not medical advice. Counter Check does not diagnose or treat anything. When in doubt, ask your
> pharmacist or doctor. All products and labels in the demo are fictional.

## How it works

1. **Scan your face** with the YouCam Skin Analysis API (12 skin concerns, explained in plain words).
2. **Tell it about you**: allergies and intolerances, medicines, pregnancy or breastfeeding.
3. **Photo of the ingredient label**: Google's Gemini model is used **only to transcribe** the
   ingredient list into text. It never judges or advises, and you can correct the text.
4. **Pharmacist check**: fixed, human-written rules (no AI) say whether the product fits your skin
   results, clashes with your routine or medicines, or matches your allergies, with the reason.
5. **Try it on** with the YouCam makeup Virtual Try-On API for coloured products.
6. **Shopping agent** compares 2-3 products and proposes a basket; nothing is saved until you confirm.
7. **Is it working?** Re-scan after 4-6 weeks and compare honestly.

Build status is tracked in [ROADMAP.md](ROADMAP.md).

## YouCam APIs used

- **Skin Analysis API**: the face scan (and the re-scan).
- **Makeup Virtual Try-On API**: the colour preview (planned, key access confirmed).

All YouCam and Gemini calls run on the server; API keys never reach the browser.

## What's new in this upgrade

| Before (Mirror Session) | After (Counter Check) |
|---|---|
| Look-good check before an event | A pharmacist check at the shelf, before buying |
| 4 fixed product-style tips | Rule-based checks of a real ingredient list against skin, medicines and allergies |
| No safety content | Patch test, combinations to avoid, pregnancy and breastfeeding rules, "ask your pharmacist or doctor" |
| Clothes try-on only | Makeup try-on for coloured products |
| No agent | A shopping agent that proposes and waits for your confirmation |
| Results lost on tab close | Scan history, honest comparison over time |

## Try it without a photo

The scan page has a "Try the sample" button that uses a drawn face (no real person). A fictional
sample label is added with the label reader.

## For judges: test it in 2 minutes, no account and no key

Everything works without a login, your own photo or any key. The sample buttons use a drawn face and fictional products.

1. **Scan**: open the scan page, press "Try the sample" (a drawn face), then "Analyze Skin". YouCam Skin Analysis returns 12 concerns.
2. **About you**: press "Demo: fill in a sample profile (fictional)".
3. **Label**: on the label page press "Try the sample label"; Gemini copies the ingredient list (it only transcribes).
4. **Check**: "Check this product" gives a verdict with the reasons.
5. **Try it on**: pick a lipstick or foundation shade; YouCam makeup Virtual Try-On applies it to the sample face.
6. **Compare**: "Demo: load sample products, profile and scan" shows Now, Later, Check first and Skip; confirm to save the list.
7. **Is it working?**: load the two demo scans and read the honest comparison; confirm a next check-in.

The paid calls (scan, label reader, try-on) have per-visitor and daily limits. When one is reached, the app says so and
shows a saved example, so the rest of the flow still works.

## Run locally

Windows (PowerShell), Node 20+:

```sh
npm.cmd install
copy .env.example .env      # then put your own keys in .env
npm.cmd run dev
```

`.env` is ignored by git. Never paste keys into code, issues or chat.

## Stack

TanStack Start, React 19, TypeScript, Tailwind 4, shadcn/ui, recharts.

## License

MIT, see [LICENSE](LICENSE).
