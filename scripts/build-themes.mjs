import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const palettes = JSON.parse(await readFile(new URL('src/palettes.json', root), 'utf8'));
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const triplet = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16)).join(' ');
const scale = (prefix, colors) => steps.map((step, index) => `  --${prefix}-${step}: ${colors[index]};`).join('\n');
const check = process.argv.includes('--check');
let stale = false;

await mkdir(new URL('themes/', root), { recursive: true });
for (const p of palettes) {
  const gray = [...p.neutral].reverse();
  gray[8] = p.panel;
  gray[9] = p.neutral[0];
  gray[10] = p.canvas;
  const css = `/*
 * ${p.name.toUpperCase()} | ImmichCSS 1.0.0 | MIT License
 * ${p.description}
 * Source: https://github.com/YellowSnowman23/ImmichCSS
 * Target: Immich web 3.3.5. Choose Dark appearance before installing.
 * Paste into Administration > Settings > Theme Settings > Custom CSS.
 * Install ONE theme at a time. Remove it to restore Immich's default colors.
 * Generated from src/palettes.json; edit the source and run npm run build.
 */

:root.dark,
.dark {
  /* Native UI tokens: full CSS colors. */
  --immich-ui-light: ${p.canvas};
  --immich-ui-dark: ${p.text};
  --immich-ui-gray: ${p.panel};
  --immich-ui-muted: ${p.muted};
  --immich-ui-default-border: ${p.border};

  /* Immich reverses primary and light ramps in dark appearance. */
${scale('immich-ui-primary', p.primary)}

${scale('immich-ui-light', p.neutral)}

${scale('immich-ui-dark', [...p.neutral].reverse())}

  /* Neutral utilities used by legacy fields and labels. */
${scale('color-gray', gray)}

  /* Legacy web tokens MUST remain space-separated RGB channels. */
  --immich-dark-primary: ${triplet(p.primary[5])};
  --immich-dark-bg: ${triplet(p.canvas)};
  --immich-dark-fg: ${triplet(p.text)};
  --immich-dark-gray: ${triplet(p.panel)};
}

:root.dark {
  color-scheme: dark;
  background-color: var(--immich-ui-light);
  scrollbar-color: var(--immich-ui-light-300) var(--immich-ui-light);
}

:root.dark body:not(.asset-viewer-open) {
  background-color: var(--immich-ui-light);
}

/* Retain native validation states; add an unmistakable keyboard focus ring. */
:root.dark :where(a[href], button, [role="button"]):focus-visible {
  outline: 2px solid var(--immich-ui-primary-500);
  outline-offset: 3px;
}

:root.dark ::selection {
  background-color: var(--immich-ui-primary-500);
  color: var(--immich-ui-light);
}

:root.dark :where(.immich-scrollbar, [role="dialog"]) {
  scrollbar-color: var(--immich-ui-light-300) var(--immich-ui-light-50);
}
`;
  const destination = new URL(`themes/${p.slug}.css`, root);
  if (check) {
    const existing = await readFile(destination, 'utf8').catch(() => '');
    if (existing !== css) {
      console.error(`Out of date: ${fileURLToPath(destination)}`);
      stale = true;
    }
  } else {
    await writeFile(destination, css);
    console.log(`Built themes/${p.slug}.css`);
  }
}
if (stale) process.exitCode = 1;
else if (check) console.log(`All ${palettes.length} theme files match their source palettes.`);
