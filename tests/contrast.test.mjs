// Контраст пар «текст / фон» из токенов css/style.css — не ниже WCAG AA (4.5:1).
// Запуск: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'style.css'), 'utf8');
const tokens = Object.fromEntries(
  [...css.matchAll(/--(c-[\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]),
);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const PAIRS = [
  ['c-ink', 'c-page'], ['c-ink', 'c-card'],
  ['c-ink-2', 'c-page'], ['c-ink-2', 'c-card'],
  ['c-muted', 'c-page'], ['c-muted', 'c-card'],
  ['c-accent-text', 'c-page'], ['c-accent-text', 'c-card'],
  ['c-on-graphite', 'c-graphite'], ['c-on-graphite-2', 'c-graphite'],
  ['c-accent-on-graphite', 'c-graphite'],
];

for (const [fg, bg] of PAIRS) {
  test(`${fg} на ${bg} ≥ 4.5:1`, () => {
    assert.ok(tokens[fg] && tokens[bg], `токены ${fg}/${bg} не найдены`);
    const r = ratio(tokens[fg], tokens[bg]);
    assert.ok(r >= 4.5, `${tokens[fg]} на ${tokens[bg]}: ${r.toFixed(2)}:1`);
  });
}
