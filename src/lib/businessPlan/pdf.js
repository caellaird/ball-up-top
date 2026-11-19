import { jsPDF } from 'jspdf';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_L = 58;
const MARGIN_R = 58;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const TOP = 74;
const BOTTOM = PAGE_H - 74;

const INK = '#131b30';
const BODY = '#33405a';
const MUTED = '#5e6982';
const PRIMARY = '#1697f3';
const ACCENT = '#e2453f';
const RULE = '#e2e8f0';
const TINT = '#f4f9ff';
const ZEBRA = '#fafcff';

const BODY_SIZE = 10.5;
const BODY_LEAD = 16;

function newDoc() {
  return new jsPDF({ unit: 'pt', format: 'a4', compress: true });
}

function setText(doc, size, style, color) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(color);
}

function wrap(doc, text, width) {
  return doc.splitTextToSize(String(text || ''), width);
}

// Text must be measured with the font it will be drawn in, otherwise lines are
// wrapped for the previous block's size and can run past the margin.
function measure(doc, text, width, size, style) {
  setText(doc, size, style, BODY);
  return doc.splitTextToSize(String(text || ''), width);
}

// ---------------------------------------------------------------- cover

function drawCover(doc, meta, generatedAt) {
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, PAGE_W, 430, 'F');
  doc.setFillColor(ACCENT);
  doc.rect(0, 430, PAGE_W, 7, 'F');

  setText(doc, 11, 'bold', '#dcefff');
  doc.text('BALL UP TOP', MARGIN_L, 96);

  setText(doc, 40, 'bold', '#ffffff');
  doc.text('Business Plan', MARGIN_L, 176);
  doc.text('and Product', MARGIN_L, 222);
  doc.text('Reference', MARGIN_L, 268);

  setText(doc, 12, 'normal', '#e8f5ff');
  doc.text(wrap(doc, meta.tagline, 380), MARGIN_L, 308);

  setText(doc, 10, 'normal', '#cfe8ff');
  doc.text(`${meta.version}  ·  Generated ${generatedAt}`, MARGIN_L, 372);

  let y = 500;
  setText(doc, 9, 'bold', PRIMARY);
  doc.text('PREPARED FOR', MARGIN_L, y);
  setText(doc, 12, 'normal', INK);
  doc.text(meta.preparedFor, MARGIN_L, y + 20);

  y += 62;
  setText(doc, 9, 'bold', PRIMARY);
  doc.text('PRODUCT', MARGIN_L, y);
  setText(doc, 12, 'normal', INK);
  doc.text(meta.site, MARGIN_L, y + 20);

  y += 62;
  setText(doc, 9, 'bold', PRIMARY);
  doc.text('CONTENTS', MARGIN_L, y);
  setText(doc, 10, 'normal', BODY);
  doc.text(
    wrap(
      doc,
      'Part One: the business, the market, the model and the goals. Part Two: every screen and option in the app. Part Three: the data model, services and rules behind the screens. Appendix: a live snapshot of stored records.',
      CONTENT_W,
    ),
    MARGIN_L,
    y + 18,
  );

  setText(doc, 8, 'normal', MUTED);
  doc.text(
    wrap(
      doc,
      'Every target, assumption and unbuilt idea is labelled as such. No financial projections, market-size estimates or user counts are presented as fact.',
      CONTENT_W,
    ),
    MARGIN_L,
    PAGE_H - 96,
  );
  doc.setDrawColor(RULE);
  doc.line(MARGIN_L, PAGE_H - 66, PAGE_W - MARGIN_R, PAGE_H - 66);
  setText(doc, 8, 'bold', MUTED);
  doc.text(meta.confidential, MARGIN_L, PAGE_H - 48);
}

// ---------------------------------------------------------------- table of contents

const TOC_ROW = 17;

function tocCapacity(firstPage) {
  const startY = firstPage ? 176 : 96;
  return Math.floor((BOTTOM - startY) / TOC_ROW);
}

function computeTocPages(count) {
  let left = count;
  let pages = 0;
  while (left > 0) {
    left -= tocCapacity(pages === 0);
    pages += 1;
  }
  return Math.max(pages, 1);
}

// Spread entries across the reserved pages instead of filling the first page
// and leaving two lines on the next one.
function tocSchedule(count, pages) {
  const capFirst = tocCapacity(true);
  const capRest = tocCapacity(false);
  const target = Math.ceil(count / pages);
  const first = Math.min(capFirst, Math.max(target, count - capRest * (pages - 1)));
  const schedule = [first];
  let left = count - first;
  for (let i = 1; i < pages; i += 1) {
    const take = Math.min(capRest, Math.ceil(left / (pages - i)));
    schedule.push(take);
    left -= take;
  }
  return schedule;
}

function drawToc(doc, entries, pageOf, tocPages) {
  const schedule = tocSchedule(entries.length, tocPages);
  let index = 0;
  for (let p = 0; p < tocPages; p += 1) {
    doc.setPage(2 + p);
    const first = p === 0;
    if (first) {
      setText(doc, 26, 'bold', INK);
      doc.text('Contents', MARGIN_L, 112);
      setText(doc, 10, 'normal', MUTED);
      doc.text('Page numbers refer to the printed pages of this document.', MARGIN_L, 134);
    }
    let y = first ? 176 : 96;
    const capacity = schedule[p] || 0;
    for (let i = 0; i < capacity && index < entries.length; i += 1) {
      const entry = entries[index];
      index += 1;
      const isPart = entry.part;
      const pageNo = pageOf[entry.id];

      if (isPart) {
        doc.setFillColor(TINT);
        doc.rect(MARGIN_L - 8, y - 12, CONTENT_W + 16, TOC_ROW + 4, 'F');
        setText(doc, 10, 'bold', PRIMARY);
        doc.text(entry.title, MARGIN_L, y);
      } else {
        setText(doc, 9.5, 'normal', BODY);
        const label = entry.label;
        doc.text(label, MARGIN_L + 14, y);
        const labelW = doc.getTextWidth(label);
        const pageText = String(pageNo || '');
        setText(doc, 9.5, 'bold', MUTED);
        const pageW = doc.getTextWidth(pageText);
        doc.text(pageText, PAGE_W - MARGIN_R - pageW, y);
        const dotStart = MARGIN_L + 22 + labelW;
        const dotEnd = PAGE_W - MARGIN_R - pageW - 8;
        if (dotEnd > dotStart) {
          doc.setDrawColor('#dbe3ee');
          doc.setLineDashPattern([1, 2], 0);
          doc.line(dotStart, y - 3, dotEnd, y - 3);
          doc.setLineDashPattern([], 0);
        }
      }
      y += TOC_ROW;
    }
  }
}

// ---------------------------------------------------------------- part divider

function drawPart(doc, section) {
  let y = 200;
  setText(doc, 10, 'bold', PRIMARY);
  doc.text('SECTION', MARGIN_L, y);

  y += 34;
  const titleLines = measure(doc, section.title, CONTENT_W, 27, 'bold');
  setText(doc, 27, 'bold', INK);
  titleLines.forEach((line) => {
    doc.text(line, MARGIN_L, y);
    y += 34;
  });

  y += 6;
  doc.setFillColor(ACCENT);
  doc.rect(MARGIN_L, y, 64, 4, 'F');

  y += 34;
  setText(doc, 12, 'normal', BODY);
  wrap(doc, section.intro, CONTENT_W - 40).forEach((line) => {
    doc.text(line, MARGIN_L, y);
    y += 19;
  });
}

// ---------------------------------------------------------------- blocks

function pageBreak(doc) {
  doc.addPage();
  return TOP;
}

function ensure(doc, y, height) {
  return y + height > BOTTOM ? pageBreak(doc) : y;
}

function drawHeading(doc, y, text) {
  const lines = measure(doc, text, CONTENT_W, 12, 'bold');
  const needed = lines.length * 15 + 22;
  y = ensure(doc, y + 6, needed);
  setText(doc, 12, 'bold', INK);
  lines.forEach((line) => {
    doc.text(line, MARGIN_L, y);
    y += 15;
  });
  return y + 7;
}

function drawParagraph(doc, y, text) {
  const lines = measure(doc, text, CONTENT_W, BODY_SIZE, 'normal');
  setText(doc, BODY_SIZE, 'normal', BODY);
  let cursor = y;
  lines.forEach((line) => {
    cursor = ensure(doc, cursor, BODY_LEAD);
    doc.text(line, MARGIN_L, cursor);
    cursor += BODY_LEAD;
  });
  return cursor + 9;
}

function drawBullets(doc, y, items) {
  let cursor = y;
  items.forEach((item) => {
    const lines = measure(doc, item, CONTENT_W - 16, BODY_SIZE, 'normal');
    cursor = ensure(doc, cursor, lines.length * 15);
    setText(doc, BODY_SIZE, 'bold', PRIMARY);
    doc.text('•', MARGIN_L + 1, cursor);
    setText(doc, BODY_SIZE, 'normal', BODY);
    lines.forEach((line) => {
      doc.text(line, MARGIN_L + 16, cursor);
      cursor += 15;
    });
    cursor += 4;
  });
  return cursor + 7;
}

function drawCallout(doc, y, block) {
  const labelLines = measure(doc, block.label.toUpperCase(), CONTENT_W - 30, 7.5, 'bold');
  const textLines = measure(doc, block.text, CONTENT_W - 30, 9.5, 'normal');
  const height = 18 + labelLines.length * 10 + textLines.length * 14 + 10;
  let cursor = ensure(doc, y + 4, height + 8);

  doc.setFillColor(TINT);
  doc.rect(MARGIN_L, cursor - 10, CONTENT_W, height, 'F');
  doc.setFillColor(PRIMARY);
  doc.rect(MARGIN_L, cursor - 10, 3, height, 'F');

  let ty = cursor + 6;
  setText(doc, 7.5, 'bold', PRIMARY);
  labelLines.forEach((line) => {
    doc.text(line, MARGIN_L + 16, ty);
    ty += 10;
  });
  ty += 4;
  setText(doc, 9.5, 'normal', BODY);
  textLines.forEach((line) => {
    doc.text(line, MARGIN_L + 16, ty);
    ty += 14;
  });
  return cursor + height + 12;
}

function drawTable(doc, y, block) {
  const fractions = block.widths || block.head.map(() => 1 / block.head.length);
  const widths = fractions.map((f) => f * CONTENT_W);
  const pad = 7;
  const lineHeight = 12;
  const size = 8.8;

  const rowHeight = (cells, style) => {
    let maxLines = 1;
    cells.forEach((cell, i) => {
      const lines = measure(doc, cell, widths[i] - pad * 2, size, style);
      maxLines = Math.max(maxLines, lines.length);
    });
    return maxLines * lineHeight + pad * 2;
  };

  const drawHead = (cursor) => {
    const h = rowHeight(block.head, 'bold');
    doc.setFillColor('#eaf4fe');
    doc.rect(MARGIN_L, cursor, CONTENT_W, h, 'F');
    setText(doc, size, 'bold', INK);
    let x = MARGIN_L;
    block.head.forEach((cell, i) => {
      const lines = wrap(doc, cell, widths[i] - pad * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + pad, cursor + pad + 9 + li * lineHeight);
      });
      x += widths[i];
    });
    return cursor + h;
  };

  let cursor = ensure(
    doc,
    y + 2,
    rowHeight(block.head, 'bold') + rowHeight(block.rows[0] || [''], 'normal') + 4,
  );
  cursor = drawHead(cursor);

  block.rows.forEach((cells, rowIndex) => {
    const h = rowHeight(cells, 'normal');
    if (cursor + h > BOTTOM) {
      cursor = pageBreak(doc);
      cursor = drawHead(cursor);
    }
    if (rowIndex % 2 === 1) {
      doc.setFillColor(ZEBRA);
      doc.rect(MARGIN_L, cursor, CONTENT_W, h, 'F');
    }
    setText(doc, size, 'normal', BODY);
    let x = MARGIN_L;
    cells.forEach((cell, i) => {
      const lines = wrap(doc, cell, widths[i] - pad * 2);
      lines.forEach((line, li) => {
        doc.text(line, x + pad, cursor + pad + 9 + li * lineHeight);
      });
      x += widths[i];
    });
    doc.setDrawColor(RULE);
    doc.line(MARGIN_L, cursor + h, PAGE_W - MARGIN_R, cursor + h);
    cursor += h;
  });

  return cursor + 14;
}

function drawFlow(doc, y, block) {
  let cursor = y;
  if (block.title) {
    cursor = ensure(doc, cursor, 18);
    setText(doc, 8.5, 'bold', MUTED);
    doc.text(block.title.toUpperCase(), MARGIN_L, cursor);
    cursor += 14;
  }

  const boxW = CONTENT_W;
  const textW = boxW - 34;

  block.steps.forEach((step, index) => {
    const lines = measure(doc, step, textW, 9.2, 'normal');
    const boxH = lines.length * 13 + 18;

    if (cursor + boxH > BOTTOM) {
      cursor = pageBreak(doc);
    }

    if (index > 0) {
      const arrowX = MARGIN_L + 15;
      doc.setDrawColor('#b9d6ef');
      doc.line(arrowX, cursor - 10, arrowX, cursor - 4);
      doc.setFillColor('#b9d6ef');
      doc.triangle(arrowX - 2.6, cursor - 6, arrowX + 2.6, cursor - 6, arrowX, cursor - 1, 'F');
    }

    doc.setFillColor('#f7fbff');
    doc.setDrawColor('#d9e7f4');
    doc.roundedRect(MARGIN_L, cursor, boxW, boxH, 4, 4, 'FD');
    doc.setFillColor(PRIMARY);
    doc.rect(MARGIN_L, cursor, 3, boxH, 'F');

    setText(doc, 9.2, 'normal', BODY);
    lines.forEach((line, li) => {
      doc.text(line, MARGIN_L + 16, cursor + 16 + li * 13);
    });
    cursor += boxH + 12;
  });

  return cursor + 6;
}

function drawBlock(doc, y, block) {
  switch (block.t) {
    case 'h2':
      return drawHeading(doc, y, block.text);
    case 'p':
      return drawParagraph(doc, y, block.text);
    case 'bullets':
      return drawBullets(doc, y, block.items);
    case 'table':
      return drawTable(doc, y, block);
    case 'flow':
      return drawFlow(doc, y, block);
    case 'callout':
      return drawCallout(doc, y, block);
    default:
      return y;
  }
}

function drawSection(doc, section, label) {
  let y = 96;
  setText(doc, 9, 'bold', PRIMARY);
  doc.text(label.toUpperCase(), MARGIN_L, y);

  y += 30;
  const titleLines = measure(doc, section.title, CONTENT_W, 21, 'bold');
  setText(doc, 21, 'bold', INK);
  titleLines.forEach((line) => {
    doc.text(line, MARGIN_L, y);
    y += 26;
  });

  y += 2;
  doc.setFillColor(ACCENT);
  doc.rect(MARGIN_L, y, 46, 3, 'F');
  y += 26;

  section.blocks.forEach((block) => {
    y = drawBlock(doc, y, block);
  });
}

// ---------------------------------------------------------------- footers

function drawFooters(doc, meta, total) {
  const count = doc.getNumberOfPages();
  for (let p = 2; p <= count; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(RULE);
    doc.line(MARGIN_L, PAGE_H - 62, PAGE_W - MARGIN_R, PAGE_H - 62);
    setText(doc, 7.6, 'normal', MUTED);
    doc.text(`${meta.title}  ·  ${meta.subtitle}`, MARGIN_L, PAGE_H - 46);
    const pageLabel = `Page ${p} of ${total}`;
    const w = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, PAGE_W - MARGIN_R - w, PAGE_H - 46);
  }
}

// ---------------------------------------------------------------- build

export function buildPlanPdf(sections, meta, generatedAt) {
  const doc = newDoc();

  const entries = [];
  let sectionNumber = 0;
  sections.forEach((section) => {
    if (section.part) {
      entries.push({ id: section.id, title: section.title, part: true });
    } else {
      sectionNumber += 1;
      const label = `${String(sectionNumber).padStart(2, '0')}   ${section.title}`;
      entries.push({ id: section.id, label, title: section.title, part: false });
    }
  });

  const tocPages = computeTocPages(entries.length);

  drawCover(doc, meta, generatedAt);
  for (let i = 0; i < tocPages; i += 1) doc.addPage();

  const pageOf = {};
  let counter = 0;
  sections.forEach((section) => {
    doc.addPage();
    pageOf[section.id] = doc.getNumberOfPages();
    if (section.part) {
      drawPart(doc, section);
    } else {
      counter += 1;
      drawSection(doc, section, `Section ${String(counter).padStart(2, '0')}`);
    }
  });

  const total = doc.getNumberOfPages();
  drawToc(doc, entries, pageOf, tocPages);
  drawFooters(doc, meta, total);
  doc.setPage(1);
  return doc;
}

export function planFileName(date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  return `Ball-Up-Top-Business-Plan-${iso}.pdf`;
}

export function downloadPlanPdf(sections, meta) {
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const doc = buildPlanPdf(sections, meta, generatedAt);
  doc.save(planFileName(new Date()));
}