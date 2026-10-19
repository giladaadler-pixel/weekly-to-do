// Draws the app icons (a bold checkmark on the dark background) into public/.
// Run with: npm run icons
// To change the design, edit the colors or the CHECK points below and run it again.
// Uses only Node's built-ins: it draws pixels itself and writes PNGs with zlib.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BACKGROUND = [0x0d, 0x11, 0x17]; // dark mode --bg
const BLUE = [0x1f, 0x6f, 0xeb]; // dark mode --blue

// The checkmark as a polyline in a 0–1 box, drawn with round ends.
const CHECK = [
  [0.2, 0.52],
  [0.42, 0.72],
  [0.8, 0.3],
];
const STROKE = 0.13; // line width, as a share of the box

// size: pixels. scale: how much of the icon the checkmark's box fills (maskable icons
// keep it inside the center safe circle, which is 80% of the icon).
const ICONS = [
  { file: "icon-192.png", size: 192, scale: 0.78 },
  { file: "icon-512.png", size: 512, scale: 0.78 },
  { file: "icon-512-maskable.png", size: 512, scale: 0.58 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.72 },
];

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function draw(size, scale) {
  const offset = (1 - scale) / 2;
  const points = CHECK.map(([x, y]) => [(offset + x * scale) * size, (offset + y * scale) * size]);
  const half = (STROKE * scale * size) / 2;
  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let d = Infinity;
      for (let i = 0; i < points.length - 1; i += 1) {
        d = Math.min(d, distanceToSegment(x + 0.5, y + 0.5, points[i], points[i + 1]));
      }
      // Soft 1px edge so the line isn't jagged.
      const cover = Math.max(0, Math.min(1, half - d + 0.5));
      const at = (y * size + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        pixels[at + c] = Math.round(BACKGROUND[c] + (BLUE[c] - BACKGROUND[c]) * cover);
      }
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

// RGB PNG, 8 bits per channel, no filtering.
function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // color type: RGB
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y += 1) {
    pixels.copy(rows, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = new URL("../public/", import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const { file, size, scale } of ICONS) {
  writeFileSync(new URL(file, outDir), png(size, draw(size, scale)));
  console.log(`public/${file} (${size}×${size})`);
}
