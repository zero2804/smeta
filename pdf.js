'use strict';
// =====================================================================
//  PDF сметы и акта — настоящий документ с текстом (jsPDF + autoTable),
//  без «фотографирования» страницы. Шрифт DejaVu Sans Condensed — кириллица и латиница.
// =====================================================================

let pdfFontData = null;
async function loadPdfFonts() {
  if (pdfFontData) return pdfFontData;
  const toB64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const [r, b] = await Promise.all(['vendor/DejaVuSansCondensed.ttf', 'vendor/DejaVuSansCondensed-Bold.ttf'].map(async (u) => {
    const res = await fetch(u);
    if (!res.ok) throw new Error('font ' + res.status);
    return toB64(await res.arrayBuffer());
  }));
  pdfFontData = { r, b };
  return pdfFontData;
}

async function newPdfDoc() {
  const f = await loadPdfFonts();
  const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  doc.addFileToVFS('DejaVu.ttf', f.r);
  doc.addFont('DejaVu.ttf', 'DejaVu', 'normal');
  doc.addFileToVFS('DejaVu-Bold.ttf', f.b);
  doc.addFont('DejaVu-Bold.ttf', 'DejaVu', 'bold');
  doc.setFont('DejaVu', 'normal');
  return doc;
}

const PDF_M = 12;           // поля, мм
const PDF_W = 210 - PDF_M * 2;
const BLUE = [31, 78, 121];
const HEAD_FILL = [220, 230, 241];
const FOOT_FILL = [242, 242, 242];

function tableBase() {
  return {
    theme: 'grid',
    margin: { left: PDF_M, right: PDF_M },
    styles: { font: 'DejaVu', fontSize: 8.5, textColor: 20, lineColor: 60, lineWidth: 0.2, cellPadding: 1.4, valign: 'top', overflow: 'linebreak' },
    headStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: HEAD_FILL, textColor: 20, halign: 'center', valign: 'middle', fontSize: 7.5 },
    footStyles: { font: 'DejaVu', fontStyle: 'bold', fillColor: FOOT_FILL, textColor: 20 },
    rowPageBreak: 'avoid',
  };
}

// ---------- Смета ----------
async function buildEstimatePdf(e) {
  const doc = await newPdfDoc();
  const dl = e.docLang;
  const D = DOC[dl];
  const tt = totals(e);
  const c = cur(e.currency);
  const sym = symbol(e.currency, dl);
  const m = (v) => money(v, e);
  const S = +e.vars.S || 0, Lv = +e.vars.L || 0;
  const co = db.settings.company;
  let y = PDF_M;

  if (db.settings.showContacts && (co.name || co.phone)) {
    doc.setFont('DejaVu', 'bold'); doc.setFontSize(9.5); doc.setTextColor(40);
    doc.text([co.name, co.phone ? `${D.phone} ${co.phone}` : ''].filter(Boolean).join('  ·  '), PDF_M, y + 3);
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.6); doc.line(PDF_M, y + 5, 210 - PDF_M, y + 5);
    y += 9;
  }
  doc.setFont('DejaVu', 'bold'); doc.setFontSize(15); doc.setTextColor(10);
  const title = doc.splitTextToSize(e.client || D.estimate, PDF_W);
  doc.text(title, 105, y + 5, { align: 'center' });
  y += 5 + title.length * 6;
  doc.setFont('DejaVu', 'normal'); doc.setFontSize(9.5); doc.setTextColor(30);
  const obj = tr(OBJECT_TYPES[e.objType], dl);
  const meta = [S ? `S = ${fmtQty(S)} ${UNITS.m2[dl]}` : '', Lv ? `L = ${fmtQty(Lv)} ${UNITS.m[dl]}` : '', obj].filter(Boolean).join('    ');
  doc.text(fmtDate(e.date), PDF_M, y);
  doc.text(meta, 210 - PDF_M, y, { align: 'right' });
  y += 4;

  const sc = e.showCountry && e.mats.some((l) => l.country);
  const num = { halign: 'right' };
  const row = (l, i, withCountry) => {
    const r = [String(i + 1), tr(l.name, dl), UNITS[l.unit]?.[dl] || l.unit, fmtQty(+l.qty || 0), m(+l.price || 0), m((+l.qty || 0) * (+l.price || 0))];
    if (withCountry) r.push(COUNTRIES[l.country]?.[dl] || '');
    return r;
  };

  if (e.mats.length) {
    const head = [D.no, D.matName, D.unit, D.qty, D.price, D.sumSupply];
    if (sc) head.push(D.country);
    const foot = [{ content: D.totalMat, colSpan: 5, styles: { halign: 'right' } }, { content: m(tt.mat), styles: num }];
    if (sc) foot.push('');
    doc.autoTable({
      ...tableBase(), startY: y,
      head: [head], body: e.mats.map((l, i) => row(l, i, sc)), foot: [foot], showFoot: 'lastPage',
      columnStyles: sc
        ? { 0: { cellWidth: 7, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 14, ...num }, 4: { cellWidth: 21, ...num }, 5: { cellWidth: 25, ...num }, 6: { cellWidth: 26, halign: 'center' } }
        : { 0: { cellWidth: 7, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 15, ...num }, 4: { cellWidth: 23, ...num }, 5: { cellWidth: 27, ...num } },
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  if (e.works.length) {
    const foot = [[{ content: D.totalWork, colSpan: 5, styles: { halign: 'right' } }, { content: m(tt.work), styles: num }]];
    if (e.showPerM2 && S) foot.push([{ content: D.workPerM2, colSpan: 5, styles: { halign: 'right', fontStyle: 'normal', fillColor: [255, 255, 255] } }, { content: m(tt.workPerM2), styles: { ...num, fontStyle: 'normal', fillColor: [255, 255, 255] } }]);
    doc.autoTable({
      ...tableBase(), startY: y,
      head: [[D.no, D.workName, D.unit, D.qty, D.price, D.sum]], body: e.works.map((l, i) => row(l, i, false)), foot, showFoot: 'lastPage',
      columnStyles: { 0: { cellWidth: 7, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 15, ...num }, 4: { cellWidth: 23, ...num }, 5: { cellWidth: 27, ...num } },
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  const note = tr(e.note, dl);
  if (note) {
    doc.setFont('DejaVu', 'normal'); doc.setFontSize(9); doc.setTextColor(30);
    const lines = doc.splitTextToSize(note, PDF_W - 6);
    const h = lines.length * 4 + 3;
    if (y + h > 285) { doc.addPage(); y = PDF_M; }
    doc.setFillColor(246, 248, 251); doc.rect(PDF_M, y, PDF_W, h, 'F');
    doc.setFillColor(...BLUE); doc.rect(PDF_M, y, 1, h, 'F');
    doc.text(lines, PDF_M + 4, y + 4.5);
    y += h + 5;
  }

  // Итоги
  const sumRows = [];
  const big = { fontStyle: 'bold', fontSize: 11 };
  if (e.showPerM2 && S) sumRows.push([`${D.perM2}:`, `${m(tt.perM2)} ${sym}`]);
  sumRows.push([{ content: `${D.total}:`, styles: big }, { content: `${m(tt.total)} ${sym}`, styles: big }]);
  if (e.showAdvance && +e.advance) {
    sumRows.push([`${D.paid}:`, `${m(+e.advance)} ${sym}`]);
    sumRows.push([{ content: `${D.remain}:`, styles: big }, { content: `${m(tt.remain)} ${sym}`, styles: big }]);
  }
  const sumTable = (rows) => {
    doc.autoTable({
      startY: y, theme: 'plain', margin: { left: 80, right: PDF_M }, rowPageBreak: 'avoid',
      styles: { font: 'DejaVu', fontSize: 9.5, textColor: 15, cellPadding: { top: 1.3, bottom: 1.3, left: 1, right: 1 } },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold', cellWidth: 45 } },
      body: rows,
      didDrawCell: (d) => { doc.setDrawColor(190); doc.setLineWidth(0.2); doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height); },
    });
    y = doc.lastAutoTable.finalY + 4;
  };
  sumTable(sumRows);

  if (e.showSecond && e.currency2 && e.currency2 !== e.currency) {
    const c2 = cur(e.currency2);
    const s2 = symbol(e.currency2, dl);
    const v2 = (v) => fmt(v / (e.currency2 === 'UZS' ? 1 : e.rate2 || 1), c2.decimals);
    const rateTxt = e.currency2 !== 'UZS' ? ` (1 ${e.currency2} = ${fmt(e.rate2, 2)} ${symbol('UZS', dl)})` : '';
    sumTable([
      [{ content: `${D.inCurrency} ${e.currency2}${rateTxt}`, colSpan: 2, styles: { fontStyle: 'bold' } }],
      [`${D.totalMat}:`, `${v2(tt.mat)} ${s2}`],
      [`${D.totalWork}:`, `${v2(tt.work)} ${s2}`],
      [{ content: `${D.total}:`, styles: big }, { content: `${v2(tt.total)} ${s2}`, styles: big }],
    ]);
  }

  if (y > 285) { doc.addPage(); y = PDF_M; }
  doc.setFont('DejaVu', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80);
  doc.text(`${D.allPricesIn} ${c.code} (${sym})`, PDF_M, y + 2);
  return doc.output('blob');
}

// ---------- Акт ----------
async function buildActPdf(e, a) {
  const doc = await newPdfDoc();
  const dl = e.docLang;
  const D = DOC[dl];
  const co = db.settings.company;
  const c = cur(e.currency);
  const amountTxt = `${fmt(a.amount, c.decimals).replace(/ /g, '.')} ${symbol(c.code, dl)}`;
  const words = amountInWords(a.amount, c.code, dl);
  const wWords = dl === 'uz' ? wordsUz(a.warranty) : wordsRu(a.warranty);
  const short = co.short || co.name || '______________';
  const L0 = 20, W = 170;
  let y = 22;

  // Блок реквизитов справа
  const hx = 105, hw = 210 - 20 - hx;
  const headLine = (txt, bold = false) => {
    if (!txt) return;
    doc.setFont('DejaVu', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 12 : 10.5);
    const ls = doc.splitTextToSize(txt, hw);
    doc.text(ls, hx, y); y += ls.length * 5;
  };
  doc.setTextColor(15);
  headLine(co.name, true);
  headLine(`${D.to}: ${a.customer || '______________'}`);
  headLine(`${D.from}: ${co.nameLatin || co.name || '______________'}`);
  if (co.address) headLine(`${D.address}: ${co.address}`);
  if (co.passport) headLine(`${D.passport}: ${co.passport}`);
  if (co.passportIssued) headLine(`${D.issued}: ${co.passportIssued}`);
  if (co.phone) headLine(`${D.phoneFull}: ${co.phone}`);
  if (co.pinfl) headLine(`${D.pinfl}: ${co.pinfl}`);
  if (co.license) headLine(`${D.license}: ${co.license}; ${D.activity}`);
  y += 10;

  doc.setFont('DejaVu', 'normal'); doc.setFontSize(11.5);
  const para = (txt) => {
    const ls = doc.splitTextToSize('      ' + txt, W);
    doc.text(ls, L0, y, { lineHeightFactor: 1.45 }); y += ls.length * 6 + 3;
  };
  para(D.actBody({ short, kind: a.kind, address: a.address || '______________' }));
  para(D.actKind({ kind: a.kind, volume: fmtQty(a.volume) }));
  para(D.actSum({ amount: amountTxt, words }));
  para(D.actNoClaims);
  if (a.warranty) para(D.actWarranty(a.warranty, wWords));

  y += 12;
  doc.text(`${D.dateLine}: ${a.date ? fmtDate(a.date) : '______________'}`, L0, y);
  y += 16;
  doc.text(`${D.contractorSign}: ______________`, L0, y);
  doc.text(`${D.customerSign}: ______________`, 210 - 20, y, { align: 'right' });
  return doc.output('blob');
}
