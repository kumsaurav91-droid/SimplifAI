/* ═══════════════════════════════════════════════════════
   MODULE 7 — doDownloadPDF()  [SaaS PREMIUM REDESIGN]
═══════════════════════════════════════════════════════ */
function doDownloadPDF() {
  if (!APP.hasExplained) { toast('Pehle explain karo!'); return; }
  toast('Generating premium PDF report... Please wait.');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ML = 20, MR = 20, TW = W - ML - MR;

    const cx = APP.complexityData || { time: 'N/A', space: 'N/A', insight: '' };
    const qs = APP.quizState || { score: 0, answered: [], done: false };
    const r = APP.lastResult || {};
    const code = (document.getElementById('codeInput')?.value || '').trim();
    const level = document.getElementById('levelSel')?.value || 'intermediate';
    const codeLines = code.split('\n');
    const totalLines = codeLines.length;

    // ─── Colour Palette ───────────────────────────────────
    const WHT = [255, 255, 255];
    const TXT_DARK = [15, 23, 42];
    const TXT_MED = [71, 85, 105];
    const TXT_LIGHT = [148, 163, 184];
    const DIVIDER = [226, 232, 240];
    const BLUE = [14, 165, 233];
    const BG_GREY = [248, 250, 252];
    const DARK_BG = [15, 23, 42];
    const GREEN = [34, 197, 94];
    const GREEN_BG = [220, 252, 231];
    const RED = [239, 68, 68];
    const RED_BG = [254, 226, 226];
    const ORANGE = [249, 115, 22];
    const ORANGE_LIGHT = [254, 215, 170];

    // ─── Text Sanitizer ───────────────────────────────────
    function normalizeText(raw) {
      if (raw === null || raw === undefined) return '';
      let s = String(raw);

      // 1. Decode HTML entities
      s = s
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#(\d+);/g, (_, n) => n < 128 ? String.fromCharCode(n) : '')
        .replace(/&[a-zA-Z0-9#]+;/g, ''); // strip any remaining unknown entity

      // 2. Strip all HTML tags
      s = s.replace(/<\/?[^>]+(>|$)/g, ' ');

      // 3. Normalise Unicode punctuation -> ASCII equivalents
      s = s
        .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")   // curly apostrophes -> '
        .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')    // curly quotes -> "
        .replace(/[\u2013\u2014\u2012]/g, '-')          // en-dash, em-dash -> -
        .replace(/\u2026/g, '...')                       // ellipsis -> ...
        .replace(/[\u2022\u2023\u25E6\u2043]/g, '-')    // bullets -> -
        .replace(/\u00D7/g, 'x')                         // multiplication sign
        .replace(/\u00F7/g, '/')                         // division sign
        .replace(/[\u2010-\u2017]/g, '-');               // other dashes

      // 4. Strip markdown formatting characters
      s = s.replace(/[*_#`~]/g, '');

      // 5. Remove anything still outside printable ASCII (0x20-0x7E)
      s = s.replace(/[^\x20-\x7E]/g, '');

      // 6. Collapse consecutive spaces (but preserve newlines)
      s = s.replace(/[ \t]+/g, ' ');
      // 7. Trim each line
      return s.split('\n').map(line => line.trim()).join('\n').trim();
    }

    const safeText = s => normalizeText(s);
    const trunc = (s, n) => normalizeText(s).substring(0, n);

    // ─── Helpers ──────────────────────────────────────────
    let y = 0, pageNum = 0;
    const sf = c => doc.setFillColor(c[0], c[1], c[2]);
    const sc = c => doc.setTextColor(c[0], c[1], c[2]);
    const sd = c => doc.setDrawColor(c[0], c[1], c[2]);
    const fw = (w, sz, font = 'helvetica') => { doc.setFont(font, w); doc.setFontSize(sz); };
    const LINE = (x1, y1, x2, y2, c) => { sd(c || DIVIDER); doc.setLineWidth(0.3); doc.line(x1, y1, x2, y2); };

    function pageFooter() {
      fw('normal', 8); sc(TXT_LIGHT);
      doc.text('Code Analysis Report', ML, H - 12);
      doc.text('Page ' + pageNum, W / 2, H - 12, { align: 'center' });
      doc.text('SimplifAI.dev', W - MR, H - 12, { align: 'right' });
    }

    function checkY(needed) {
      if (y + needed > H - 22) {
        pageFooter();
        doc.addPage();
        pageNum++;
        y = 20;
      }
    }

    function sectionHeader(title) {
      checkY(22);
      fw('bold', 14); sc(TXT_DARK);
      doc.text(safeText(title), ML, y);
      y += 4;
      LINE(ML, y, W - MR, y);
      y += 10;
    }

    // Draw SimplifAI logo matching website exactly:
    // Blue rounded square + white lightning bolt + "Simplif" dark + "AI" blue
    function drawLogo(lx, ly, iconSize) {
      iconSize = iconSize || 16;
      const r = iconSize * 0.2;

      // Blue background box
      sf(BLUE);
      doc.roundedRect(lx, ly - iconSize * 0.8, iconSize, iconSize, r, r, 'F');

      // Lightning bolt: SVG path M13 2 L3 14 h9 l-1 8 10-12 h-9 l1-8 z
      // viewBox 24x24; scale to fit in (iconSize-6) sq box, centered
      const boltSize = iconSize - 6;
      const scale = boltSize / 20;   // shape is ~18w x 20h in viewbox
      // center inside box (iconSize x iconSize)
      const startX = lx + (iconSize - 18 * scale) / 2 + 13 * scale;
      const startY = (ly - iconSize * 0.8) + (iconSize - 20 * scale) / 2 + 2 * scale;

      sf(WHT); sd(WHT);
      doc.lines([
        [-10 * scale, 12 * scale],
        [9 * scale, 0],
        [-1 * scale, 8 * scale],
        [10 * scale, -12 * scale],
        [-9 * scale, 0],
        [1 * scale, -8 * scale]
      ], startX, startY, [1, 1], 'F', true);

      // Brand text: "Simplif" dark + "AI" blue
      fw('bold', iconSize * 1.1, 'helvetica');
      sc(TXT_DARK); doc.text('Simplif', lx + iconSize + 4, ly);
      const sW = doc.getTextWidth('Simplif');
      sc(BLUE); doc.text('AI', lx + iconSize + 4 + sW, ly);
    }

    // ═══════════════════════════════════════════════════════
    //  PAGE 1 · COVER
    // ═══════════════════════════════════════════════════════
    pageNum = 1;
    y = 28;

    drawLogo(ML, y, 16);

    // Top-right: Report ID + Date
    const reportId = 'SML-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    fw('bold', 8); sc(TXT_MED);
    doc.text('REPORT ID:', W - MR - 28, y - 5, { align: 'right' });
    doc.text('DATE:', W - MR - 28, y, { align: 'right' });
    fw('normal', 8);
    doc.text(reportId, W - MR, y - 5, { align: 'right' });
    doc.text(dateStr, W - MR, y, { align: 'right' });

    // Thin separating line under header
    y = 36;
    LINE(ML, y, W - MR, y, DIVIDER);

    // Cover hero section
    y = 88;
    fw('bold', 13); sc(BLUE);
    doc.text('CODE ANALYSIS REPORT', W / 2, y, { align: 'center' });

    y += 16;
    fw('bold', 30); sc(TXT_DARK);
    // Compute text widths after setting font
    const h1 = 'Learn Coding With ';
    const h2 = 'SimplifAI';
    fw('bold', 30);
    const h1w = doc.getTextWidth(h1);
    const h2w = doc.getTextWidth(h2);
    const hx = (W - h1w - h2w) / 2;
    doc.text(h1, hx, y);
    sc(BLUE);
    doc.text(h2, hx + h1w, y);

    y += 14;
    fw('normal', 10); sc(TXT_MED);
    doc.text('India ka pehla AI coding mentor jo Hinglish mein samjhata hai -- cricket,', W / 2, y, { align: 'center' });
    y += 6;
    doc.text('biryani aur Bollywood ke examples se.', W / 2, y, { align: 'center' });

    y += 14;
    const tagW = 105;
    sf(BG_GREY); sd(DIVIDER); doc.setLineWidth(0.3);
    doc.roundedRect((W - tagW) / 2, y, tagW, 14, 2, 2, 'FD');
    fw('normal', 10, 'courier'); sc(GREEN);
    doc.text('// "Logic wohi, andaaz bilkul apna"', W / 2, y + 9, { align: 'center' });

    // Info grid
    y += 38;
    const gridH = 68;
    sf(BG_GREY); sd(DIVIDER); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, TW, gridH, 3, 3, 'FD');

    const bc = APP.debugData?.bugs?.length || 0;
    const qtot = APP.quizData?.length || 0;
    const qscr = qs.score || 0;
    const qpct = qtot > 0 ? Math.round(qscr / qtot * 100) : 0;
    const cw = TW / 3;
    const cx1 = ML + cw * 0.5, cx2 = ML + cw * 1.5, cx3 = ML + cw * 2.5;

    y += 14;
    fw('bold', 8); sc(TXT_MED);
    doc.text('LANGUAGE', cx1, y, { align: 'center' });
    doc.text('LEVEL', cx2, y, { align: 'center' });
    doc.text('LINES OF CODE', cx3, y, { align: 'center' });
    y += 7;
    fw('bold', 13); sc(TXT_DARK);
    doc.text(safeText(APP.langPill || 'Python'), cx1, y, { align: 'center' });
    doc.text(safeText(level.charAt(0).toUpperCase() + level.slice(1)), cx2, y, { align: 'center' });
    doc.text(String(totalLines), cx3, y, { align: 'center' });

    y += 14;
    fw('bold', 8); sc(TXT_MED);
    doc.text('COMPLEXITY', cx1, y, { align: 'center' });
    doc.text('BUGS DETECTED', cx2, y, { align: 'center' });
    doc.text('QUIZ SCORE', cx3, y, { align: 'center' });
    y += 7;
    fw('bold', 13);
    sc(TXT_DARK); doc.text(safeText(cx.time || 'N/A'), cx1, y, { align: 'center' });
    sc(bc > 0 ? RED : GREEN);
    doc.text(bc > 0 ? String(bc) : '0 (Clean)', cx2, y, { align: 'center' });
    sc(qpct >= 70 ? GREEN : qpct >= 40 ? ORANGE : RED);
    doc.text(qtot > 0 ? `${qscr}/${qtot} (${qpct}%)` : 'N/A', cx3, y, { align: 'center' });

    y += 10;
    LINE(ML + 10, y, W - MR - 10, y, DIVIDER);
    y += 8;

    let statusText = 'GOOD -- READY TO RUN';
    let statusColor = GREEN;
    if (bc > 0) { statusText = 'POOR -- NEEDS FIXING'; statusColor = RED; }
    else if (qpct >= 0 && qpct < 50) { statusText = 'FAIR -- REVIEW NEEDED'; statusColor = ORANGE; }

    fw('bold', 9); sc(TXT_DARK);
    doc.text('OVERALL STATUS:', W / 2 - 4, y, { align: 'right' });
    sc(statusColor);
    doc.text(safeText(statusText), W / 2 - 1, y, { align: 'left' });

    // ═══════════════════════════════════════════════════════
    //  PAGE 2 · SUBMITTED CODE + EXPLANATION
    // ═══════════════════════════════════════════════════════
    pageFooter();
    doc.addPage(); pageNum++; y = 20;

    sectionHeader('1. Submitted Code');

    const maxCL = 40;
    const pCL = codeLines.slice(0, maxCL);
    const clH = 5;
    const cbH = pCL.length * clH + 8;
    sf(BG_GREY); sd(DIVIDER); doc.setLineWidth(0.3);
    doc.rect(ML, y, TW, cbH, 'FD');
    pCL.forEach((l, i) => {
      fw('normal', 8, 'courier'); sc(TXT_LIGHT);
      doc.text(String(i + 1), ML + 3, y + 6 + i * clH);
      sc(TXT_DARK);
      doc.text(trunc(l, 90), ML + 10, y + 6 + i * clH);
    });
    if (codeLines.length > maxCL) { sc(TXT_LIGHT); doc.text('...', ML + 10, y + 6 + pCL.length * clH); }
    y += cbH + 14;

    sectionHeader('2. Explanation & Summary');

    // Explanation - properly split into paragraphs preserving AI structure
    const rawExpRaw = (APP.explanation || '');
    // First normalize each line individually (preserve structure)
    const expLines = rawExpRaw.split('\n');
    const expNorm = expLines.map(l => {
      return l.replace(/[*_#`~]/g, '')
        .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
        .replace(/&[a-zA-Z0-9#]+;/gi, '')
        .replace(/<\/?[^>]+(>|$)/g, ' ')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2026/g, '...')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/[ \t]+/g, ' ').trim();
    });
    // Group consecutive non-blank lines into paragraphs
    const paragraphs = [];
    let curPara = [];
    expNorm.forEach(line => {
      if (!line) {
        if (curPara.length) { paragraphs.push(curPara.join(' ')); curPara = []; }
      } else {
        // Start a new paragraph if this line looks like a numbered item or ALLCAPS section
        if (/^\d+\.\s/.test(line) || /^[A-Z]{4,}[\s:-]/.test(line)) {
          if (curPara.length) { paragraphs.push(curPara.join(' ')); curPara = []; }
        }
        curPara.push(line);
      }
    });
    if (curPara.length) paragraphs.push(curPara.join(' '));

    checkY(10);
    paragraphs.forEach((p, pi) => {
      p = p.trim();
      if (!p) return;
      const isBullet = p.startsWith('-');
      if (isBullet) {
        const bLines = p.split('\n');
        bLines.forEach(bl => {
          const txt = bl.replace(/^-/, '').trim();
          if (!txt) return;
          fw('normal', 9); sc(TXT_DARK);
          const sp = doc.splitTextToSize(txt, TW - 8);
          checkY(sp.length * 5 + 3);
          sc(GREEN); doc.text('-', ML + 2, y);
          sc(TXT_DARK);
          sp.forEach((t, ti) => doc.text(t, ML + 6, y + ti * 5));
          y += sp.length * 5 + 3;
        });
      } else {
        fw('normal', 9); sc(TXT_DARK);
        const sp = doc.splitTextToSize(p, TW);
        checkY(sp.length * 5 + 4);
        sp.forEach((t, ti) => doc.text(t, ML, y + ti * 5));
        y += sp.length * 5 + 4;
      }
    });
    y += 6;

    // Line-by-Line Breakdown
    if (r.lineExplanations && r.lineExplanations.length > 0) {
      checkY(20);
      fw('bold', 12); sc(TXT_DARK);
      doc.text('Line-by-Line Breakdown', ML, y);
      y += 8;
      r.lineExplanations.slice(0, 12).forEach(item => {
        const ct = trunc((item?.code || '').replace(/"""/g, '"'), 65);
        const et = safeText(item?.expl || item?.explanation || '');
        if (!ct && !et) return;
        const se = doc.splitTextToSize(et, TW - 12);
        const rh = 10 + se.length * 5 + 4;
        checkY(rh + 6);
        sf(WHT); sd(ORANGE_LIGHT); doc.setLineWidth(0.3);
        doc.rect(ML, y, TW, rh, 'FD');
        sf(ORANGE); doc.rect(ML, y, 2.5, rh, 'F');
        fw('bold', 9, 'courier'); sc(TXT_DARK);
        doc.text(ct, ML + 6, y + 6);
        fw('normal', 9, 'helvetica'); sc(TXT_MED);
        se.forEach((t, ti) => doc.text(t, ML + 6, y + 12 + ti * 5));
        y += rh + 5;
      });
    }

    // ═══════════════════════════════════════════════════════
    //  PAGE 3 · OUTPUT & DEBUG
    // ═══════════════════════════════════════════════════════
    pageFooter();
    doc.addPage(); pageNum++; y = 20;

    sectionHeader('3. Output & Debug');

    // Use AI-generated output if available, else show prompt
    const hasRunOutput = APP.runOutputLines && APP.runOutputLines.length > 0;
    const rawOuts = hasRunOutput ? APP.runOutputLines : ['Run Karo button dabao to get AI output'];
    const wasAI = APP.runWasAI === true;

    // Header with AI or simulated badge
    fw('bold', 11); sc(TXT_DARK);
    const outTitle = wasAI ? 'AI-Generated Output' : (hasRunOutput ? 'Simulated Output' : 'Code Output');
    doc.text(outTitle, ML, y);
    if (wasAI && hasRunOutput) {
      fw('normal', 8); sc(GREEN);
      const badgeX = ML + 45; // Fixed offset instead of doc.getTextWidth
      doc.text('(Amazon Nova AI)', badgeX, y);
    }
    y += 10;

    // Show input values if any
    const runInputs = APP.runInputs || {};
    const inputKeys = Object.keys(runInputs);
    if (inputKeys.length > 0) {
      const boxH = 12 + inputKeys.length * 6;
      checkY(boxH + 10);

      // Draw light green tinted box for inputs (matches the web UI)
      sf([238, 248, 245]); // Light minty green
      sd([180, 220, 205]); doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, TW, boxH, 2, 2, 'FD');

      fw('bold', 8); sc([6, 214, 160]); // Teal color
      doc.text('TUMHARE INPUT VALUES', ML + 5, y + 7);
      y += 13;

      fw('normal', 8.5, 'courier'); sc(TXT_DARK);
      Object.entries(runInputs).forEach(([k, v]) => {
        doc.text(safeText(`${k} = "${v}"`), ML + 5, y);
        y += 6;
      });
      y += 8; // Extra padding below the box
    }

    fw('normal', 8, 'courier');
    const wrOut = [];
    rawOuts.forEach(o => doc.splitTextToSize(safeText(o), TW - 10).forEach(l => wrOut.push(l)));
    const outH = wrOut.length * 5 + 16;
    checkY(outH + 5);
    sf(DARK_BG); doc.roundedRect(ML, y, TW, outH, 2, 2, 'F');
    sc(WHT); fw('normal', 8, 'courier');
    const runCmd = APP.langPill === 'Python' ? 'python main.py'
      : APP.langPill === 'JavaScript' ? 'node main.js'
        : APP.langPill === 'C++' ? './a.out'
          : 'java Main';
    doc.text('$ ' + runCmd, ML + 5, y + 8);
    wrOut.forEach((o, oi) => doc.text(o, ML + 5, y + 14 + oi * 5));
    y += outH + 14;

    checkY(14);
    fw('bold', 11); sc(TXT_DARK);
    doc.text('Debug Analysis', ML, y);
    y += 8;
    const dbg = APP.debugData || {};
    const bcL = dbg.bugs || [], wcL = dbg.warnings || [];
    if (!bcL.length && !wcL.length) {
      fw('normal', 9); sc(TXT_DARK);
      doc.text('No bugs or warnings detected. Code is clean and ready to run!', ML, y);
      y += 8;
    } else {
      bcL.forEach(b => {
        checkY(14);
        fw('bold', 9); sc(RED);
        doc.text('Bug on Line ' + (b.line || '?') + ':', ML, y);
        fw('normal', 9); sc(TXT_DARK);
        const tl = doc.splitTextToSize(safeText(b.desc || b.message || ''), TW);
        tl.forEach((t, i) => doc.text(t, ML, y + 5 + i * 5));
        y += 10 + tl.length * 5;
      });
      if (wcL.length) {
        checkY(14);
        fw('bold', 9); sc(ORANGE);
        doc.text('Warning:', ML, y);
        fw('normal', 9); sc(TXT_DARK);
        const tl = doc.splitTextToSize(safeText(wcL[0].desc || wcL[0].message || ''), TW);
        tl.forEach((t, i) => doc.text(t, ML, y + 5 + i * 5));
        y += 10 + tl.length * 5;
      }
    }

    // ═══════════════════════════════════════════════════════
    //  PAGE 4 · TIPS & BEST PRACTICES
    // ═══════════════════════════════════════════════════════
    pageFooter();
    doc.addPage(); pageNum++; y = 20;

    sectionHeader('4. Tips & Best Practices');

    const tips = r.opts && r.opts.length > 0
      ? r.opts.map(o => safeText(o.body || o))
      : [
        'Write docstrings for every function - documentation is as important as code.',
        'Use meaningful variable names - x is unclear, student_count is professional.',
        'Follow PEP 8 (Python) or ESLint (JS) - consistent style matters in teams.',
        'Add try/except or try/catch for all production-facing code paths.',
        'Version control: small commits with clear messages - never "fixed stuff".',
        'Write unit tests for any function you plan to reuse or deploy to production.'
      ];

    tips.forEach(tip => {
      fw('normal', 9);
      const tl = doc.splitTextToSize(tip, TW - 6);
      checkY(tl.length * 5 + 5);
      sc(GREEN); doc.text('-', ML, y);
      sc(TXT_DARK);
      tl.forEach((t, i) => doc.text(t, ML + 4, y + i * 5));
      y += tl.length * 5 + 4;
    });

    // ═══════════════════════════════════════════════════════
    //  COMPLEXITY TABLE (same page after tips or new page)
    // ═══════════════════════════════════════════════════════
    y += 16;
    sectionHeader('5. Time & Space Complexity');

    const tVal = safeText(cx.time || 'N/A');
    const sVal = safeText(cx.space || 'N/A');
    const aVal = safeText(r.avgCase || cx.time || 'N/A');
    const wVal = safeText(r.worstCase || cx.time || 'N/A');

    checkY(55);
    sf(BG_GREY); sd(DIVIDER); doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, TW, 46, 2, 2, 'FD');

    fw('bold', 9); sc(TXT_DARK);
    doc.text('Time Complexity', ML + 6, y + 8);
    doc.text('Space Complexity', W / 2, y + 8);
    fw('bold', 15); sc(GREEN);
    doc.text(tVal, ML + 6, y + 16);
    fw('bold', 13); sc(TXT_DARK);
    doc.text(sVal, W / 2, y + 16);
    LINE(ML + 4, y + 21, W - MR - 4, y + 21, TXT_DARK);
    fw('normal', 8); sc(TXT_MED);
    const cw3 = (TW - 8) / 3;
    doc.text('Best Case', ML + 6, y + 29);
    doc.text('Average Case', ML + 6 + cw3, y + 29);
    doc.text('Worst Case', ML + 6 + cw3 * 2, y + 29);
    fw('normal', 9);
    doc.text(tVal, ML + 6, y + 36);
    doc.text(aVal, ML + 6 + cw3, y + 36);
    doc.text(wVal, ML + 6 + cw3 * 2, y + 36);
    y += 54;

    fw('bold', 9); sc(TXT_DARK);
    const iW = doc.getTextWidth('Insight: ');
    doc.text('Insight: ', ML, y);
    fw('normal', 9);
    const ins = safeText(cx.insight || '').replace(/^[^A-Za-z]+/, '') || 'Code follows standard execution patterns.';
    const inSp = doc.splitTextToSize(ins, TW - iW - 2);
    inSp.forEach((l, i) => doc.text(l, ML + iW, y + i * 5));
    y += inSp.length * 5 + 10;

    // ═══════════════════════════════════════════════════════
    //  PAGE 6+ · QUIZ RESULTS
    // ═══════════════════════════════════════════════════════
    pageFooter();
    doc.addPage(); pageNum++; y = 20;

    sectionHeader(`6. Quiz Results (Score: ${qscr}/${qtot})`);

    if (qtot === 0) {
      fw('normal', 9); sc(TXT_DARK);
      doc.text('Quiz not attempted yet.', ML, y);
    } else {
      fw('bold', 9); sc(TXT_DARK);
      doc.text('Overall Performance Summary:', ML, y);
      y += 5;
      fw('normal', 9); sc(TXT_MED);
      const pm = qscr / qtot >= 0.8
        ? 'Outstanding! You have demonstrated strong command of all core concepts.'
        : qscr / qtot >= 0.6
          ? 'Good effort! You understand most concepts well.'
          : 'Fair attempt. Core logic is partially understood. Re-read the explanation carefully.';
      const pmL = doc.splitTextToSize(pm, TW);
      pmL.forEach((l, i) => doc.text(l, ML, y + i * 5));
      y += pmL.length * 5 + 10;

      const letters = ['A', 'B', 'C', 'D'];
      const answered = qs.answered || [];

      APP.quizData.forEach((q, qi) => {
        const userAnswer = answered[qi];
        const qTxt = safeText(q.q || '');
        const qSplit = doc.splitTextToSize(qTxt, TW - 12);

        // Estimate height needed for this entire question card
        let estOptH = 0;
        (q.opts || []).forEach(opt => {
          const ow = doc.splitTextToSize(safeText(opt), TW - 24);
          estOptH += (5 + ow.length * 5 + 3) + 3;
        });
        const expTxt = safeText(q.e || q.explanation || '');
        const expSp = doc.splitTextToSize(expTxt, TW - 18);
        const totalH = 16 + qSplit.length * 5 + estOptH + expSp.length * 5 + 18;
        checkY(totalH);

        const boxY = y;

        // Question text - prefix + first line on same row, rest indented
        fw('bold', 10); sc(TXT_DARK);
        const qPfx = `Q${qi + 1}: `;
        const qPfxW = doc.getTextWidth(qPfx);
        doc.text(qPfx, ML + 5, y + 8);
        if (qSplit.length > 0) doc.text(qSplit[0], ML + 5 + qPfxW, y + 8);
        qSplit.slice(1).forEach((ql, li) => doc.text(ql, ML + 5 + qPfxW, y + 8 + (li + 1) * 5));
        y += 8 + qSplit.length * 5 + 4;

        // Option boxes
        q.opts.forEach((opt, oi) => {
          const isUser = oi === userAnswer;
          const isCorr = oi === q.c;

          let fillC = WHT, drawC = DIVIDER, txC = TXT_MED;
          let badge = '';

          if (isCorr && isUser) { fillC = GREEN_BG; drawC = GREEN; txC = GREEN; badge = '(Correct Answer)'; }
          else if (isCorr) { fillC = GREEN_BG; drawC = GREEN; txC = GREEN; badge = '(Correct Answer)'; }
          else if (isUser) { fillC = RED_BG; drawC = RED; txC = RED; badge = '(Your Answer)'; }

          const optClean = safeText(opt);
          const optLabel = `${letters[oi]}. `;
          fw('normal', 9);
          const optW = TW - 18 - (badge ? doc.getTextWidth(badge) + 3 : 0);
          const optSp = doc.splitTextToSize(optClean, optW);
          const boxH = 6 + optSp.length * 5;

          sf(fillC); sd(drawC); doc.setLineWidth(0.3);
          doc.roundedRect(ML + 5, y, TW - 10, boxH, 1.5, 1.5, 'FD');
          sc(txC); fw('normal', 9);
          doc.text(optLabel, ML + 8, y + 5.5);
          const labW = doc.getTextWidth(optLabel);
          optSp.forEach((ol, li) => doc.text(ol, ML + 8 + labW, y + 5.5 + li * 5));

          if (badge) {
            fw('bold', 8);
            doc.text(badge, ML + TW - 8, y + 5.5, { align: 'right' });
          }
          y += boxH + 3;
        });

        y += 4;
        fw('bold', 9); sc(TXT_DARK);
        doc.text('Explanation: ', ML + 5, y);
        fw('normal', 9);
        const eW = doc.getTextWidth('Explanation: ');
        expSp.forEach((l, i) => doc.text(l, ML + 5 + eW, y + i * 5));

        // Outer card border
        const finalH = (y + expSp.length * 5 + 6) - boxY;
        sf(WHT); sd(DIVIDER); doc.setLineWidth(0.3);
        doc.roundedRect(ML, boxY, TW, finalH, 3, 3, 'S');

        y += expSp.length * 5 + 12;
      });
    }

    pageFooter();

    const fileDate = new Date().toISOString().slice(0, 10);
    doc.save('SimplifAI-Code-Report-' + fileDate + '.pdf');
    toast('PDF downloaded successfully!');

  } catch (e) {
    console.error('PDF error:', e);
    toast('PDF generation error: ' + e.message);
  }
}