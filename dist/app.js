const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
const asArray = value => value == null ? [] : Array.isArray(value) ? value : [value];
const paragraphs = value => asArray(value).map(line => `<p>${esc(typeof line === 'object' ? line.text : line)}</p>`).join('');
const state = {questions: [], situations: [], dimensions: [], writing: [], saved: new Set(), savedOnly: false, universalOnly: false, page: 0, universal: []};
const pageSize = 12;
let returnFocus;
try { state.saved = new Set(JSON.parse(localStorage.getItem('boq-selection') || '[]').map(Number)); } catch { /* Browsing works when storage is unavailable. */ }

async function readData(path, fallback) {
  const response = await fetch(path);
  if (!response.ok) { if (fallback !== undefined) return fallback; throw new Error(`Unable to read ${path}`); }
  return response.json();
}

function persist() {
  try { localStorage.setItem('boq-selection', JSON.stringify([...state.saved])); } catch { /* Selection remains available for this visit. */ }
  $('#saved-count').textContent = state.saved.size;
}

function normaliseQuestion(question) {
  return {...question, id: Number(question.id ?? question.number), text: question.text ?? question.question,
    why: asArray(question.why ?? question.whyAsk), insights: asArray(question.insights),
    related: asArray(question.related ?? question.links).map(Number)};
}

function dimensionIds(dimension) { return asArray(dimension.questions ?? dimension.questionIds).map(value => Number(typeof value === 'object' ? value.id ?? value.number : value)); }
function dimensionTitle(dimension) { return dimension.title ?? dimension.name ?? `${dimension.left} – ${dimension.right}`; }
function questionLinks(ids) {
  if (ids.length === 98) return '<button type="button" data-all-questions><span>↗</span>All other questions<span aria-hidden="true">→</span></button>';
  return ids.map(Number).filter(id => state.questions.some(question => question.id === id)).map(id => {
    const question = state.questions.find(item => item.id === id);
    return `<button type="button" data-question="${id}"><span>${String(id).padStart(2, '0')}</span>${esc(question.text)}<span aria-hidden="true">↗</span></button>`;
  }).join('');
}

function filterQuestions() {
  const term = $('#search').value.trim().toLocaleLowerCase('en-GB');
  const situation = state.situations.find(item => String(item.id) === $('#situation').value);
  const dimension = state.dimensions.find(item => String(item.id) === $('#dimension').value);
  $('#dimension-note').hidden = !dimension;
  const selectedSituation = situation ? asArray(situation.questions ?? situation.questionIds).map(Number) : null;
  const selectedDimension = dimension ? dimensionIds(dimension) : null;
  return state.questions.filter(question => {
    if (state.universalOnly && !state.universal.includes(question.id)) return false;
    if (state.savedOnly && !state.saved.has(question.id)) return false;
    if (selectedSituation && !selectedSituation.includes(question.id)) return false;
    if (selectedDimension && !selectedDimension.includes(question.id)) return false;
    if (!term) return true;
    if (/^(?:q\s*)?\d+$/.test(term)) return question.id === Number(term.replace(/^q\s*/, ''));
    return [question.text, ...question.why, ...question.insights].join(' ').toLocaleLowerCase('en-GB').includes(term);
  });
}

function renderQuestions() {
  const questions = filterQuestions();
  const situation = state.situations.find(item => String(item.id) === $('#situation').value);
  $('#situation-reading').innerHTML = situation ? `<details class="source-note situation-detail"><summary>Situation ${situation.id}: ${esc(situation.text)}</summary>${paragraphs(situation.body)}${asArray(situation.corrections).map(item => `<p class="notice">Source correction: ${esc(item.note)}</p>`).join('')}${situation.notes ? `<p class="notice">${esc(asArray(situation.notes).join(' '))}</p>` : ''}</details>` : '';
  state.page = Math.max(0, Math.min(state.page, Math.ceil(questions.length / pageSize) - 1));
  const first = state.page * pageSize;
  $('#result-count').textContent = `${questions.length} ${questions.length === 1 ? 'question' : 'questions'}${state.savedOnly ? ' in your selection' : ''}${state.universalOnly ? ' for any situation' : ''}${questions.length > pageSize ? ` · ${first + 1}–${Math.min(first + pageSize, questions.length)}` : ''}`;
  $('#question-list').innerHTML = questions.length ? questions.slice(first, first + pageSize).map(question => `<li class="question-row"><button class="question-open" type="button" data-question="${question.id}"><span class="question-number">${String(question.id).padStart(2, '0')}</span><span class="question-text">${esc(question.text)}</span><span class="question-arrow" aria-hidden="true">↗</span></button><button class="save-question ${state.saved.has(question.id) ? 'is-saved' : ''}" type="button" data-save="${question.id}" aria-pressed="${state.saved.has(question.id)}" aria-label="${state.saved.has(question.id) ? 'Remove' : 'Save'} question ${question.id}">${state.saved.has(question.id) ? '−' : '+'}</button></li>`).join('') : '<li class="empty"><p>No questions match these choices.</p><p>Try fewer filters, or clear them to see all 99.</p></li>';
  $('#pagination').innerHTML = questions.length > pageSize ? `<button class="button button-plain" type="button" data-page="${state.page - 1}" ${state.page === 0 ? 'disabled' : ''}>← Previous</button><span>Page ${state.page + 1} of ${Math.ceil(questions.length / pageSize)}</span><button class="button button-plain" type="button" data-page="${state.page + 1}" ${first + pageSize >= questions.length ? 'disabled' : ''}>Next →</button>` : '';
  $('#universal').setAttribute('aria-pressed', String(state.universalOnly));
  $('#saved-filter').classList.toggle('active', state.savedOnly);
  $('#saved-filter').setAttribute('aria-pressed', String(state.savedOnly));
  persist();
}

function openDialog(dialog) {
  if (!document.querySelector('dialog[open]')) returnFocus = document.activeElement;
  for (const item of document.querySelectorAll('dialog[open]')) if (item !== dialog) item.close();
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}

function openQuestion(id, updateHash = true) {
  const question = state.questions.find(item => item.id === Number(id));
  if (!question) return;
  const dimensions = state.dimensions.filter(dimension => dimensionIds(dimension).includes(question.id));
  const situations = state.situations.filter(situation => asArray(situation.questions ?? situation.questionIds).map(Number).includes(question.id));
  const why = question.why.length ? `<section class="reader-section"><h3>Why ask yourself this question?</h3>${paragraphs(question.why)}</section>` : '';
  const insights = question.insights.length ? `<section class="reader-section"><h3>What insights could you gain?</h3>${paragraphs(question.insights)}</section>` : '';
  $('#reader-kicker').textContent = `The 99 questions / ${String(question.id).padStart(2, '0')}`;
  $('#reader-body').innerHTML = `<div class="reader-number" aria-hidden="true">${String(question.id).padStart(2, '0')}</div><h2 class="reader-title" id="reader-title">${esc(question.text)}</h2><div class="reader-actions"><button class="button button-primary" type="button" data-save="${question.id}" aria-pressed="${state.saved.has(question.id)}">${state.saved.has(question.id) ? 'Remove from my selection −' : 'Save to my selection +'}</button><button class="button button-plain" data-copy="${question.id}" type="button">Copy link ↗</button><span class="copy-status" role="status" aria-live="polite"></span></div><div class="reader-columns">${why}${insights}</div>${question.related.length ? `<section class="reader-section"><h3>Connected questions</h3><div class="related-list">${questionLinks(question.related)}</div></section>` : ''}${situations.length ? `<section class="reader-section"><h3>Situations in the book</h3><ul class="reader-situations">${situations.map(situation => `<li><button type="button" data-situation="${situation.id}">${esc(situation.id)}. ${esc(situation.text ?? situation.title)}</button></li>`).join('')}</ul></section>` : ''}${dimensions.length ? `<section class="reader-section"><h3>Dimensions from the earlier manuscripts</h3><div class="dimension-tags">${dimensions.map(dimension => `<button class="chip" type="button" data-dimension="${esc(dimension.id)}">${esc(dimensionTitle(dimension))}</button>`).join('')}</div></section>` : ''}<p class="reader-provenance">${esc(state.sourceLabel)}${question.page ? ` · page ${question.page}` : ''}</p><div class="reader-actions reader-pagination"><button class="button button-plain" type="button" data-question="${question.id === 1 ? 99 : question.id - 1}">← Previous question</button><button class="button button-plain" type="button" data-question="${question.id === 99 ? 1 : question.id + 1}">Next question →</button></div>`;
  openDialog($('#reader'));
  if (asArray(question.references).length) {
    const referenceSection = document.createElement('section');
    referenceSection.className = 'reader-section';
    referenceSection.innerHTML = `<h3>References in the book</h3>${paragraphs(question.references)}<p class="reader-provenance">These references appear in the source edition.</p>`;
    $('.reader-provenance', $('#reader-body')).before(referenceSection);
  }
  for (const correction of asArray(question.corrections)) {
    const note = document.createElement('p'); note.className = 'notice';
    note.textContent = `Source correction: ${correction.note ?? correction}`;
    $('.reader-provenance', $('#reader-body')).before(note);
  }
  if (updateHash) history.replaceState(null, '', `#q-${question.id}`);
}

function displayDate(value, circulated = false) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return `${circulated ? 'Circulated ' : ''}${new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(value))}`;
}

function openWriting(id, updateHash = true) {
  const writing = state.writing.find(item => item.id === id);
  if (!writing) return;
  $('#article-body').innerHTML = `<p class="eyebrow">${esc(writing.author)}${writing.date ? ` · ${esc(displayDate(writing.date, !writing.status?.startsWith('Historical')))}` : ''}</p><h2 id="article-title">${esc(writing.title)}</h2>${writing.status ? `<p class="notice">${esc(writing.status)}</p>` : ''}<div class="original-writing">${paragraphs(writing.paragraphs ?? writing.text)}</div>${asArray(writing.questionIds).length ? `<section class="reader-section"><h3>Questions in this piece</h3><div class="related-list">${questionLinks(writing.questionIds)}</div></section>` : ''}<p class="reader-provenance">${esc(writing.source ?? '')}</p>`;
  openDialog($('#article'));
  if (updateHash) history.replaceState(null, '', `#writing-${writing.id}`);
}

function route() {
  const hash = location.hash;
  if (/^#q-\d+$/.test(hash)) openQuestion(Number(hash.slice(3)), false);
  else if (hash.startsWith('#writing-')) openWriting(decodeURIComponent(hash.slice(9)), false);
}

function renderDimensions() {
  $('#dimension-grid').innerHTML = state.dimensions.map((dimension, index) => {
    const name = dimensionTitle(dimension);
    const poles = dimension.poles ?? name.split(/\s*[–—]\s*/);
    return `<article class="dimension-item"><span class="eyebrow">${String(index + 1).padStart(2, '0')} / ${dimensionIds(dimension).length} questions</span><h3 class="dimension-poles">${poles.length === 2 ? `<span>${esc(poles[0])}</span><span>${esc(poles[1])}</span>` : esc(name)}</h3>${dimension.tagline ? `<p>${esc(dimension.tagline)}</p>` : ''}<div class="dimension-actions"><button class="button button-plain" data-dimension-read="${esc(dimension.id)}" type="button">Read the dimension ↗</button><button class="button button-plain" data-dimension="${esc(dimension.id)}" type="button">View questions →</button></div></article>`;
  }).join('');
}

function clearFilters() {
  $('#search').value = '';
  $('#situation').value = '';
  $('#dimension').value = '';
  state.savedOnly = false;
  state.universalOnly = false;
  state.page = 0;
}

function selectRoute(type, id) {
  closeDialogs(false);
  clearFilters();
  $(`#${type}`).value = String(id);
  renderQuestions();
  history.replaceState(null, '', '#questions');
  $('#questions').scrollIntoView({behavior: 'smooth'});
  $(`#${type}`).focus({preventScroll: true});
}

function closeDialogs(restore = true) {
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  document.body.classList.remove('dialog-open');
  if (/^#(q-|writing-)/.test(location.hash)) history.replaceState(null, '', '#questions');
  if (restore && returnFocus?.isConnected) returnFocus.focus({preventScroll: true});
}

document.addEventListener('click', async event => {
  const question = event.target.closest('[data-question]');
  const save = event.target.closest('[data-save]');
  const dimension = event.target.closest('[data-dimension]');
  const situation = event.target.closest('[data-situation]');
  const writing = event.target.closest('[data-writing]');
  const copy = event.target.closest('[data-copy]');
  const dimensionRead = event.target.closest('[data-dimension-read]');
  const intro = event.target.closest('[data-intro]');
  const page = event.target.closest('[data-page]');
  const allQuestions = event.target.closest('[data-all-questions]');
  if (question) openQuestion(question.dataset.question);
  else if (save) {
    const id = Number(save.dataset.save);
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    renderQuestions();
    if ($('#reader').open) { openQuestion(id, false); $(`[data-save="${id}"]`, $('#reader')).focus(); }
  } else if (dimensionRead) {
    const item = state.dimensions.find(value => String(value.id) === dimensionRead.dataset.dimensionRead);
    if (!item) return;
    $('#article-body').innerHTML = `<p class="eyebrow">Original dimensions · Development manuscript, July 2014</p><h2 id="article-title">${esc(dimensionTitle(item))}</h2><p class="notice">${esc(item.status ?? 'Development manuscript')}</p>${item.tagline ? `<blockquote>${esc(item.tagline)}</blockquote>` : ''}${['why', 'description', 'examples', 'summary'].map(key => asArray(item[key]).length ? `<section class="reader-section"><h3>${{why: 'Why this dimension matters', description: 'The dimension', examples: 'Examples', summary: 'Summary'}[key]}</h3>${paragraphs(item[key])}</section>` : '').join('')}<section class="reader-section"><h3>Questions in this dimension</h3><div class="related-list">${questionLinks(dimensionIds(item))}</div></section><p class="reader-provenance">${esc(item.source)}</p>`;
    openDialog($('#article'));
  } else if (intro) {
    const item = state.intro[intro.dataset.intro];
    $('#article-body').innerHTML = `<p class="eyebrow">${esc(state.sourceLabel)}</p><h2 id="article-title">${esc(item[0])}</h2><div class="original-writing">${paragraphs(item.slice(1))}</div>`;
    openDialog($('#article'));
  } else if (allQuestions) {
    closeDialogs(false); clearFilters(); renderQuestions(); history.replaceState(null, '', '#questions'); $('#questions').scrollIntoView({behavior: 'smooth'});
  } else if (page) {
    state.page = Number(page.dataset.page); renderQuestions(); $('#result-count').scrollIntoView({behavior: 'smooth'});
  } else if (dimension) selectRoute('dimension', dimension.dataset.dimension);
  else if (situation) selectRoute('situation', situation.dataset.situation);
  else if (writing) openWriting(writing.dataset.writing);
  else if (event.target.closest('[data-close]')) closeDialogs();
  else if (copy) {
    const url = new URL(location.href); url.hash = `q-${copy.dataset.copy}`;
    try { await navigator.clipboard.writeText(url.href); $('.copy-status').textContent = 'Link copied.'; }
    catch { $('.copy-status').textContent = url.href; }
  }
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialogs(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialogs(); });
}
for (const id of ['search', 'situation', 'dimension']) $(`#${id}`).addEventListener(id === 'search' ? 'input' : 'change', () => {state.page = 0; renderQuestions();});
$('#universal').addEventListener('click', () => {const active = state.universalOnly; clearFilters(); state.universalOnly = !active; renderQuestions();});
$('#saved-filter').addEventListener('click', () => { state.savedOnly = !state.savedOnly; renderQuestions(); });
$('#reset').addEventListener('click', () => { clearFilters(); renderQuestions(); });
for (const id of ['random', 'random-hero']) $(`#${id}`).addEventListener('click', () => {
  const candidates = filterQuestions();
  if (candidates.length) openQuestion(candidates[Math.floor(Math.random() * candidates.length)].id);
});
$('#print-selection').addEventListener('click', () => {
  const selected = state.questions.filter(question => state.saved.has(question.id));
  if (!selected.length) { $('#result-count').textContent = 'Save a question with + to begin your selection.'; return; }
  $('#print-content').innerHTML = `<h1>The 99 Essential Business Questions</h1><p>My selection · ${selected.length} questions</p>${selected.map(question => `<article><h2>${question.id}. ${esc(question.text)}</h2>${question.why.length ? `<h3>Why ask?</h3>${paragraphs(question.why)}` : ''}${question.insights.length ? `<h3>Possible insights</h3>${paragraphs(question.insights)}` : ''}<div class="notes-space"><h3>My response / action</h3></div></article>`).join('')}<p>© The authors · Filament Publishing, 2016 · ${esc(state.sourceLabel)}</p>`;
  window.print();
});
window.addEventListener('hashchange', route);

try {
  const [book, dimensions, writing] = await Promise.all([readData('data/book.json'), readData('data/dimensions.json', []), readData('data/writing.json', [])]);
  state.questions = book.questions.map(normaliseQuestion).sort((a, b) => a.id - b.id);
  state.situations = book.situations ?? [];
  state.dimensions = Array.isArray(dimensions) ? dimensions : dimensions.dimensions ?? [];
  state.writing = Array.isArray(writing) ? writing : writing.writing ?? [];
  state.intro = book.intro ?? {};
  state.universal = book.universalQuestions ?? [];
  state.sourceLabel = typeof book.source === 'string' ? book.source : `${book.source?.label ?? 'Publication manuscript'}${book.source?.date ? ` · ${displayDate(book.source.date)}` : ''}`;
  $('#book-sections').innerHTML = Object.entries(state.intro).map(([id, section]) => `<button class="button button-plain" data-intro="${esc(id)}" type="button">${esc(section[0])} ↗</button>`).join('');
  const situationGroups = new Map();
  for (const situation of state.situations) {
    const groupName = situation.group ?? 'Situations';
    if (!situationGroups.has(groupName)) {
      const group = document.createElement('optgroup'); group.label = groupName;
      situationGroups.set(groupName, group); $('#situation').append(group);
    }
    situationGroups.get(groupName).append(new Option(`${situation.id}. ${situation.text ?? situation.title}`, situation.id));
  }
  for (const dimension of state.dimensions) $('#dimension').add(new Option(dimensionTitle(dimension), dimension.id));
  $('#writing-grid').innerHTML = state.writing.map(item => `<button class="reading-link" data-writing="${esc(item.id)}" type="button"><span class="eyebrow">${esc(item.author)}${item.date ? ` · ${esc(displayDate(item.date, !item.status?.startsWith('Historical')))}` : ''}</span><h3>${esc(item.title)}</h3>${item.summary ? `<p>${esc(item.summary)}</p>` : ''}${item.status ? `<span class="writing-status">${esc(item.status)}</span>` : ''}<span class="reading-arrow" aria-hidden="true">↗</span></button>`).join('');
  $('#edition-note').innerHTML = `<p>${esc(book.editionNote ?? state.sourceLabel)}</p>${book.source?.status ? `<p>${esc(book.source.status)}</p>` : ''}<p>The text follows the revised print layout dated 23 February 2017. The complete PDF includes the original illustrations, diagrams, and author biographies.</p>`;
  if (!Array.isArray(dimensions) && dimensions.introduction) $('#dimension-introduction').innerHTML = paragraphs(dimensions.introduction);
  renderDimensions(); renderQuestions(); route();
} catch (error) {
  $('#load-error').hidden = false;
  $('#result-count').textContent = 'The questions couldn’t be loaded.';
  console.error(error);
}
