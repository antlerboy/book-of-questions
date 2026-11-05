import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');
function* strings(value) {
  if (typeof value === 'string') yield value;
  else if (value && typeof value === 'object') for (const item of Object.values(value)) yield* strings(item);
}
const book = JSON.parse(await read('dist/data/book.json'));
assert.equal(book.source.date, '2017-02-23', 'Use the revised final print layout.');
const bookPdf = await readFile(path.join(root, 'dist/assets/book.pdf'));
assert.equal(bookPdf.subarray(0, 5).toString(), '%PDF-', 'The complete reading copy must be a PDF.');
const rawDimensions = JSON.parse(await read('dist/data/dimensions.json'));
const dimensions = Array.isArray(rawDimensions) ? rawDimensions : rawDimensions.dimensions;
const writing = JSON.parse(await read('dist/data/writing.json'));
const ids = new Set(book.questions.map(item => item.id));
assert.deepEqual([...ids], Array.from({length: 99}, (_, index) => index + 1), 'Question numbers must cover 1–99 exactly.');
for (const question of book.questions) {
  assert(question.text && question.why.length && question.insights.length, `Question ${question.id} is incomplete.`);
  assert(!/copyright|all rights reserved|\.indd\b/i.test([...question.why, ...question.insights].join(' ')), `A production footer leaked into question ${question.id}.`);
  assert(!question.insights.includes('The 99 Questions'), `The book index leaked into question ${question.id}.`);
  for (const id of question.related) assert(ids.has(id), `Question ${question.id} links to absent question ${id}.`);
}
assert.equal(book.situations.length, 47, 'The manuscript has 47 situations.');
assert.deepEqual(book.situations.map(item => item.id), Array.from({length: 47}, (_, index) => index + 1));
for (const situation of book.situations) {
  assert(situation.text && situation.questions.length, `Situation ${situation.id} is incomplete.`);
  for (const id of situation.questions) assert(ids.has(id), `Situation ${situation.id} links to absent question ${id}.`);
}
for (const [key, section] of Object.entries(book.intro)) {
  assert(section.length > 1 && section[0].length < 100, `Opening section ${key} needs a standalone title and its text.`);
}
assert.equal(dimensions.length, 10);
const dimensionIds = new Set();
for (const dimension of dimensions) {
  assert(dimension.title && dimension.description.length && dimension.source);
  for (const id of dimension.questionIds) {assert(ids.has(id)); dimensionIds.add(id);}
}
assert.equal(dimensionIds.size, 99, 'All questions should be covered by the restored dimensions.');
assert(writing.length >= 17);
assert.equal(new Set(writing.map(item => item.id)).size, writing.length, 'Writing IDs must be unique.');
for (const item of writing) {
  assert(item.title && item.author && item.paragraphs.length && item.source);
  for (const id of item.questionIds ?? []) assert(ids.has(id));
}
const html = await read('dist/index.html');
for (const name of ['Gia Campari', 'David Glassman', 'Michael Jeans', 'Patrick McHugh', 'David Peregrine-Jones', 'David Shannon', 'Benjamin P Taylor', 'Natasa Sears']) assert(html.includes(name), `Missing credit: ${name}`);
for (const relative of ['dist/index.html', 'dist/app.js', 'dist/styles.css', ...['book', 'dimensions', 'writing'].map(name => `dist/data/${name}.json`)]) {
  const text = await read(relative);
  const decoded = relative.endsWith('.json') ? [...strings(JSON.parse(text))].join('\n') : text;
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u03d0\ufffd\ue000-\uf8ff]/u.test(decoded), `Extraction character remains in ${relative}.`);
  assert(!/sdmnt|sig=|attachment_id|gmail\.com|graph\.microsoft\.com|@redquadrant|@gmail|Account Not Active/i.test(text), `Private source artefact in ${relative}.`);
  assert(!/fiirst|fiive|profiit|infiluenc|diffiicult|confiidence|filourish|unfulfiilled/.test(text), `PDF ligature damage in ${relative}.`);
}
for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
  const url = match[1];
  if (/^https?:/.test(url)) continue;
  await readFile(path.join(root, 'dist', url.split('#')[0]));
}
console.log(`Checked ${book.questions.length} complete questions, ${book.situations.length} situations, ${dimensions.length} dimensions, ${writing.length} pieces of writing, all internal references, credits, and local assets.`);
