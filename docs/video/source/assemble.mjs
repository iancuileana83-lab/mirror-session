// Merges the recorded video with the narration into one MP4. No music.
// Usage: node assemble.mjs <OUT_DIR> <FINAL_MP4>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const OUT = process.argv[2];
const FINAL = process.argv[3];
const { marks, cuts = [], videoPath } = JSON.parse(readFileSync(join(OUT, "marks.json"), "utf8"));
const ids = Object.keys(marks);
const lead = Number(process.env.LEAD_MS ?? 450); // when the voice starts after a scene starts (and the recording start offset)

const inputs = ["-i", videoPath];
for (const id of ids) inputs.push("-i", join(OUT, "audio", id + ".wav"));
// a start time in the original recording -> its time after the loading waits were cut out
const removedBefore = (e) => cuts.reduce((s, c) => s + Math.min(c.end - c.start, Math.max(0, e - c.start)), 0);
const at = (id) => Math.round(marks[id] + lead - removedBefore(marks[id] + lead));
const delays = ids.map((id, i) => `[${i + 1}:a]adelay=${at(id)}|${at(id)},volume=1.0[a${i}]`);
const sel = cuts.map((c) => `between(t\\,${(c.start / 1000).toFixed(3)}\\,${(c.end / 1000).toFixed(3)})`).join("+");
const vchain = cuts.length ? `[0:v]fps=30,select='not(${sel})',setpts=N/(30*TB)[v]` : `[0:v]fps=30[v]`;
const mix = `${ids.map((_, i) => `[a${i}]`).join("")}amix=inputs=${ids.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`;

const args = [
  "-y", "-hide_banner", "-loglevel", "error", ...inputs,
  "-filter_complex", `${vchain};${delays.join(";")};${mix}`,
  "-map", "[v]", "-map", "[aout]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "30",
  "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
  "-movflags", "+faststart", "-shortest",
  FINAL,
];
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height,r_frame_rate", "-of", "default=nw=1", FINAL], { encoding: "utf8" });
console.log(probe.stdout);
