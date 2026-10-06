# Counter Check: demo video script (target 2:40, limit 3:00)

Rules for the video: it must say **which YouCam APIs are used** and **show the app running**; **no third-party logos or trademarks**
(fictional products only, no brand names on screen), **no copyrighted music** (record silent under the voice, or use a tone you made
yourself). Say "an AI text reader", never the product name. Do not show `.env`, a terminal with keys, or the browser's address
bar history. Public YouTube upload, then paste the link in the submission form.

Record at 1920x1080 in the live app: https://counter-check-v4fk5lvbla-ez.a.run.app (a clean private window, zoom 110%).
Reset before each take: Settings > clear site data, or a new private window.

## Narration and shots

| Time | What you see | What you say |
|------|--------------|--------------|
| 0:00 to 0:15 | Home page. Slow scroll over the five steps. | "I was a community pharmacist for twenty years. The question I heard most was: is this product right for me? Counter Check answers it right at the shelf, before you buy." |
| 0:15 to 0:40 | Scan page. Upload the AI-generated face file. Press Analyze Skin. The 12 concern cards appear. Zoom on a card with its "Not:" line. | "Step one: a face scan with the YouCam Skin Analysis API. It reads twelve skin concerns and explains each one in plain words, including what the result does not mean. This face is AI-generated, not a real person." |
| 0:40 to 0:55 | Profile page. Tick pregnant or breastfeeding off, a tetracycline, fragrance and nut allergy, "benzoyl peroxide" under what I already use. | "Step two: tell it about you. Medicines, allergies, what you already use. All of it stays in your browser." |
| 0:55 to 1:20 | Label page. Press "Try the sample label". Press Read the ingredient list. The list fills in. Pause on the editable text box. | "Step three: photograph the ingredient list of a product. An AI text reader only copies the words. It never judges or advises, and you can correct the text. This product is fictional." |
| 1:20 to 1:50 | Check page: "Better to skip". Scroll the reasons slowly: fragrance allergen, nuts, shea, then the "Check first" lines. Point at "Ask your pharmacist or doctor." | "Step four: the pharmacist check. These are fixed rules I wrote, not an AI. It names the exact ingredients and the reason: your allergy, your medicine, your sensitive skin. The strictest flag decides, and it always ends with: ask your pharmacist or doctor." |
| 1:50 to 2:10 | Try-on page. Sample face, Rosewood, press Try. Before and after side by side. | "Step five: for coloured products, the YouCam Makeup Virtual Try-On API shows the shade on your own photo before you buy." |
| 2:10 to 2:30 | Compare page. Press the demo button. Show the four groups. Press Confirm. Show the printable list with the usage tips. | "A shopping coach compares up to four products and proposes a basket: now, later, check first, leave out. It saves nothing until you confirm. One new active at a time, with a counter-style tip for each." |
| 2:30 to 2:45 | Progress page with the demo scans: the table with "No clear change". Then the home page. | "And after four to six weeks, a second scan shows honestly whether anything changed, including when nothing did." |
| 2:45 to 2:55 | Title card or the README on GitHub. | "Counter Check uses the YouCam Skin Analysis and Makeup Virtual Try-On APIs. It is open source, and it is not medical advice. Thank you." |

About 260 spoken words, roughly 1:50 of speech at a calm 140 words a minute; the rest of the 2:55 is screen actions and short pauses. Leave a second of silence after each click so that viewers can read.

## Before you record

- **Units:** one live scan costs 20 YouCam units and one try-on 1 unit. Plan one or two live scans for the video (20 to 40 units). On the
  live site they count towards the app's own total of 60 scans; recording locally with `npm.cmd run dev` does not.
- **The sample button** on the scan page shows a saved result and makes no live call. For the video, upload
  `public/examples/sample-face.jpg` as a file so that the scan is live and the narration "YouCam Skin Analysis API" is true.
- **The face image** carries a small "StyleGAN2 (Karras et al.)" credit in its corner. It is only a research credit, but if you prefer
  nothing third-party on screen, crop the corner before uploading, or keep the face small in frame.
- **Do not show**: the AI text reader's product name, any brand name, the `.env` file, API keys, the Google Cloud console.
- **Subtitles:** add captions (YouTube auto-captions, then correct "YouCam" and "Rosewood").
- **Title and description (YouTube):** "Counter Check: your pharmacist, right before you buy (YouCam API hackathon)". In the description:
  the live link, the GitHub link, the two YouCam APIs used, "not medical advice", "all products and faces are fictional or AI-generated".
