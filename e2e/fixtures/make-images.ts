/**
 * Three invented images in three different shapes: portrait 3:4, landscape 3:2, square 1:1.
 * Generated, not photographed — no real person's artwork is in this repository (GAL-G4).
 * They exist so the publishing journey can be walked with genuinely differently shaped files
 * and the result inspected for destructive cropping.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const SHAPES: Array<{ name: string; w: number; h: number; a: string; b: string }> = [
  { name: "portrait-3x4.jpg",  w: 900,  h: 1200, a: "#8a6a3f", b: "#efe6d6" },
  { name: "landscape-3x2.jpg", w: 1500, h: 1000, a: "#42504a", b: "#e6e2d6" },
  { name: "square-1x1.jpg",    w: 1100, h: 1100, a: "#7b4526", b: "#f1e7dc" },
];

await mkdir(HERE, { recursive: true });
for (const s of SHAPES) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}">
       <defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
         <stop offset="0%" stop-color="${s.b}"/><stop offset="100%" stop-color="${s.a}"/>
       </linearGradient></defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
       <ellipse cx="${s.w * 0.5}" cy="${s.h * 0.55}" rx="${s.w * 0.22}" ry="${s.h * 0.3}"
                fill="none" stroke="${s.a}" stroke-width="${Math.round(s.w * 0.012)}" opacity="0.55"/>
       <rect x="${s.w * 0.08}" y="${s.h * 0.08}" width="${s.w * 0.84}" height="${s.h * 0.84}"
             fill="none" stroke="${s.a}" stroke-width="2" opacity="0.25"/>
     </svg>`);
  await sharp(svg).jpeg({ quality: 90 }).toFile(join(HERE, s.name));
  console.log(`  ${s.name}  ${s.w}x${s.h}`);
}
