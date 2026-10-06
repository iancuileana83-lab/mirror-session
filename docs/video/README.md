# Demo video

`counter-check-demo.mp4` (about 2:38, 1920x1080, English voice, no music) is **not stored in git** (21 MB). It was recorded on the live
site, following [../VIDEO-SCRIPT.md](../VIDEO-SCRIPT.md), with one live skin scan (20 YouCam units) and one live try-on (1 unit).

The scripts in `source/` make it again, for example after a text change:

1. `narration.json` is the spoken text. `tts.ps1` turns it into one WAV per scene with the offline Windows voice
   (`powershell -File tts.ps1 -Dir <work folder>`; copy `narration.json` there first). It also writes `durations.json`.
2. `record.mjs` drives the live site with Playwright (`npm install playwright` in the work folder), pacing every scene to the
   length of its narration, and cuts the loading waits: `node record.mjs <site url> <work folder>`.
   Add `rehearse` as a third argument to rehearse against a local copy started with `DEMO_LOCKDOWN=1` (no paid calls).
3. `assemble.mjs` mixes the voice into the recording and writes the MP4 (needs `ffmpeg` on the PATH):
   `node assemble.mjs <work folder> docs/video/counter-check-demo.mp4`.
4. `preflight.mjs` is a free check of the live site (no YouCam units) to run before recording.

A live scan costs 20 YouCam units and counts towards the app's total of 60 scans, so rehearse locally with the paid calls paused.
