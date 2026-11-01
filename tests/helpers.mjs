import { readFile, readdir } from 'node:fs/promises';
import postcss from 'postcss';

export const root = new URL('../', import.meta.url);
export const themes = await Promise.all(
  (await readdir(new URL('themes/', root))).filter((name) => name.endsWith('.css')).sort().map(async (name) => {
    const css = await readFile(new URL(`themes/${name}`, root), 'utf8');
    const ast = postcss.parse(css, { from: name });
    const tokens = new Map();
    ast.walkDecls(/^--/, (declaration) => tokens.set(declaration.prop, declaration.value));
    return { name, css, ast, tokens };
  }),
);

export function rgb(hex) {
  if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Expected a six-digit hex color, received ${hex}`);
  return hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16));
}

export function luminance(color) {
  const channels = (Array.isArray(color) ? color : rgb(color)).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function composite(foreground, background, opacity) {
  return rgb(foreground).map((channel, index) => channel * opacity + rgb(background)[index] * (1 - opacity));
}

export function cssRgb(color) {
  return `rgb(${rgb(color).join(', ')})`;
}
