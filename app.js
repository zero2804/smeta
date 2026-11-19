'use strict';
// =====================================================================
//  Сметы кровли — приложение для телефона. Все данные хранятся в телефоне.
// =====================================================================

const STORE_KEY = 'smeta.v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const today = () => new Date().toISOString().slice(0, 10);

// Вид работ и предложный падеж объекта — для акта
const TPL_KIND = {
  pvc_full: { ru: 'ПВХ изоляция', uz: 'PVX izolyatsiya' },
  pvc_vapor: { ru: 'ПВХ изоляция', uz: 'PVX izolyatsiya' },
  pvc_noinsul: { ru: 'ПВХ изоляция', uz: 'PVX izolyatsiya' },
  pvc_simple: { ru: 'ПВХ изоляция', uz: 'PVX izolyatsiya' },
  bit_two: { ru: 'битумная гидроизоляция', uz: 'bitumli gidroizolyatsiya' },
  bit_one: { ru: 'битумная гидроизоляция', uz: 'bitumli gidroizolyatsiya' },
  bit_vert: { ru: 'вертикальная битумная изоляция', uz: 'vertikal bitumli izolyatsiya' },
  vapor: { ru: 'битумная пароизоляция', uz: "bitumli bug'izolyatsiya" },
  roof_insul: { ru: 'утепление крыши', uz: 'tomni isitish' },
  blank: { ru: 'гидроизоляция', uz: 'gidroizolyatsiya' },
};
const OBJ_ON = {
  terrace: { ru: 'на террасе', uz: 'terrasada' },
  roof: { ru: 'на кровле', uz: 'tomda' },
  foundation: { ru: 'фундамента', uz: 'poydevorda' },
  pool: { ru: 'бассейна', uz: 'basseynda' },
  basement: { ru: 'подвала', uz: "yerto'lada" },
  other: { ru: '', uz: '' },
};

// ---------------------------------------------------------------------
//  Хранилище
// ---------------------------------------------------------------------
let db;

function defaultDb() {
  return {
    v: 1,
    settings: {
      lang: 'ru', docLang: 'ru', warranty: 10, showContacts: true,
      currencies: clone(DEFAULT_CURRENCIES),
      company: { name: '', nameLatin: '', short: '', address: '', passport: '', passportIssued: '', phone: '', pinfl: '', license: '' },
    },
    catalog: clone(DEFAULT_CATALOG),
    estimates: [],
  };
}

function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { data = null; }
  db = data && data.v === 1 ? data : defaultDb();
  // Новые позиции справочника из обновлений программы добавляем, не трогая цены пользователя
  const have = new Set(db.catalog.map((i) => i.id));
  for (const it of DEFAULT_CATALOG) if (!have.has(it.id)) db.catalog.push(clone(it));
  const s = db.settings;
  const def = defaultDb().settings;
  for (const k of Object.keys(def)) if (s[k] === undefined) s[k] = clone(def[k]);
  for (const k of Object.keys(def.company)) if (s.company[k] === undefined) s.company[k] = '';
}

let saveTimer = null;
function save(now = false) {
  clearTimeout(saveTimer);
  const doSave = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { toast('⚠️ ' + e.message); }
  };
  if (now) doSave(); else saveTimer = setTimeout(doSave, 300);
}
window.addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

// ---------------------------------------------------------------------
//  Язык, валюта, числа
// ---------------------------------------------------------------------
const L = () => db.settings.lang;
const t = (k) => (STR[L()] && STR[L()][k]) ?? STR.ru[k] ?? k;
const tr = (obj, lang = L()) => (obj ? obj[lang] ?? obj.ru ?? '' : '');

function cur(code) {
  return db.settings.currencies.find((c) => c.code === code) || db.settings.currencies[0];
}

function fmt(n, dec = 0) {
  if (!isFinite(n)) n = 0;
  const neg = n < 0;
  let s = Math.abs(n).toFixed(dec);
  let [i, f] = s.split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (f && /^0+$/.test(f)) f = '';
  return (neg ? '-' : '') + i + (f ? ',' + f : '');
}
const fmtQty = (n) => fmt(Math.round(n * 1000) / 1000, Number.isInteger(Math.round(n * 1000) / 1000) ? 0 : 2);
const parseNum = (s) => {
  const v = parseFloat(String(s ?? '').replace(/[\s ]/g, '').replace(',', '.'));
  return isFinite(v) ? v : 0;
};

// Деньги хранятся в сумах; показываем в валюте сметы по её курсу
function money(uzs, e, code) {
  const c = cur(code || e.currency);
  const rate = code && code !== e.currency ? (code === e.currency2 ? e.rate2 : c.rate) : e.rate;
  const v = uzs / (rate || 1);
  return fmt(v, c.decimals);
}
const toDisp = (uzs, e) => uzs / (e.rate || 1);
const fromDisp = (v, e) => v * (e.rate || 1);
const symbol = (code, lang) => tr(cur(code), lang) || code;

// ---------------------------------------------------------------------
//  Формулы количества
// ---------------------------------------------------------------------
const up = (x, step) => Math.ceil(x / step - 1e-9) * step;
const r2 = (x) => Math.round(x * 100) / 100;
const FN_OK = ['up', 'r2', 'ceil', 'round', 'max', 'min'];
function evalExpr(expr, v) {
  expr = String(expr || '').trim();
  if (!expr) return 0;
  if (!/^[\sSLNT0-9+\-*/().,a-z]*$/.test(expr)) return 0;
  const names = expr.match(/[a-z]+\d*/g) || [];
  if (names.some((n) => !FN_OK.includes(n))) return 0;
  try {
    const f = new Function('S', 'L', 'N', 'T', 'up', 'r2', 'ceil', 'round', 'max', 'min', `return (${expr});`);
    const r = f(+v.S || 0, +v.L || 0, +v.N || 0, (+v.T || 0) / 1000, up, r2, Math.ceil, Math.round, Math.max, Math.min);
    return isFinite(r) ? Math.max(0, Math.round(r * 1000) / 1000) : 0;
  } catch (e) { return 0; }
}

// ---------------------------------------------------------------------
//  Смета: создание и расчёт
// ---------------------------------------------------------------------
const tplById = (id) => DEFAULT_TEMPLATES.find((x) => x.id === id) || DEFAULT_TEMPLATES[DEFAULT_TEMPLATES.length - 1];
const itemById = (id) => db.catalog.find((x) => x.id === id);

function lineFromItem(item, expr, vars) {
  return {
    uid: uid(), item: item.id, expr: expr || '', manual: !expr,
    name: { ru: item.ru, uz: item.uz }, unit: item.unit, price: item.price, country: item.country || '',
    qty: expr ? evalExpr(expr, vars) : guessQty(item.unit, vars),
  };
}
function guessQty(unit, v) {
  if (unit === 'm2') return +v.S || 1;
  if (unit === 'm' || unit === 'lm') return +v.L || 1;
  return 1;
}

function newEstimate(tplId, form) {
  const tpl = tplById(tplId);
  const vars = { S: 0, L: 0, N: 0, T: 0, ...tpl.defaults, ...form.vars };
  const main = cur(form.currency || 'UZS');
  const usd = cur('USD');
  const e = {
    id: uid(), created: Date.now(), updated: Date.now(), date: today(),
    client: form.client || '', objType: form.objType || 'terrace', tpl: tpl.id, vars,
    currency: main.code, rate: main.rate, currency2: main.code === 'USD' ? 'UZS' : usd.code, rate2: main.code === 'USD' ? 1 : usd.rate,
    showCountry: true, showPerM2: true, showSecond: false, showAdvance: false, advance: 0,
    docLang: db.settings.docLang || L(),
    note: tpl.note ? clone(tpl.note) : { ru: '', uz: '' },
    mats: [], works: [],
  };
  for (const [id, expr] of tpl.mats) { const it = itemById(id); if (it) e.mats.push(lineFromItem(it, expr, vars)); }
  for (const [id, expr] of tpl.works) { const it = itemById(id); if (it) e.works.push(lineFromItem(it, expr, vars)); }
  return e;
}

function recalc(e, force = false) {
  for (const list of [e.mats, e.works]) {
    for (const ln of list) {
      if (ln.expr && (force || !ln.manual)) { ln.qty = evalExpr(ln.expr, e.vars); if (force) ln.manual = false; }
    }
  }
}

function totals(e) {
  const sum = (list) => list.reduce((a, l) => a + (+l.qty || 0) * (+l.price || 0), 0);
  const mat = sum(e.mats);
  const work = sum(e.works);
  const S = +e.vars.S || 0;
  return {
    mat, work, total: mat + work,
    perM2: S ? (mat + work) / S : 0,
    workPerM2: S ? work / S : 0,
    remain: mat + work - (e.showAdvance ? +e.advance || 0 : 0),
  };
}

// ---------------------------------------------------------------------
//  Интерфейс: общие элементы
// ---------------------------------------------------------------------
const view = () => $('#view');

function setTop(title, back) {
  $('#title').textContent = title;
  $('#btn-back').hidden = !back;
  $('#btn-back').onclick = back ? () => { location.hash = back; } : null;
  $('#topbar-extra').innerHTML = '';
}

function setTab(tab) {
  $$('#tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.documentElement.lang = L() === 'uz' ? 'uz' : 'ru';
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

function openSheet(html, onMount) {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-grip"></div>${html}`;
  sh.hidden = false; $('#sheet-backdrop').hidden = false;
  document.body.classList.add('noscroll');
  if (onMount) onMount(sh);
}
function closeSheet() {
  $('#sheet').hidden = true; $('#sheet-backdrop').hidden = true;
  $('#sheet').innerHTML = '';
  document.body.classList.remove('noscroll');
}
$('#sheet-backdrop').addEventListener('click', closeSheet);

const unitOptions = (sel, lang = L()) => Object.keys(UNITS).map((k) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(UNITS[k][lang])}</option>`).join('');
const countryOptions = (sel, lang = L()) => Object.keys(COUNTRIES).map((k) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(COUNTRIES[k][lang] || '—')}</option>`).join('');
const objOptions = (sel) => Object.keys(OBJECT_TYPES).map((k) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(tr(OBJECT_TYPES[k]))}</option>`).join('');
const curOptions = (sel) => db.settings.currencies.map((c) => `<option value="${c.code}"${c.code === sel ? ' selected' : ''}>${esc(c.code)} (${esc(tr(c))})</option>`).join('');

// ---------------------------------------------------------------------
//  Экран: список смет
// ---------------------------------------------------------------------
let listQuery = '';
function renderList() {
  setTop(t('appName')); setTab('list');
  const q = listQuery.trim().toLowerCase();
  const items = db.estimates
    .filter((e) => !q || (e.client || '').toLowerCase().includes(q))
    .sort((a, b) => b.updated - a.updated);
  view().innerHTML = `
    <div class="pad">
      <a class="btn primary big block" href="#/new">+ ${esc(t('newEstimate'))}</a>
      ${db.estimates.length > 3 ? `<input class="search" id="q" type="search" placeholder="${esc(t('search'))}" value="${esc(listQuery)}">` : ''}
      <div class="cards">
        ${items.length ? items.map((e) => {
          const tt = totals(e); const tpl = tplById(e.tpl);
          return `<a class="card est" href="#/e/${e.id}">
            <div class="est-top"><b>${esc(e.client || '—')}</b><span class="muted">${esc(fmtDate(e.date))}</span></div>
            <div class="muted small">${tpl.icon} ${esc(tr(tpl))} · ${fmtQty(+e.vars.S || 0)} ${UNITS.m2[L()]}</div>
            <div class="est-sum">${money(tt.total, e)} ${esc(symbol(e.currency))}</div>
          </a>`;
        }).join('') : `<p class="empty">${esc(t('noEstimates'))}</p>`}
      </div>
    </div>`;
  const qi = $('#q');
  if (qi) qi.addEventListener('input', () => { listQuery = qi.value; const pos = qi.selectionStart; renderList(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); });
}
function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}.${m}.${y}`; }

// ---------------------------------------------------------------------
//  Экран: новая смета
// ---------------------------------------------------------------------
function renderNew(tplId) {
  setTop(t('newEstimate'), tplId ? '#/new' : '#/'); setTab('list');
  if (!tplId) {
    view().innerHTML = `<div class="pad">
      <h2>${esc(t('chooseTemplate'))}</h2>
      <div class="cards">${DEFAULT_TEMPLATES.map((tp) => `
        <a class="card tpl" href="#/new/${tp.id}">
          <span class="tpl-icon">${tp.icon}</span>
          <span><b>${esc(tr(tp))}</b><br><span class="muted small">${esc(L() === 'uz' ? tp.descUz : tp.descRu)}</span></span>
        </a>`).join('')}
      </div></div>`;
    return;
  }
  const tp = tplById(tplId);
  const d = tp.defaults;
  const field = (k, label) => tp.vars.includes(k) ? `
    <label class="fld"><span>${esc(label)}</span><input type="text" inputmode="decimal" name="${k}" value="${d[k] ?? ''}"></label>` : '';
  view().innerHTML = `<div class="pad">
    <div class="card"><b>${tp.icon} ${esc(tr(tp))}</b><div class="muted small">${esc(L() === 'uz' ? tp.descUz : tp.descRu)}</div></div>
    <form id="nf" class="form">
      <label class="fld"><span>${esc(t('client'))}</span><input name="client" placeholder="${esc(t('clientPh'))}" autocomplete="off"></label>
      <label class="fld"><span>${esc(t('objectType'))}</span><select name="objType">${objOptions(tplId.startsWith('bit_vert') ? 'foundation' : tplId === 'roof_insul' ? 'roof' : 'terrace')}</select></label>
      <div class="grid2">
        ${field('S', t('area'))}${field('L', t('perimeter'))}${field('N', t('drains'))}${field('T', t('thickness'))}
      </div>
      <label class="fld"><span>${esc(t('currency'))}</span><select name="currency">${curOptions('UZS')}</select></label>
      <p class="muted small">${esc(t('tplNote'))}</p>
      <button class="btn primary big block" type="submit">${esc(t('create'))}</button>
    </form></div>`;
  const f = $('#nf');
  f.client.focus();
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const vars = {};
    for (const k of tp.vars) vars[k] = parseNum(f[k].value);
    const e = newEstimate(tplId, { client: f.client.value.trim(), objType: f.objType.value, vars, currency: f.currency.value });
    db.estimates.push(e); save(true);
    location.hash = '#/e/' + e.id;
  });
}

// ---------------------------------------------------------------------
//  Экран: редактор сметы
// ---------------------------------------------------------------------
let E = null; // текущая смета

function touch() { E.updated = Date.now(); save(); }

function lineHtml(ln, list, i, n) {
  const dl = E.docLang;
  const sum = (+ln.qty || 0) * (+ln.price || 0);
  const c = cur(E.currency);
  return `<div class="line" data-uid="${ln.uid}" data-list="${list}">
    <div class="line-head">
      <span class="line-no">${i + 1}</span>
      <textarea class="line-name" data-f="name" rows="2">${esc(tr(ln.name, dl))}</textarea>
      <button class="icon-btn small menu" data-act="menu" aria-label="…">⋮</button>
    </div>
    <div class="line-nums">
      <label><span>${esc(t('qty'))}${ln.manual && ln.expr ? ` <i class="badge">${esc(t('manual'))}</i>` : ''}</span>
        <input type="text" inputmode="decimal" data-f="qty" value="${fmtQty(+ln.qty || 0)}"></label>
      <label><span>${esc(t('unit'))}</span><select data-f="unit">${unitOptions(ln.unit, dl)}</select></label>
      <label class="w-price"><span>${esc(t('price'))}, ${esc(symbol(E.currency))}</span>
        <input type="text" inputmode="decimal" data-f="price" value="${fmt(toDisp(+ln.price || 0, E), c.decimals)}"></label>
    </div>
    <div class="line-foot">
      ${list === 'mats' ? `<select class="country" data-f="country">${countryOptions(ln.country, dl)}</select>` : '<span></span>'}
      <b class="line-sum">${money(sum, E)}</b>
    </div>
  </div>`;
}

function renderEditor(id) {
  E = db.estimates.find((x) => x.id === id);
  if (!E) { location.hash = '#/'; return; }
  setTop(E.client || t('estimates'), '#/'); setTab('list');
  const tp = tplById(E.tpl);
  const v = E.vars;
  const dl = E.docLang;
  const varField = (k, label) => `<label class="fld"><span>${esc(label)}</span><input type="text" inputmode="decimal" data-var="${k}" value="${fmtQty(+v[k] || 0)}"></label>`;
  const showVars = new Set([...tp.vars, 'S']);
  view().innerHTML = `<div class="pad editor">
    <section class="card">
      <label class="fld"><span>${esc(t('client'))}</span><input data-e="client" value="${esc(E.client)}" placeholder="${esc(t('clientPh'))}"></label>
      <div class="grid2">
        <label class="fld"><span>${esc(t('objectType'))}</span><select data-e="objType">${objOptions(E.objType)}</select></label>
        <label class="fld"><span>${esc(t('date'))}</span><input type="date" data-e="date" value="${esc(E.date)}"></label>
      </div>
      <div class="grid2">
        ${varField('S', t('area'))}
        ${showVars.has('L') ? varField('L', t('perimeter')) : ''}
        ${showVars.has('N') ? varField('N', t('drains')) : ''}
        ${showVars.has('T') ? varField('T', t('thickness')) : ''}
      </div>
      <p class="muted small">${esc(t('recalcHint'))}</p>
    </section>

    <section class="card">
      <div class="grid2">
        <label class="fld"><span>${esc(t('currency'))}</span><select data-e="currency">${curOptions(E.currency)}</select></label>
        <label class="fld" ${E.currency === 'UZS' ? 'hidden' : ''}><span>1 ${esc(E.currency)} = … ${esc(symbol('UZS'))}</span>
          <input type="text" inputmode="decimal" data-e="rate" value="${fmt(E.rate, 2)}"></label>
      </div>
      <div class="seg" role="group" aria-label="${esc(t('docLang'))}">
        <span class="muted small">${esc(t('docLang'))}:</span>
        <button class="${dl === 'ru' ? 'on' : ''}" data-doclang="ru">Русский</button>
        <button class="${dl === 'uz' ? 'on' : ''}" data-doclang="uz">O'zbekcha</button>
      </div>
    </section>

    <h2 class="sec-title">${esc(t('materials'))} <span class="muted small">${E.mats.length} ${esc(t('items'))}</span></h2>
    <div class="lines" id="mats">${E.mats.map((ln, i) => lineHtml(ln, 'mats', i, E.mats.length)).join('')}</div>
    <button class="btn block ghost" data-add="mats">${esc(t('addLine'))}</button>
    <div class="subtotal">${esc(t('totalMat'))}: <b id="tot-mat"></b></div>

    <h2 class="sec-title">${esc(t('works'))} <span class="muted small">${E.works.length} ${esc(t('items'))}</span></h2>
    <div class="lines" id="works">${E.works.map((ln, i) => lineHtml(ln, 'works', i, E.works.length)).join('')}</div>
    <button class="btn block ghost" data-add="works">${esc(t('addLine'))}</button>
    <div class="subtotal">${esc(t('totalWork'))}: <b id="tot-work"></b></div>

    <section class="card">
      <label class="fld"><span>${esc(t('note'))} (${dl === 'uz' ? "O'zbekcha" : 'Русский'})</span>
        <textarea data-e="note" rows="2" placeholder="${esc(t('notePh'))}">${esc(tr(E.note, dl))}</textarea></label>
      <h3>${esc(t('options'))}</h3>
      <label class="chk"><input type="checkbox" data-e="showCountry" ${E.showCountry ? 'checked' : ''}> ${esc(t('showCountry'))}</label>
      <label class="chk"><input type="checkbox" data-e="showPerM2" ${E.showPerM2 ? 'checked' : ''}> ${esc(t('showPerM2'))}</label>
      <label class="chk"><input type="checkbox" data-e="showSecond" ${E.showSecond ? 'checked' : ''}> ${esc(t('showSecond'))}</label>
      <div class="grid2" ${E.showSecond ? '' : 'hidden'} id="second-box">
        <label class="fld"><span>${esc(t('secondCurrency'))}</span><select data-e="currency2">${curOptions(E.currency2)}</select></label>
        <label class="fld" ${E.currency2 === 'UZS' ? 'hidden' : ''}><span>1 ${esc(E.currency2)} = … ${esc(symbol('UZS'))}</span>
          <input type="text" inputmode="decimal" data-e="rate2" value="${fmt(E.rate2, 2)}"></label>
      </div>
      <label class="chk"><input type="checkbox" data-e="showAdvance" ${E.showAdvance ? 'checked' : ''}> ${esc(t('showAdvance'))}</label>
      <label class="fld" ${E.showAdvance ? '' : 'hidden'} id="adv-box"><span>${esc(t('paid'))}, ${esc(symbol(E.currency))}</span>
        <input type="text" inputmode="decimal" data-e="advance" value="${fmt(toDisp(+E.advance || 0, E), cur(E.currency).decimals)}"></label>
      <button class="btn block ghost" data-act="recalcAll">↻ ${esc(t('recalcAll'))}</button>
    </section>

    <section class="actions">
      <button class="btn primary big" data-act="pdf">📄 ${esc(t('share'))}</button>
      <button class="btn big" data-act="print">🖨️ ${esc(t('print'))}</button>
      <button class="btn big" data-act="act">✍️ ${esc(t('act'))}</button>
      <button class="btn big" data-act="dup">⧉ ${esc(t('duplicate'))}</button>
      <button class="btn big danger" data-act="delete">🗑 ${esc(t('deleteEstimate'))}</button>
    </section>
  </div>
  <div class="totalbar" id="totalbar"></div>`;
  updateTotals();
  bindEditor();
}

function updateTotals() {
  const tt = totals(E);
  const sym = esc(symbol(E.currency));
  $('#tot-mat').textContent = `${money(tt.mat, E)} ${symbol(E.currency)}`;
  $('#tot-work').textContent = `${money(tt.work, E)} ${symbol(E.currency)}`;
  $('#totalbar').innerHTML = `
    <div><span class="muted small">${esc(t('total'))}</span><b>${money(tt.total, E)} ${sym}</b></div>
    ${+E.vars.S ? `<div class="r"><span class="muted small">${esc(t('perM2'))}</span><b>${money(tt.perM2, E)}</b></div>` : ''}`;
}

function findLine(el) {
  const box = el.closest('.line');
  if (!box) return null;
  const list = E[box.dataset.list];
  const idx = list.findIndex((l) => l.uid === box.dataset.uid);
  return { box, list, idx, ln: list[idx], listName: box.dataset.list };
}

function bindEditor() {
  const root = view();
  root.oninput = (ev) => {
    const el = ev.target;
    // поля строки
    if (el.dataset.f) {
      const f = findLine(el); if (!f) return;
      const { ln, box } = f;
      if (el.dataset.f === 'name') { ln.name = { ...ln.name, [E.docLang]: el.value }; if (!ln.item) ln.name = { ru: ln.name.ru || el.value, uz: ln.name.uz || el.value, [E.docLang]: el.value }; }
      if (el.dataset.f === 'qty') { ln.qty = parseNum(el.value); ln.manual = true; }
      if (el.dataset.f === 'price') ln.price = fromDisp(parseNum(el.value), E);
      if (el.dataset.f === 'unit') ln.unit = el.value;
      if (el.dataset.f === 'country') ln.country = el.value;
      $('.line-sum', box).textContent = money((+ln.qty || 0) * (+ln.price || 0), E);
      updateTotals(); touch();
      return;
    }
    // параметры объекта S, L, N, T — пересчитываем количества
    if (el.dataset.var) {
      E.vars[el.dataset.var] = parseNum(el.value);
      recalc(E);
      for (const list of ['mats', 'works']) for (const ln of E[list]) {
        if (!ln.expr || ln.manual) continue;
        const inp = $(`.line[data-uid="${ln.uid}"] [data-f="qty"]`);
        if (inp) inp.value = fmtQty(ln.qty);
        const s = $(`.line[data-uid="${ln.uid}"] .line-sum`);
        if (s) s.textContent = money(ln.qty * ln.price, E);
      }
      updateTotals(); touch();
      return;
    }
    const k = el.dataset.e;
    if (!k) return;
    if (k === 'client') { E.client = el.value; $('#title').textContent = el.value || t('estimates'); }
    else if (k === 'date' || k === 'objType') E[k] = el.value;
    else if (k === 'note') E.note = { ...E.note, [E.docLang]: el.value };
    else if (k === 'rate') { E.rate = parseNum(el.value) || 1; refreshNumbers(); }
    else if (k === 'rate2') E.rate2 = parseNum(el.value) || 1;
    else if (k === 'advance') E.advance = fromDisp(parseNum(el.value), E);
    else if (el.type === 'checkbox') {
      E[k] = el.checked;
      if (k === 'showSecond') $('#second-box').hidden = !el.checked;
      if (k === 'showAdvance') $('#adv-box').hidden = !el.checked;
    }
    updateTotals(); touch();
  };
  root.onchange = (ev) => {
    const el = ev.target;
    if (el.dataset.e === 'currency') {
      const c = cur(el.value); E.currency = c.code; E.rate = c.rate; touch(); renderEditor(E.id);
    } else if (el.dataset.e === 'currency2') {
      const c = cur(el.value); E.currency2 = c.code; E.rate2 = c.rate; touch(); renderEditor(E.id);
    } else if (el.dataset.f === 'qty' || el.dataset.f === 'price') {
      // красиво отформатировать после ввода
      const f = findLine(el); if (!f) return;
      if (el.dataset.f === 'qty') el.value = fmtQty(f.ln.qty);
      else el.value = fmt(toDisp(f.ln.price, E), cur(E.currency).decimals);
    } else if (el.dataset.f === 'name') {
      // при первом вводе в свою строку название попадает в оба языка
    }
  };
  root.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.doclang) { E.docLang = b.dataset.doclang; touch(); renderEditor(E.id); return; }
    if (b.dataset.add) { pickItem(b.dataset.add); return; }
    const act = b.dataset.act;
    if (act === 'menu') { lineMenu(findLine(b)); return; }
    if (act === 'recalcAll') { recalc(E, true); touch(); renderEditor(E.id); toast('↻'); return; }
    if (act === 'pdf') { makeEstimatePdf(E); return; }
    if (act === 'print') { printHtml(estimateDocHtml(E)); return; }
    if (act === 'act') { actForm(E); return; }
    if (act === 'dup') {
      const c = clone(E); c.id = uid(); c.created = c.updated = Date.now(); c.date = today();
      c.client = (c.client || '') + ' (2)';
      c.mats.forEach((l) => { l.uid = uid(); }); c.works.forEach((l) => { l.uid = uid(); });
      db.estimates.push(c); save(true); toast(t('copied')); location.hash = '#/e/' + c.id; return;
    }
    if (act === 'delete') {
      if (confirm(t('confirmDelete'))) { db.estimates = db.estimates.filter((x) => x.id !== E.id); save(true); location.hash = '#/'; }
    }
  };
}

function refreshNumbers() {
  const dec = cur(E.currency).decimals;
  for (const list of ['mats', 'works']) for (const ln of E[list]) {
    const box = $(`.line[data-uid="${ln.uid}"]`); if (!box) continue;
    $('[data-f="price"]', box).value = fmt(toDisp(ln.price, E), dec);
    $('.line-sum', box).textContent = money(ln.qty * ln.price, E);
  }
}

function lineMenu(f) {
  if (!f) return;
  const { list, idx, ln } = f;
  openSheet(`
    <h3>${esc(tr(ln.name, E.docLang))}</h3>
    <div class="menu-list">
      <button data-m="up" ${idx === 0 ? 'disabled' : ''}>↑ ${esc(t('moveUp'))}</button>
      <button data-m="down" ${idx === list.length - 1 ? 'disabled' : ''}>↓ ${esc(t('moveDown'))}</button>
      ${ln.expr && ln.manual ? `<button data-m="auto">↻ ${esc(t('recalc'))}</button>` : ''}
      <button data-m="del" class="danger">🗑 ${esc(t('del'))}</button>
      <button data-m="close">${esc(t('cancel'))}</button>
    </div>`, (sh) => {
    sh.onclick = (ev) => {
      const m = ev.target.closest('button')?.dataset.m; if (!m) return;
      if (m === 'up' && idx > 0) [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
      if (m === 'down' && idx < list.length - 1) [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]];
      if (m === 'auto') { ln.manual = false; ln.qty = evalExpr(ln.expr, E.vars); }
      if (m === 'del') list.splice(idx, 1);
      closeSheet();
      if (m !== 'close') { touch(); renderEditor(E.id); }
    };
  });
}

function pickItem(listName) {
  const kind = listName === 'mats' ? 'mat' : 'work';
  const items = db.catalog.filter((i) => i.kind === kind);
  const dl = E.docLang;
  const render = (q) => {
    q = q.trim().toLowerCase();
    const res = items.filter((i) => !q || (i.ru + ' ' + i.uz).toLowerCase().includes(q));
    return res.length ? res.map((i) => `<button class="pick" data-id="${i.id}"><span>${esc(tr(i, dl))}</span><span class="muted small">${money(i.price, E)} ${esc(symbol(E.currency))} / ${esc(UNITS[i.unit]?.[L()] || i.unit)}</span></button>`).join('')
      : `<p class="empty">${esc(t('noResults'))}</p>`;
  };
  openSheet(`
    <h3>${esc(t('pickItem'))}</h3>
    <input class="search" id="pq" type="search" placeholder="${esc(t('search').replace('клиенту', '').replace("Mijoz bo'yicha ", ''))}">
    <button class="btn block ghost" id="custom">✏️ ${esc(t('customLine'))}</button>
    <div class="pick-list" id="pl">${render('')}</div>`, (sh) => {
    const pq = $('#pq', sh);
    pq.addEventListener('input', () => { $('#pl', sh).innerHTML = render(pq.value); });
    $('#custom', sh).onclick = () => {
      E[listName].push({ uid: uid(), item: null, expr: '', manual: true, name: { ru: '', uz: '' }, unit: kind === 'mat' ? 'pcs' : 'm2', qty: 1, price: 0, country: '' });
      closeSheet(); touch(); renderEditor(E.id); focusLast(listName);
    };
    $('#pl', sh).onclick = (ev) => {
      const b = ev.target.closest('.pick'); if (!b) return;
      E[listName].push(lineFromItem(itemById(b.dataset.id), '', E.vars));
      closeSheet(); touch(); renderEditor(E.id); focusLast(listName);
    };
  });
}
function focusLast(listName) {
  const lines = $$(`#${listName} .line`);
  const last = lines[lines.length - 1];
  if (last) { last.scrollIntoView({ block: 'center' }); last.classList.add('flash'); const n = $('.line-name', last); if (n && !n.value) n.focus(); }
}

// ---------------------------------------------------------------------
//  Документ сметы (для PDF и печати)
// ---------------------------------------------------------------------
function estimateDocHtml(e) {
  const dl = e.docLang;
  const D = DOC[dl];
  const tt = totals(e);
  const c = cur(e.currency);
  const sym = symbol(e.currency, dl);
  const m = (v) => money(v, e);
  const S = +e.vars.S || 0, Lv = +e.vars.L || 0;
  const co = db.settings.company;
  const obj = tr(OBJECT_TYPES[e.objType], dl);
  const meta = [S ? `S = ${fmtQty(S)} ${UNITS.m2[dl]}` : '', Lv ? `L = ${fmtQty(Lv)} ${UNITS.m[dl]}` : '', obj].filter(Boolean).join('   ');
  const rows = (list, withCountry) => list.map((l, i) => `<tr>
    <td class="c">${i + 1}</td><td>${esc(tr(l.name, dl))}</td><td class="c">${esc(UNITS[l.unit]?.[dl] || l.unit)}</td>
    <td class="n">${fmtQty(+l.qty || 0)}</td><td class="n">${m(+l.price || 0)}</td><td class="n">${m((+l.qty || 0) * (+l.price || 0))}</td>
    ${withCountry ? `<td class="c">${esc(COUNTRIES[l.country]?.[dl] || '')}</td>` : ''}</tr>`).join('');
  const sc = e.showCountry && e.mats.some((l) => l.country);
  const second = e.showSecond && e.currency2 && e.currency2 !== e.currency;
  const m2 = (v) => fmt(v / (e.currency2 === 'UZS' ? 1 : e.rate2 || 1), cur(e.currency2).decimals);
  const head = db.settings.showContacts && (co.name || co.phone)
    ? `<div class="d-company"><b>${esc(co.name)}</b>${co.phone ? ` · ${D.phone} ${esc(co.phone)}` : ''}</div>` : '';
  const note = tr(e.note, dl);
  return `<div class="doc">
    ${head}
    <div class="d-title">${esc(e.client || D.estimate)}</div>
    <div class="d-meta"><span>${esc(fmtDate(e.date))}</span><span>${esc(meta)}</span></div>
    ${e.mats.length ? `<table class="d-table">
      <thead><tr><th>${D.no}</th><th>${D.matName}</th><th>${D.unit}</th><th>${D.qty}</th><th>${D.price}</th><th>${D.sumSupply}</th>${sc ? `<th>${D.country}</th>` : ''}</tr></thead>
      <tbody>${rows(e.mats, sc)}</tbody>
      <tfoot><tr><td colspan="5" class="r">${D.totalMat}</td><td class="n">${m(tt.mat)}</td>${sc ? '<td></td>' : ''}</tr></tfoot>
    </table>` : ''}
    ${e.works.length ? `<table class="d-table">
      <thead><tr><th>${D.no}</th><th>${D.workName}</th><th>${D.unit}</th><th>${D.qty}</th><th>${D.price}</th><th>${D.sum}</th></tr></thead>
      <tbody>${rows(e.works, false)}</tbody>
      <tfoot><tr><td colspan="5" class="r">${D.totalWork}</td><td class="n">${m(tt.work)}</td></tr>
      ${e.showPerM2 && S ? `<tr class="sub"><td colspan="5" class="r">${D.workPerM2}</td><td class="n">${m(tt.workPerM2)}</td></tr>` : ''}</tfoot>
    </table>` : ''}
    ${note ? `<div class="d-note">${esc(note)}</div>` : ''}
    <table class="d-sum">
      ${e.showPerM2 && S ? `<tr><td>${D.perM2}:</td><td class="n">${m(tt.perM2)} ${esc(sym)}</td></tr>` : ''}
      <tr class="big"><td>${D.total}:</td><td class="n">${m(tt.total)} ${esc(sym)}</td></tr>
      ${e.showAdvance && +e.advance ? `<tr><td>${D.paid}:</td><td class="n">${m(+e.advance)} ${esc(sym)}</td></tr>
        <tr class="big"><td>${D.remain}:</td><td class="n">${m(tt.remain)} ${esc(sym)}</td></tr>` : ''}
    </table>
    ${second ? `<table class="d-sum second">
      <tr><td colspan="2"><b>${D.inCurrency} ${esc(e.currency2)}</b>${e.currency2 !== 'UZS' ? ` (1 ${esc(e.currency2)} = ${fmt(e.rate2, 2)} ${esc(symbol('UZS', dl))})` : ''}</td></tr>
      <tr><td>${D.totalMat}:</td><td class="n">${m2(tt.mat)} ${esc(symbol(e.currency2, dl))}</td></tr>
      <tr><td>${D.totalWork}:</td><td class="n">${m2(tt.work)} ${esc(symbol(e.currency2, dl))}</td></tr>
      <tr class="big"><td>${D.total}:</td><td class="n">${m2(tt.total)} ${esc(symbol(e.currency2, dl))}</td></tr>
    </table>` : ''}
    <div class="d-foot">${D.allPricesIn} ${esc(c.code)} (${esc(sym)})</div>
  </div>`;
}

// ---------------------------------------------------------------------
//  Акт выполненных работ
// ---------------------------------------------------------------------
function actForm(e) {
  const dl = e.docLang;
  const tt = totals(e);
  const kind = `${tr(TPL_KIND[e.tpl] || TPL_KIND.blank, dl)} ${tr(OBJ_ON[e.objType] || OBJ_ON.other, dl)}`.trim();
  const co = db.settings.company;
  const c = cur(e.currency);
  openSheet(`
    <h3>${esc(t('actTitle'))} (${dl === 'uz' ? "O'zbekcha" : 'Русский'})</h3>
    ${!co.name ? `<p class="warn small">⚠️ ${esc(t('company'))}: <a href="#/settings" id="go-set">${esc(t('settings'))}</a></p>` : ''}
    <form id="af" class="form">
      <label class="fld"><span>${esc(t('customerFio'))}</span><input name="customer" value="${esc(e.act?.customer || '')}"></label>
      <label class="fld"><span>${esc(t('objectAddress'))}</span><input name="address" value="${esc(e.act?.address || '')}"></label>
      <label class="fld"><span>${esc(t('workKind'))}</span><input name="kind" value="${esc(e.act?.kind?.[dl] || kind)}"></label>
      <div class="grid2">
        <label class="fld"><span>${esc(t('volume'))}</span><input name="volume" inputmode="decimal" value="${fmtQty(+e.vars.S || 0)}"></label>
        <label class="fld"><span>${esc(t('warranty'))}</span><input name="warranty" inputmode="numeric" value="${e.act?.warranty ?? db.settings.warranty}"></label>
      </div>
      <div class="grid2">
        <label class="fld"><span>${esc(t('amount'))}, ${esc(symbol(e.currency))}</span><input name="amount" inputmode="decimal" value="${fmt(toDisp(tt.total, e), c.decimals)}"></label>
        <label class="fld"><span>${esc(t('date'))}</span><input name="date" type="date" value="${esc(e.act?.date || today())}"></label>
      </div>
      <button class="btn primary big block" type="submit">📄 ${esc(t('makeAct'))}</button>
      <button class="btn block" type="button" id="act-print">🖨️ ${esc(t('print'))}</button>
    </form>`, (sh) => {
    const go = $('#go-set', sh); if (go) go.onclick = closeSheet;
    const f = $('#af', sh);
    const collect = () => {
      e.act = {
        customer: f.customer.value.trim(), address: f.address.value.trim(),
        kind: { ...(e.act?.kind || {}), [dl]: f.kind.value.trim() },
        warranty: parseNum(f.warranty.value), date: f.date.value,
      };
      touch();
      return { ...e.act, kind: f.kind.value.trim(), volume: parseNum(f.volume.value), amount: parseNum(f.amount.value) };
    };
    f.addEventListener('submit', (ev) => { ev.preventDefault(); const a = collect(); closeSheet(); makePdf(actDocHtml(e, a), fileName(`Акт ${e.client || ''}`)); });
    $('#act-print', sh).onclick = () => { const a = collect(); closeSheet(); printHtml(actDocHtml(e, a)); };
  });
}

function actDocHtml(e, a) {
  const dl = e.docLang;
  const D = DOC[dl];
  const co = db.settings.company;
  const c = cur(e.currency);
  const amountTxt = `${fmt(a.amount, c.decimals).replace(/ /g, '.')}`;
  const words = amountInWords(a.amount, c.code, dl);
  const wWords = dl === 'uz' ? wordsUz(a.warranty) : wordsRu(a.warranty);
  const short = co.short || co.name || '______________';
  const line = (label, val) => val ? `<div>${esc(label)}: ${esc(val)}</div>` : '';
  return `<div class="doc act">
    <div class="a-head">
      ${co.name ? `<div class="a-name">${esc(co.name)}</div>` : ''}
      <div>${D.to}: ${esc(a.customer || '______________')}</div>
      <div>${D.from}: ${esc(co.nameLatin || co.name || '______________')}</div>
      ${line(D.address, co.address)}
      ${line(D.passport, co.passport)}
      ${line(D.issued, co.passportIssued)}
      ${line(D.phoneFull, co.phone)}
      ${line(D.pinfl, co.pinfl)}
      ${co.license ? `<div>${esc(D.license)}: ${esc(co.license)}; ${D.activity}</div>` : ''}
    </div>
    <p>${esc(D.actBody({ short, kind: a.kind, address: a.address || '______________' }))}</p>
    <p>${esc(D.actKind({ kind: a.kind, volume: fmtQty(a.volume) }))}</p>
    <p>${esc(D.actSum({ amount: `${amountTxt} ${symbol(c.code, dl)}`, words }))}</p>
    <p>${esc(D.actNoClaims)}</p>
    ${a.warranty ? `<p>${esc(D.actWarranty(a.warranty, wWords))}</p>` : ''}
    <div class="a-sign">
      <div>${D.dateLine}: ${a.date ? esc(fmtDate(a.date)) : '______________'}</div>
      <div class="a-sign-row"><span>${D.contractorSign}: ______________</span><span>${D.customerSign}: ______________</span></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
//  PDF, печать, отправка
// ---------------------------------------------------------------------
function fileName(base) { return (base.trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ') || 'smeta') + '.pdf'; }

function printHtml(html) {
  const root = $('#print-root');
  root.innerHTML = html;
  document.body.classList.add('printing');
  setTimeout(() => { window.print(); }, 50);
}
window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); $('#print-root').innerHTML = ''; });

function makeEstimatePdf(e) { makePdf(estimateDocHtml(e), fileName(`${tr({ ru: 'Смета', uz: 'Smeta' }, e.docLang)} ${e.client || ''}`)); }

async function makePdf(html, name) {
  if (typeof html2pdf === 'undefined') { printHtml(html); return; } // нет библиотеки (первый запуск без сети) — печать в PDF
  toast(t('preparing'));
  const root = $('#print-root');
  root.innerHTML = html;
  root.classList.add('rendering');
  try {
    const el = root.firstElementChild;
    const worker = html2pdf().set({
      margin: [8, 8, 10, 8], filename: name,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.d-sum', '.a-sign'] },
    }).from(el);
    const blob = await worker.outputPdf('blob');
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); } catch (err) { if (err.name !== 'AbortError') downloadBlob(blob, name); }
    } else downloadBlob(blob, name);
  } catch (err) {
    toast('⚠️ PDF: ' + err.message);
  } finally {
    root.classList.remove('rendering');
    root.innerHTML = '';
  }
}
function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------------------------------------------------------------------
//  Экран: справочник цен
// ---------------------------------------------------------------------
let priceKind = 'mat', priceQuery = '';
function renderPrices() {
  setTop(t('catalogTitle')); setTab('prices');
  const items = db.catalog.filter((i) => i.kind === priceKind)
    .filter((i) => !priceQuery || (i.ru + ' ' + i.uz).toLowerCase().includes(priceQuery.toLowerCase()));
  view().innerHTML = `<div class="pad">
    <div class="seg wide">
      <button class="${priceKind === 'mat' ? 'on' : ''}" data-kind="mat">${esc(t('materials'))}</button>
      <button class="${priceKind === 'work' ? 'on' : ''}" data-kind="work">${esc(t('works'))}</button>
    </div>
    <input class="search" id="prq" type="search" placeholder="${esc(t('search').replace('клиенту', '').replace("Mijoz bo'yicha ", ''))}" value="${esc(priceQuery)}">
    <p class="muted small">${esc(t('catalogHint'))}</p>
    <div class="price-list">${items.map((i) => `
      <div class="price-row" data-id="${i.id}">
        <button class="price-name" data-edit="${i.id}">${esc(tr(i))}<span class="muted small"> · ${esc(UNITS[i.unit]?.[L()] || i.unit)}${i.country ? ' · ' + esc(COUNTRIES[i.country]?.[L()] || '') : ''}</span></button>
        <input type="text" inputmode="decimal" data-price="${i.id}" value="${fmt(i.price)}" aria-label="${esc(t('price'))}">
      </div>`).join('') || `<p class="empty">${esc(t('noResults'))}</p>`}</div>
    <button class="btn block primary" id="add-item">${esc(t('addItem'))}</button>
    <p class="muted small">${esc(t('price'))}: ${esc(symbol('UZS'))}</p>
  </div>`;
  const root = view();
  root.oninput = (ev) => {
    const el = ev.target;
    if (el.dataset.price) { const it = itemById(el.dataset.price); it.price = parseNum(el.value); save(); }
    if (el.id === 'prq') { priceQuery = el.value; const pos = el.selectionStart; renderPrices(); const n = $('#prq'); n.focus(); n.setSelectionRange(pos, pos); }
  };
  root.onchange = (ev) => { const el = ev.target; if (el.dataset.price) el.value = fmt(itemById(el.dataset.price).price); };
  root.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.kind) { priceKind = b.dataset.kind; renderPrices(); }
    if (b.dataset.edit) editItem(itemById(b.dataset.edit));
    if (b.id === 'add-item') editItem(null);
  };
}

function editItem(it) {
  const isNew = !it;
  const x = it ? clone(it) : { id: 'u_' + uid(), kind: priceKind, ru: '', uz: '', unit: priceKind === 'mat' ? 'pcs' : 'm2', price: 0, country: '' };
  openSheet(`
    <h3>${isNew ? esc(t('addItem')) : esc(t('edit'))}</h3>
    <form id="itf" class="form">
      <div class="seg wide">
        <label><input type="radio" name="kind" value="mat" ${x.kind === 'mat' ? 'checked' : ''}> ${esc(t('kindMat'))}</label>
        <label><input type="radio" name="kind" value="work" ${x.kind === 'work' ? 'checked' : ''}> ${esc(t('kindWork'))}</label>
      </div>
      <label class="fld"><span>${esc(t('nameRu'))}</span><textarea name="ru" rows="2" required>${esc(x.ru)}</textarea></label>
      <label class="fld"><span>${esc(t('nameUz'))}</span><textarea name="uz" rows="2">${esc(x.uz)}</textarea></label>
      <div class="grid2">
        <label class="fld"><span>${esc(t('unit'))}</span><select name="unit">${unitOptions(x.unit)}</select></label>
        <label class="fld"><span>${esc(t('price'))}, ${esc(symbol('UZS'))}</span><input name="price" inputmode="decimal" value="${fmt(x.price)}"></label>
      </div>
      <label class="fld"><span>${esc(t('country'))}</span><select name="country">${countryOptions(x.country)}</select></label>
      <button class="btn primary big block" type="submit">${esc(t('save'))}</button>
      ${!isNew ? `<button class="btn block danger" type="button" id="del-item">🗑 ${esc(t('del'))}</button>` : ''}
    </form>`, (sh) => {
    const f = $('#itf', sh);
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      Object.assign(x, { kind: f.kind.value, ru: f.ru.value.trim(), uz: f.uz.value.trim() || f.ru.value.trim(), unit: f.unit.value, price: parseNum(f.price.value), country: f.country.value });
      if (isNew) db.catalog.push(x); else Object.assign(it, x);
      save(true); closeSheet(); toast(t('saved')); renderPrices();
    });
    const d = $('#del-item', sh);
    if (d) d.onclick = () => { if (confirm(t('del') + '?')) { db.catalog = db.catalog.filter((i) => i.id !== it.id); save(true); closeSheet(); renderPrices(); } };
  });
}

// ---------------------------------------------------------------------
//  Экран: настройки
// ---------------------------------------------------------------------
function renderSettings() {
  setTop(t('settings')); setTab('settings');
  const s = db.settings;
  const co = s.company;
  const cf = (k, label, ph = '') => `<label class="fld"><span>${esc(label)}</span><input data-co="${k}" value="${esc(co[k])}" placeholder="${esc(ph)}"></label>`;
  view().innerHTML = `<div class="pad">
    <section class="card">
      <h3>${esc(t('language'))}</h3>
      <div class="seg wide">
        <button class="${s.lang === 'ru' ? 'on' : ''}" data-lang="ru">Русский</button>
        <button class="${s.lang === 'uz' ? 'on' : ''}" data-lang="uz">O'zbekcha</button>
      </div>
      <h3>${esc(t('docLang'))}</h3>
      <div class="seg wide">
        <button class="${s.docLang === 'ru' ? 'on' : ''}" data-doclang="ru">Русский</button>
        <button class="${s.docLang === 'uz' ? 'on' : ''}" data-doclang="uz">O'zbekcha</button>
      </div>
    </section>

    <section class="card">
      <h3>${esc(t('currencies'))}</h3>
      <p class="muted small">${esc(t('rateHint'))}</p>
      <div class="cur-list">
        <div class="cur-row head"><span>${esc(t('code'))}</span><span>${esc(t('symbol'))}</span><span>${esc(t('rate'))}</span><span></span></div>
        ${s.currencies.map((c, i) => `<div class="cur-row" data-i="${i}">
          <input data-cur="code" value="${esc(c.code)}" ${c.code === 'UZS' ? 'readonly' : ''} maxlength="4">
          <input data-cur="sym" value="${esc(c.ru)}">
          <input data-cur="rate" inputmode="decimal" value="${fmt(c.rate, 2)}" ${c.code === 'UZS' ? 'readonly' : ''}>
          ${c.code === 'UZS' ? '<span></span>' : `<button class="icon-btn small" data-delcur="${i}" aria-label="${esc(t('del'))}">✕</button>`}
        </div>`).join('')}
      </div>
      <button class="btn block ghost" id="add-cur">${esc(t('addCurrency'))}</button>
    </section>

    <section class="card">
      <h3>${esc(t('company'))}</h3>
      ${cf('name', t('companyName'), 'ИП ИВАНОВ И.И.')}
      ${cf('nameLatin', t('companyNameLatin'), 'YATT IVANOV IVAN')}
      ${cf('short', 'Ф.И.О. кратко / F.I.Sh. qisqa', 'Иванов И.И.')}
      ${cf('phone', t('phone'), '+998 90 000 00 00')}
      ${cf('address', t('address'))}
      ${cf('passport', t('passport'))}
      ${cf('passportIssued', t('passportIssued'))}
      ${cf('pinfl', t('pinfl'))}
      ${cf('license', t('license'))}
      <label class="chk"><input type="checkbox" id="showContacts" ${s.showContacts ? 'checked' : ''}> ${esc(t('showContacts'))}</label>
      <label class="fld"><span>${esc(t('warrantyDefault'))}</span><input id="warranty" inputmode="numeric" value="${s.warranty}"></label>
    </section>

    <section class="card">
      <h3>${esc(t('backup'))}</h3>
      <button class="btn block" id="exp">💾 ${esc(t('exportData'))}</button>
      <label class="btn block">📂 ${esc(t('importData'))}<input type="file" id="imp" accept=".json,application/json" hidden></label>
      <button class="btn block ghost" id="reset-prices">↺ ${esc(t('resetPrices'))}</button>
    </section>

    <section class="card">
      <h3>📱 ${esc(t('install'))}</h3>
      <p class="muted small">${esc(t('installHint'))}</p>
      <button class="btn block primary" id="install-btn" hidden>${esc(t('install'))}</button>
    </section>
  </div>`;
  const root = view();
  if (deferredInstall) $('#install-btn').hidden = false;
  root.oninput = (ev) => {
    const el = ev.target;
    if (el.dataset.co) { co[el.dataset.co] = el.value; save(); }
    if (el.dataset.cur) {
      const c = s.currencies[+el.closest('.cur-row').dataset.i];
      if (el.dataset.cur === 'code') c.code = el.value.toUpperCase().trim();
      if (el.dataset.cur === 'sym') { c.ru = el.value; c.uz = el.value; }
      if (el.dataset.cur === 'rate') c.rate = parseNum(el.value) || 1;
      save();
    }
    if (el.id === 'warranty') { s.warranty = parseNum(el.value); save(); }
    if (el.id === 'showContacts') { s.showContacts = el.checked; save(); }
  };
  root.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.lang) { s.lang = b.dataset.lang; save(true); renderSettings(); }
    if (b.dataset.doclang) { s.docLang = b.dataset.doclang; save(true); renderSettings(); }
    if (b.dataset.delcur) { s.currencies.splice(+b.dataset.delcur, 1); save(true); renderSettings(); }
    if (b.id === 'add-cur') { s.currencies.push({ code: 'KZT', ru: '₸', uz: '₸', rate: 25, decimals: 0 }); save(true); renderSettings(); }
    if (b.id === 'exp') exportData();
    if (b.id === 'reset-prices' && confirm(t('confirmReset'))) {
      for (const d of DEFAULT_CATALOG) { const it = itemById(d.id); if (it) Object.assign(it, clone(d)); }
      save(true); toast(t('saved'));
    }
    if (b.id === 'install-btn' && deferredInstall) { deferredInstall.prompt(); deferredInstall = null; b.hidden = true; }
  };
  $('#imp').addEventListener('change', importData);
}

function exportData() {
  save(true);
  const blob = new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' });
  const name = `smeta-backup-${today()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(() => downloadBlob(blob, name));
  else downloadBlob(blob, name);
}
function importData(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (d.v !== 1 || !Array.isArray(d.estimates) || !Array.isArray(d.catalog)) throw new Error('bad');
      db = d; save(true); load(); toast(t('importOk')); renderSettings();
    } catch (e) { toast(t('importBad')); }
  };
  r.readAsText(f);
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; const b = $('#install-btn'); if (b) b.hidden = false; });

// ---------------------------------------------------------------------
//  Маршруты
// ---------------------------------------------------------------------
function route() {
  closeSheet();
  view().onclick = view().oninput = view().onchange = null;
  document.body.classList.remove('has-totalbar');
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (a === 'new') renderNew(b);
  else if (a === 'e' && b) { renderEditor(b); document.body.classList.add('has-totalbar'); }
  else if (a === 'prices') renderPrices();
  else if (a === 'settings') renderSettings();
  else renderList();
  window.scrollTo(0, 0);
}

load();
window.addEventListener('hashchange', route);
route();
