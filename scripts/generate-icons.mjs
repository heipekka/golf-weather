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
  highlight: "rgba(255, 255, 255, 0.30)",
  white: "#ffffff",
  accent: "#3ddc84",
};

// Cap height of the bold Helvetica Neue wordmark as a fraction of its font
// size, used to vertically center the two text lines on the canvas.
const CAP_HEIGHT = 0.714;

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
function backgroundLayer({ focusFraction = 0.5, overscan = 1.3, blurFrac = 0.018 } = {}) {
  // Scaled up beyond a plain `cover` fit so the Gaussian blur has bleed to
  // sample from and never reveals a transparent fringe at the canvas edge.
  // A larger overscan also zooms further into the photo, which is used at
  // small sizes to crop out the dark treeline/water band at the edges.
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
      <feGaussianBlur stdDeviation="${CANVAS * blurFrac}" />
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

/** Frosted glass fill covering the whole icon edge-to-edge (no inset, no border) with a soft top-left highlight. */
function panelLayer() {
  return `
    <linearGradient id="panelHighlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLOR.highlight}" />
      <stop offset="0.6" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${COLOR.panelFill}" />
    <rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="url(#panelHighlight)" />`;
}

/** Two-line "GOLF" / "SÄÄ" wordmark, centered on the canvas by cap height rather than baseline. */
function textLayer({ fontSizeFrac, lineGapFrac = 0.04, monochrome = false }) {
  const fontSize = CANVAS * fontSizeFrac;
  const lineHeight = fontSize * (1 + lineGapFrac);
  const cx = CANVAS / 2;
  // Centers the cap-top-of-first-line to baseline-of-second-line block on
  // the canvas midpoint, so this stays balanced across every font size.
  const firstY = CANVAS / 2 + (CAP_HEIGHT * fontSize - lineHeight) / 2;
  const secondY = firstY + lineHeight;
  const saaColor = monochrome ? COLOR.white : COLOR.accent;

  return `
    <text
      x="${cx}" y="${firstY}"
      font-family="${FONT_FAMILY}" font-weight="700" font-size="${fontSize}"
      fill="${COLOR.white}" text-anchor="middle" letter-spacing="${-fontSize * 0.01}">GOLF</text>
    <text
      x="${cx}" y="${secondY}"
      font-family="${FONT_FAMILY}" font-weight="700" font-size="${fontSize}"
      fill="${saaColor}" text-anchor="middle" letter-spacing="${-fontSize * 0.01}">SÄÄ</text>`;
}

function svgDocument(body, { canvas = CANVAS } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${canvas}" height="${canvas}"><defs></defs>${body}</svg>`;
}

/** Full-bleed icon: background photo + scrim, optional edge-to-edge frosted glass, wordmark. Fills the entire CANVAS square (OS applies its own corner mask). */
function fullBleedIcon({ panel, fontSizeFrac, focusFraction, overscan, blurFrac }) {
  const layers = [backgroundLayer({ focusFraction, overscan, blurFrac })];
  if (panel) layers.push(panelLayer());
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

const REGULAR_FONT_FRAC = 0.31;
const FAVICON_FONT_FRAC = 0.3;
const MASKABLE_FONT_FRAC = 0.22;
// Kept smaller than the other variants to fit inside Android's ~66%
// adaptive-icon safe zone (see androidForegroundBody below).
const ANDROID_FONT_FRAC = 0.16;
const FOCUS = 0.46;

// --- Full-bleed app/web icons (edge-to-edge frosted glass) ---
const regularBody = fullBleedIcon({
  panel: true,
  fontSizeFrac: REGULAR_FONT_FRAC,
  focusFraction: FOCUS,
});

writeIcon(join(ROOT, "assets/images/icon.png"), regularBody, 1024);
writeIcon(join(ROOT, "public/icons/icon-512.png"), regularBody, 512);
writeIcon(join(ROOT, "public/icons/icon-192.png"), regularBody, 192);
writeIcon(join(ROOT, "public/icons/apple-touch-icon-180.png"), regularBody, 180);

// --- Favicon (compact variant: no glass, near-full-bleed text for legibility at tiny sizes) ---
// Tighter crop + stronger blur than the large icons so there's no dark
// treeline/water band left at the edges to read as a border at 48px.
const compactBody = fullBleedIcon({
  panel: null,
  fontSizeFrac: FAVICON_FONT_FRAC,
  focusFraction: FOCUS,
  overscan: 2.4,
  blurFrac: 0.05,
});
writeIcon(join(ROOT, "assets/images/favicon.png"), compactBody, 48);

// --- Maskable PWA icon (content kept inside the 80% safe zone) ---
const maskableBody = fullBleedIcon({
  panel: true,
  fontSizeFrac: MASKABLE_FONT_FRAC,
  focusFraction: FOCUS,
});
writeIcon(join(ROOT, "public/icons/icon-maskable-512.png"), maskableBody, 512);

// --- Splash image: rounded tile with transparent padding, centered by the native splash config ---
const splashBody = paddedTile({
  tileFrac: 0.7,
  cornerFrac: 0.16,
  panel: true,
  fontSizeFrac: REGULAR_FONT_FRAC,
  focusFraction: FOCUS,
});
writeIcon(join(ROOT, "assets/images/splash-icon.png"), splashBody, 1024);

// --- Android adaptive icon layers ---
// The glass fill lives on the background layer (it now covers the whole
// canvas), so the foreground/monochrome layers are text-only.
const androidBackgroundBody = [
  backgroundLayer({ focusFraction: FOCUS }),
  panelLayer(),
].join("\n");
writeIcon(
  join(ROOT, "assets/images/android-icon-background.png"),
  androidBackgroundBody,
  432,
);

const androidForegroundBody = textLayer({ fontSizeFrac: ANDROID_FONT_FRAC });
writeIcon(
  join(ROOT, "assets/images/android-icon-foreground.png"),
  androidForegroundBody,
  432,
);

const androidMonochromeBody = textLayer({
  fontSizeFrac: ANDROID_FONT_FRAC,
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
