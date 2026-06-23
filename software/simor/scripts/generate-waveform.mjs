import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "..", "public", "data", "waveform.txt");

let step = 0;
let phase = Math.random() * Math.PI * 2;

function randomValue() {
  const t = step * 0.45 + phase;
  const wave = Math.sin(t) * 37 + 42;
  const noise = (Math.random() - 0.5) * 4;
  return Math.max(1, Math.min(85, +(wave + noise).toFixed(2)));
}

function init() {
  const now = new Date();
  const fmt = (n) => String(n).padStart(2, "0");
  const header = `--- inicio: ${fmt(now.getFullYear() % 100)}-${fmt(now.getMonth() + 1)}--${fmt(now.getDate())} ${fmt(now.getHours())}-${fmt(now.getMinutes())}-${fmt(now.getSeconds())} ---\n`;

  if (existsSync(FILE)) {
    const content = readFileSync(FILE, "utf-8").trim();
    const lines = content.split("\n");
    const dataLines = lines.filter((l) => l.trim() && !l.startsWith("--- inicio:"));
    step = dataLines.length;
    phase = step * 0.45 + Math.random() * Math.PI * 2;
    console.log(`Resuming: ${step} existing values`);
    return;
  }

  writeFileSync(FILE, header, "utf-8");
  step = 0;
  phase = Math.random() * Math.PI * 2;
  console.log("Created new file with header");
}

function append() {
  const val = randomValue();
  appendFileSync(FILE, `${val}\n`, "utf-8");
  console.log(`[${new Date().toLocaleTimeString()}] + ${val}  (total: ${step + 1})`);
  step++;
}

init();
console.log(`Writing to: ${FILE}`);
console.log("Generating 1 value every 5 seconds. Ctrl+C to stop.\n");

append();
setInterval(append, 5000);
