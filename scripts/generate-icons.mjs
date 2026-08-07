#!/usr/bin/env node
/**
 * Regenerates every "Golf / sää" glass icon and the web boot-splash backdrop
 * from a single parametric SVG template built in this file. Run with:
 *
 *   npm run icons
 *
 * Nothing here runs at app build time — outputs are committed PNGs/JPGs and
 * this script only needs to be rerun when the icon design changes.
 */
import { Resvg } from "@resvg/resvg-js";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ILLUSTRATION_PATH = join(
  ROOT,
  "assets/images/backgrounds/course-illustration.jpg",
);

// Base coordinate space every icon is composed in; resvg rasterizes each
// output to its target pixel size afterwards, so all geometry below is
// expressed as a fraction of this single canvas regardless of final size.
const CANVAS = 1024;

const FONT_FAMILY = "Helvetica Neue";
const FONT_OPTIONS = {
  loadSystemFonts: true,
  defaultFontFamily: FONT_FAMILY,
};

const COLOR = {
  scrim: "rgba(6, 18, 13, 0.55)",
  panelFill: "rgba(255, 255, 255, 0.16)",
  panelStroke: "rgba(255, 255, 255, 0.35)",
  highlight: "rgba(255, 255, 255, 0.30)",
  white: "#ffffff",
  accent: "#3ddc84",
};

function imageDataUri(path) {
  const bytes = readFileSync(path);
  const ext = path.split(".").pop();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function imagePixelSize(path) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], {
    encoding: "utf8",
  });
  const width = Number(/pixelWidth:\s*(\d+)/.exec(out)[1]);
  const height = Number(/pixelHeight:\s*(\d+)/.exec(out)[1]);
  return { width, height };
}

const illustrationUri = imageDataUri(ILLUSTRATION_PATH);
const illustrationSize = imagePixelSize(ILLUSTRATION_PATH);

/**
 * Blurred, darkened "cover" crop of the course illustration filling the
 * whole CANVAS square, biased toward the fairway/water band of the source
 * photo rather than its dead center (which is mostly sky).
 */
function backgroundLayer({ focusFraction = 0.5 } = {}) {
  // Scaled up beyond a plain `cover` fit so the Gaussian blur has bleed to
  // sample from and never reveals a transparent fringe at the canvas edge.
  const overscan = 1.3;
  const scale =
    Math.max(
      CANVAS / illustrationSize.width,
      CANVAS / illustrationSize.height,
    ) * overscan;
  const drawWidth = illustrationSize.width * scale;
  const drawHeight = illustrationSize.height * scale;
  const x = (CANVAS - drawWidth) / 2;
  const y = CANVAS / 2 - focusFraction * drawHeight;

  return `
    <clipPath id="bgClip"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" /></clipPath>
    <filter id="bgBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${CANVAS * 0.018}" />
      <feColorMatrix type="saturate" values="0.75" />
    </filter>
    <g clip-path="url(#bgClip)">
      <image
        href="${illustrationUri}"
        x="${x}" y="${y}" width="${drawWidth}" height="${drawHeight}"
        filter="url(#bgBlur)"
        preserveAspectRatio="none" />
      <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${COLOR.scrim}" />
    </g>`;
}

/** Frosted glass panel: translucent rounded rect + hairline border + soft top-left highlight. */
function panelLayer({ insetFrac, cornerFrac }) {
  const inset = CANVAS * insetFrac;
  const size = CANVAS - inset * 2;
  const rx = size * cornerFrac;

  return `
    <linearGradient id="panelHighlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLOR.highlight}" />
      <stop offset="0.6" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <rect
      x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${rx}"
      fill="${COLOR.panelFill}" />
    <rect
      x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${rx}"
      fill="url(#panelHighlight)" />
    <rect
      x="${inset + 0.5}" y="${inset + 0.5}" width="${size - 1}" height="${size - 1}" rx="${rx}"
      fill="none" stroke="${COLOR.panelStroke}" stroke-width="${CANVAS * 0.006}" />`;
}

/** Two-line "Golf" / "sää" wordmark, centered on the canvas. */
function textLayer({ fontSizeFrac, lineGapFrac = 0.04, monochrome = false }) {
  const fontSize = CANVAS * fontSizeFrac;
  const lineHeight = fontSize * (1 + lineGapFrac);
  const cx = CANVAS / 2;
  const firstY = CANVAS / 2 - lineHeight * 0.32;
  const secondY = firstY + lineHeight;
  const golfColor = monochrome ? COLOR.white : COLOR.white;
  const saaColor = monochrome ? COLOR.white : COLOR.accent;

  return `
    <text
      x="${cx}" y="${firstY}"
      font-family="${FONT_FAMILY}" font-weight="700" font-size="${fontSize}"
      fill="${golfColor}" text-anchor="middle" letter-spacing="${-fontSize * 0.01}">Golf</text>
    <text
      x="${cx}" y="${secondY}"
      font-family="${FONT_FAMILY}" font-weight="700" font-size="${fontSize}"
      fill="${saaColor}" text-anchor="middle" letter-spacing="${-fontSize * 0.01}">sää</text>`;
}

function svgDocument(body, { canvas = CANVAS } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${canvas}" height="${canvas}"><defs></defs>${body}</svg>`;
}

/** Full-bleed icon: background photo + scrim, optional frosted panel, wordmark. Fills the entire CANVAS square (OS applies its own corner mask). */
function fullBleedIcon({ panel, fontSizeFrac, focusFraction }) {
  const layers = [backgroundLayer({ focusFraction })];
  if (panel) layers.push(panelLayer(panel));
  layers.push(textLayer({ fontSizeFrac }));
  return layers.join("\n");
}

/** A rounded, self-contained tile (background photo + panel + wordmark) placed with transparent padding on a larger canvas — used for the splash image, since native splash screens don't mask the image themselves. */
function paddedTile({ tileFrac, cornerFrac, panel, fontSizeFrac, focusFraction }) {
  const tileSize = CANVAS * tileFrac;
  const offset = (CANVAS - tileSize) / 2;
  // Drawn in the same pre-scale (0..CANVAS) coordinate space as
  // fullBleedIcon and then shrunk by the outer `scale(tileFrac)`, so the
  // corner radius is expressed as a fraction of CANVAS, not of tileSize.
  const rx = CANVAS * cornerFrac;
  const inner = `
    <clipPath id="tileClip"><rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" rx="${rx}" /></clipPath>
    <g clip-path="url(#tileClip)">
      ${fullBleedIcon({ panel, fontSizeFrac, focusFraction })}
    </g>`;
  return `<g transform="translate(${offset}, ${offset}) scale(${tileFrac})">${inner}</g>`;
}

/** Content confined to Android's adaptive-icon safe zone (a circle at `safeFrac` of the canvas), transparent elsewhere. Used for the foreground and monochrome layers, which are composited by the OS over a separately supplied background layer. */
function safeZoneContent({ safeFrac, panel, fontSizeFrac, monochrome }) {
  // Inscribe the panel/text block in a square that fits inside the safe
  // circle (side = diameter / sqrt(2)) so corners never clip.
  const safeSide = CANVAS * safeFrac;
  const inscribedSide = safeSide / Math.SQRT2;
  const insetFrac = (CANVAS - inscribedSide) / 2 / CANVAS;
  const layers = [];
  if (panel) layers.push(panelLayer({ insetFrac, cornerFrac: panel.cornerFrac }));
  layers.push(textLayer({ fontSizeFrac, monochrome }));
  return layers.join("\n");
}

function renderPng(svg, size) {
  const resvg = new Resvg(svg, {
    font: FONT_OPTIONS,
    fitTo: { mode: "width", value: size },
  });
  return resvg.render().asPng();
}

function writeIcon(path, svgBody, size, { canvas = CANVAS } = {}) {
  const svg = svgDocument(svgBody, { canvas });
  const png = renderPng(svg, size);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
  console.log(`wrote ${path.replace(ROOT + "/", "")} (${size}px)`);
}

const REGULAR_PANEL = { insetFrac: 0.12, cornerFrac: 0.16 };
const REGULAR_FONT_FRAC = 0.155;
const MASKABLE_PANEL = { insetFrac: 0.24, cornerFrac: 0.16 };
const MASKABLE_FONT_FRAC = 0.11;
const FOCUS = 0.46;

// --- Full-bleed app/web icons (regular variant: inset frosted panel) ---
const regularBody = fullBleedIcon({
  panel: REGULAR_PANEL,
  fontSizeFrac: REGULAR_FONT_FRAC,
  focusFraction: FOCUS,
});

writeIcon(join(ROOT, "assets/images/icon.png"), regularBody, 1024);
writeIcon(join(ROOT, "public/icons/icon-512.png"), regularBody, 512);
writeIcon(join(ROOT, "public/icons/icon-192.png"), regularBody, 192);
writeIcon(join(ROOT, "public/icons/apple-touch-icon-180.png"), regularBody, 180);

// --- Favicon (compact variant: no panel, near-full-bleed text for legibility at tiny sizes) ---
const compactBody = fullBleedIcon({
  panel: null,
  fontSizeFrac: 0.27,
  focusFraction: FOCUS,
});
writeIcon(join(ROOT, "assets/images/favicon.png"), compactBody, 48);

// --- Maskable PWA icon (content kept inside the 80% safe zone) ---
const maskableBody = fullBleedIcon({
  panel: MASKABLE_PANEL,
  fontSizeFrac: MASKABLE_FONT_FRAC,
  focusFraction: FOCUS,
});
writeIcon(join(ROOT, "public/icons/icon-maskable-512.png"), maskableBody, 512);

// --- Splash image: rounded tile with transparent padding, centered by the native splash config ---
const splashBody = paddedTile({
  tileFrac: 0.7,
  cornerFrac: 0.16,
  panel: REGULAR_PANEL,
  fontSizeFrac: REGULAR_FONT_FRAC,
  focusFraction: FOCUS,
});
writeIcon(join(ROOT, "assets/images/splash-icon.png"), splashBody, 1024);

// --- Android adaptive icon layers ---
const androidBackgroundBody = backgroundLayer({ focusFraction: FOCUS });
writeIcon(
  join(ROOT, "assets/images/android-icon-background.png"),
  androidBackgroundBody,
  432,
);

const androidForegroundBody = safeZoneContent({
  safeFrac: 0.66,
  panel: { cornerFrac: 0.16 },
  fontSizeFrac: 0.1,
});
writeIcon(
  join(ROOT, "assets/images/android-icon-foreground.png"),
  androidForegroundBody,
  432,
);

const androidMonochromeBody = safeZoneContent({
  safeFrac: 0.66,
  panel: null,
  fontSizeFrac: 0.1,
  monochrome: true,
});
writeIcon(
  join(ROOT, "assets/images/android-icon-monochrome.png"),
  androidMonochromeBody,
  432,
);

// --- Web boot-splash backdrop: a small downscaled copy of the illustration, no icon composition needed ---
const backdropDir = join(ROOT, "public/splash");
mkdirSync(backdropDir, { recursive: true });
const backdropPath = join(backdropDir, "backdrop.jpg");
rmSync(backdropPath, { force: true });
execFileSync("sips", [
  "-Z",
  "800",
  ILLUSTRATION_PATH,
  "--out",
  backdropPath,
]);
console.log(`wrote ${backdropPath.replace(ROOT + "/", "")} (800px, resized copy)`);

console.log("Done.");
