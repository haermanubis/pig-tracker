// Проверка дословности текстов лендинга (спецификация, разделы 2, 8, 9).
// Запуск: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

const TITLE = 'Способ сбора морфофизиологических данных свиней';
const EYEBROW = 'Студенческий стартап · Фонд содействия инновациям';
const AUTHOR = '– Алексеев Александр Анатольевич';
const DESC_1 = 'За основу взята технология трекинга физиологического состояния человека за счёт совокупных данных нескольких датчиков: акселерометр, пульсометр, гироскоп, датчик температуры.';
const DESC_2 = 'Рабочий процесс изобретения достигается за счёт использования регулируемой шлейки, подходящей под анатомические особенности свиньи и оснащённой акселерометром, датчиками ускорения и температуры, микропроцессором с приёмо-передающим устройством и источником питания. Собранная информация об активности и температуре тела животного посредством радиосвязи передаётся в единый центр сбора информации, в котором по заложенному алгоритму происходит её обработка и анализ. Благодаря способу крепления датчиков и удалённому центру сбора информации, предложенный способ отличается надёжностью работы системы по непрерывному получению фенотипических измерений свиней и возможностью оперативно менять алгоритм анализа информации.';
const STEPS = [
  ['Регулируемая шлейка', 'Акселерометр, датчики ускорения и температуры'],
  ['Микропроцессор', 'С приёмо-передающим устройством и источником питания'],
  ['Радиосвязь', 'Передача информации об активности и температуре тела'],
  ['Единый центр сбора информации', 'Обработка и анализ по заложенному алгоритму'],
];
const ADVANTAGES = [
  ['Эргономичность', 'Учтены особенности анатомии и физиологии свиней, что позволяет использовать продукт в течение длительного времени.'],
  ['Неинвазивность', 'Компоненты закреплены наружно, что исключает потенциальные риски травматизации и стресса для животных.'],
  ['Гибкость', 'Возможность настройки датчиков и хранения получаемых данных.'],
  ['Инновационность', 'Ранее данный метод не применялся в свиноводстве — всё ограничивалось ручными взвешиваниями и наблюдениями.'],
];
const SECTIONS = ['Описание продукта', 'Преимущества'];
const COMPONENTS_TITLE = 'Компоненты и датчики';
const COMPONENTS_LEAD = 'На фото видны все компоненты устройства:';
const COMPONENTS_LIST = [
  'Акселерометр',
  'Датчик ускорения',
  'Датчик температуры',
  'Микропроцессор с приёмо-передающим устройством',
  'Источник питания',
  'Регулируемая шлейка',
];
const FOOTER = 'Проект реализован при поддержке Фонда содействия инновациям в рамках программы «Студенческий стартап» (заявка СтС-514953) мероприятия «Платформа университетского технологического предпринимательства» федерального проекта «Технологии».';

const ALLOWED = [
  TITLE, EYEBROW, AUTHOR, DESC_1, DESC_2, FOOTER,
  ...STEPS.flat(), ...ADVANTAGES.flat(), ...SECTIONS,
  COMPONENTS_TITLE, COMPONENTS_LEAD, ...COMPONENTS_LIST,
];

const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const textOf = (fragment) => collapse(fragment.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '));
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '';
const pageText = textOf(body);

test('документ на русском, заголовок страницы и h1 совпадают с ТЗ', () => {
  assert.match(html, /<html[^>]*\blang="ru"/);
  assert.equal(collapse(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''), TITLE);
  const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1s.length, 1, 'на странице ровно один h1');
  assert.equal(textOf(h1s[0][1]), TITLE);
});

test('все канонические тексты присутствуют дословно', () => {
  for (const s of ALLOWED) assert.ok(pageText.includes(s), `нет текста: «${s}»`);
});

test('текст поддержки Фонда в футере совпадает посимвольно', () => {
  const footer = body.match(/<footer[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? '';
  const p = footer.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
  assert.equal(textOf(p), FOOTER);
});

test('на странице нет текста, которого нет в ТЗ', () => {
  let rest = pageText;
  for (const s of [...ALLOWED].sort((a, b) => b.length - a.length)) rest = rest.split(s).join(' ');
  assert.match(collapse(rest), /^[\d ]*$/, `лишний текст: «${collapse(rest)}»`);
});

test('meta description — первое предложение описания', () => {
  assert.equal(html.match(/<meta name="description" content="([^"]*)"/)?.[1], DESC_1);
  assert.equal(html.match(/<meta property="og:description" content="([^"]*)"/)?.[1], DESC_1);
  assert.equal(html.match(/<meta property="og:title" content="([^"]*)"/)?.[1], TITLE);
});

test('нет JavaScript', () => {
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'нет inline-обработчиков событий');
});

test('типографские символы записаны литералами, а не HTML-сущностями', () => {
  assert.doesNotMatch(html, /&(laquo|raquo|mdash|ndash|middot|nbsp|#\d+|#x[0-9a-f]+);/i);
});

test('все изображения существуют и имеют alt, width, height', () => {
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(imgs.length, 7, 'слоты: продукт, компоненты и датчики, 3 логотипа в футере, + 2 копии в лайтбоксе');
  for (const img of imgs) {
    const src = img.match(/\ssrc="([^"]+)"/)?.[1];
    assert.ok(src && existsSync(join(root, src)), `нет файла: ${src}`);
    assert.match(img, /\salt="[^"]+"/, `нет alt: ${src}`);
    assert.match(img, /\swidth="\d+"/, `нет width: ${src}`);
    assert.match(img, /\sheight="\d+"/, `нет height: ${src}`);
  }
});
