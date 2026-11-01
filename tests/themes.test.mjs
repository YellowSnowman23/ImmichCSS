import assert from 'node:assert/strict';
import test from 'node:test';
import { themes, rgb, luminance, contrast, composite } from './helpers.mjs';

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Split only selector-list commas; commas inside :where() belong to one selector.
function selectors(text) {
  let depth = 0;
  let start = 0;
  const result = [];
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '(' || text[index] === '[') depth++;
    if (text[index] === ')' || text[index] === ']') depth--;
    if (text[index] === ',' && depth === 0) {
      result.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  return [...result, text.slice(start).trim()];
}

test('the collection contains seven distinct themes', () => {
  assert.equal(themes.length, 7);
  assert.equal(new Set(themes.map(({ tokens }) => tokens.get('--immich-ui-primary-500'))).size, 7);
});

for (const { name, css, ast, tokens } of themes) {
  test(`${name}: parseable, dark-scoped, color-only CSS without external requests`, () => {
    assert.ok(ast.nodes.length > 0);
    assert.doesNotMatch(css, /(?:url\s*\(|@import\b|@font-face\b)/i);
    ast.walkAtRules((rule) => assert.fail(`Unexpected @${rule.name}; themes must be self-contained color overrides`));
    ast.walkRules((rule) => {
      for (const selector of selectors(rule.selector)) {
        assert.match(selector, /^(?::root)?\.dark(?:$|[\s:[.#>+~])/, `Unscoped selector: ${selector}`);
      }
    });
    const paintProperties = new Set(['background-color', 'color', 'color-scheme', 'scrollbar-color', 'outline', 'outline-offset']);
    ast.walkDecls((declaration) => {
      assert.ok(declaration.prop.startsWith('--') || paintProperties.has(declaration.prop), `Layout/media mutation: ${declaration.prop}`);
      assert.equal(Boolean(declaration.important), false, `Avoid overriding native state styles: ${declaration.prop}`);
      assert.doesNotMatch(declaration.prop, /^--immich-ui-(success|danger|warning|info)/, 'Native status palettes must remain untouched');
    });
  });

  test(`${name}: full-color UI tokens and RGB-channel legacy tokens are usable`, () => {
    const legacy = {
      '--immich-dark-primary': '--immich-ui-primary-500',
      '--immich-dark-bg': '--immich-ui-light',
      '--immich-dark-fg': '--immich-ui-dark',
      '--immich-dark-gray': '--immich-ui-gray',
    };
    for (const [property, color] of tokens) {
      if (property in legacy) {
        assert.match(color, /^\d{1,3} \d{1,3} \d{1,3}$/);
        const channels = color.split(' ').map(Number);
        assert.ok(channels.every((channel) => channel >= 0 && channel <= 255));
        assert.deepEqual(channels, rgb(tokens.get(legacy[property])), `${property} must match its native UI color`);
      } else {
        assert.match(color, /^#[\da-f]{6}$/i, `${property} must be a complete CSS color`);
      }
    }
    for (const property of Object.keys(legacy)) assert.ok(tokens.has(property), `Missing ${property}`);
    for (const prefix of ['immich-ui-primary', 'immich-ui-light', 'immich-ui-dark', 'color-gray']) {
      const levels = steps.map((step) => luminance(tokens.get(`--${prefix}-${step}`)));
      for (let index = 1; index < levels.length; index++) {
        const ascending = prefix === 'immich-ui-primary' || prefix === 'immich-ui-light';
        assert.ok(ascending ? levels[index] > levels[index - 1] : levels[index] < levels[index - 1], `${prefix} ramp must progress consistently in dark appearance`);
      }
    }
  });

  test(`${name}: documented text, selection, button and focus color pairs meet contrast targets`, () => {
    const token = (short) => tokens.get(`--immich-ui-${short}`);
    const check = (label, foreground, background, minimum = 4.5) => {
      const ratio = contrast(foreground, background);
      assert.ok(ratio >= minimum, `${label}: ${ratio.toFixed(2)}:1 is below ${minimum}:1`);
    };
    for (const surface of ['light', 'gray']) {
      check(`body text on ${surface}`, token('dark'), token(surface));
      check(`muted text on ${surface}`, token('muted'), token(surface));
      check(`primary text on ${surface}`, token('primary-500'), token(surface));
      check(`focus ring on ${surface}`, token('primary-500'), token(surface), 3);
      check(`filled button hover on ${surface}`, token('light'), composite(token('primary-500'), token(surface), 0.8));
    }
    check('filled primary button and selected text', token('light'), token('primary-500'));
    check('legacy form label', tokens.get('--color-gray-300'), token('light'));
    check('legacy form value', token('dark'), tokens.get('--color-gray-800'));
  });
}
