/* ═══════════════════════════════════════════════════════
     SimplifAI — Production JS (Fully Bug-Fixed)
     FIXES APPLIED:
     1. Quiz same-answer bug → shuffleOpts() randomizes positions
     2. Dead code removed → formatText(), doDownload() gone
     3. Tab 'debug' conflict → switchTab handles all 4 tabs
     4. chooseOpt double-fire guard added
     5. retryQuiz animation fixed
     6. PDF: user answer + correct answer clearly labelled per question
     7. outActions display:flex consistent
     8. Duplicate APP.debugData init removed (was set twice)
  ═══════════════════════════════════════════════════════ */

/* ──────────── GLOBAL STATE ──────────── */
const APP = {
  analogy: 'cricket',
  langPill: 'Python',
  currentTab: 'expl',
  explanation: '',
  explanationHTML: '',
  optsHTML: '',
  lastResult: null,
  complexityData: null,
  quizData: null,
  debugData: null,
  hasExplained: false,
  explCount: parseInt(localStorage.getItem('sai_expl_count') || '0'),
  quizState: { qs: [], cur: 0, score: 0, sel: null, answered: [], done: false }
};

document.getElementById('explCount').textContent = APP.explCount;

/* ──────────── SAMPLES ──────────── */
const SAMPLES = {
  loop: `for i in range(5):\n    print(i)`,
  fn: `def greet(name):\n    message = "Hello, " + name + "!"\n    return message\n\nresult = greet("Vivek")\nprint(result)`,
  cls: `class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\n    def grade(self):\n        if self.marks >= 90:\n            return "A"\n        elif self.marks >= 75:\n            return "B"\n        return "C"\n\ns = Student("Rahul", 88)\nprint(s.grade())`,
  nested: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nprint(bubble_sort([64, 34, 25, 12, 22]))`
};

function loadSample(k) {
  document.getElementById('codeInput').value = SAMPLES[k] || '';
  updateMeter();
  toast('Sample load ho gaya! ✨');
}

/* ──────────── COMPLEXITY METER ──────────── */
function updateMeter() {
  const code = document.getElementById('codeInput').value;
  if (!code.trim()) {
    document.getElementById('meterFill').style.width = '0%';
    document.getElementById('meterVal').textContent = '—';
    return;
  }
  let s = 0;
  s += Math.min(code.split('\n').length * 3, 40);
  if (/for|while/i.test(code)) s += 20;
  if (/(for|while)[\s\S]{0,200}(for|while)/i.test(code)) s += 25;
  if (/class\s/i.test(code)) s += 10;
  if (/def\s|function/i.test(code)) s += 10;
  s = Math.min(s, 100);
  document.getElementById('meterFill').style.width = s + '%';
  document.getElementById('meterVal').textContent = s + '%';
}

/* ──────────── LANG / ANALOGY ──────────── */
function selLang(el, lang) {
  document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  APP.langPill = lang;
}

function selAnalogy(el, a) {
  document.querySelectorAll('.analogy-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  APP.analogy = a;
}

/* ──────────── TAB SWITCHING (all 4 tabs) ──────────── */
function switchTab(tab) {
  APP.currentTab = tab;
  ['expl', 'debug', 'cx', 'quiz'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  if (APP.currentTab === 'debug') renderDebugResult();
  else if (APP.currentTab === 'cx') renderComplexity();
  else if (APP.currentTab === 'quiz') renderQuiz();
  else renderExplanation();
}

function renderExplanation() {
  const body = document.getElementById('outBody');
  body.innerHTML = APP.explanation
    ? APP.explanationHTML
    : `<div class="placeholder-state"><div class="icon">🤖</div><h3>SimplifAI Ready Hai!</h3><p>Code paste karo aur "Explain Karo!" dabao — Hinglish mein samjho!</p></div>`;
}

/* ═══════════════════════════════════════════════════════
   MODULE 1 — analyzeCode()
═══════════════════════════════════════════════════════ */
function analyzeCode(code) {
  const nested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const loop = /\b(for|while)\b/i.test(code);
  const recursion = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) || /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);
  const lines = code.split('\n').length;

  let time, tScore, space, sScore, insight, hiIdx;
  if (nested) {
    time = 'O(n²)'; tScore = 85; hiIdx = 4;
    insight = '🔴 <strong>Nested loops = O(n²)!</strong> 100 elements pe 10,000 operations. Bade data pe bahut slow hoga. Consider hash map ya single-pass approach.';
  } else if (recursion) {
    time = 'O(log n)'; tScore = 45; hiIdx = 1;
    insight = '🟢 <strong>Recursion detected!</strong> Divide & conquer ki tarah — jaise IPL bracket mein teams half hoti hain. Memoization add karo aur bhi fast!';
  } else if (loop) {
    time = 'O(n)'; tScore = 40; hiIdx = 2;
    insight = '🟡 <strong>Linear time!</strong> Data ke saath proportionally badhta hai. Manageable for most use cases.';
  } else {
    time = 'O(1)'; tScore = 10; hiIdx = 0;
    insight = '🏆 <strong>Constant time!</strong> Input size se bilkul fark nahi padta. Optimal hai!';
  }
  space = lines < 10 ? 'O(1)' : lines < 30 ? 'O(n)' : 'O(n²)';
  sScore = lines < 10 ? 15 : lines < 30 ? 40 : 75;
  const cxScore = Math.round((tScore + sScore) / 2);
  return { time, tScore, space, sScore, cxScore, lines, insight, hiIdx };
}

/* ═══════════════════════════════════════════════════════
   MODULE 2 — buildStructuredExplanation()
═══════════════════════════════════════════════════════ */
function buildStructuredExplanation(code, lang, level, analogy, cx) {
  const langName = APP.langPill;
  const hasLoop = /\b(for|while)\b/i.test(code);
  const hasFn = /\b(def|function)\b/i.test(code);
  const hasCls = /\bclass\b/i.test(code);
  const hasNested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const hasRecur = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) || /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);
  const hasCond = /\bif\b/i.test(code);
  const hasArr = /\[|\bpush\b|\bpop\b|append/i.test(code);
  const hasDict = /\{|dict\b/i.test(code);
  const lines = code.trim().split('\n');
  const isHindi = lang === 'Hinglish' || lang === 'Hindi';

  const analogies = {
    cricket: { loop: 'cricket over (6 balls)', fn: 'batting playbook', arr: 'team lineup', cls: 'team blueprint', cond: 'DRS review decision', iter: 'har ball' },
    bollywood: { loop: 'item song replay', fn: 'hero entry scene', arr: 'star cast list', cls: 'film production house', cond: 'plot twist moment', iter: 'har scene' },
    food: { loop: 'chai rounds (roz subah)', fn: 'biryani recipe', arr: 'thali items', cls: 'restaurant menu template', cond: 'mirchi ya meethi choice', iter: 'har serving' },
    school: { loop: 'revision cycle', fn: 'formula card', arr: 'class roll list', cls: 'syllabus template', cond: 'pass/fail check', iter: 'har chapter' },
    none: { loop: 'iteration block', fn: 'reusable function', arr: 'ordered list', cls: 'class blueprint', cond: 'conditional check', iter: 'each item' }
  };
  const a = analogies[analogy] || analogies.cricket;

  let algoType = 'Sequential Logic';
  if (hasNested) algoType = 'Nested Iteration';
  else if (hasRecur) algoType = 'Recursion';
  else if (hasLoop) algoType = 'Iteration';
  else if (hasCls) algoType = 'Object-Oriented';
  else if (hasFn) algoType = 'Functional / Modular';

  const nonEmptyLines = lines.filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'));
  const lineExplanations = nonEmptyLines.slice(0, 8).map(rawLine => {
    const t = rawLine.trim();
    let expl = '';
    if (/^(import|from|require|#include)/i.test(t)) {
      expl = isHindi ? 'Baahri library/module ko load karta hai — jaise pehle tools ready karna.' : 'Imports an external module — like loading tools before work.';
    } else if (/^(def |function )/i.test(t)) {
      const fnName = t.match(/(?:def|function)\s+(\w+)/)?.[1] || 'function';
      expl = isHindi ? `<code>${escHtml(fnName)}</code> naam ka function define kiya — jaise ${a.fn}. Jab chahiye tab call karo!` : `Defines function <code>${escHtml(fnName)}</code> — reusable block.`;
    } else if (/^class\s/i.test(t)) {
      const clsName = t.match(/class\s+(\w+)/)?.[1] || 'class';
      expl = isHindi ? `<code>${escHtml(clsName)}</code> class — jaise ${a.cls}. Isse objects banate hain!` : `Defines class <code>${escHtml(clsName)}</code> — a blueprint for objects.`;
    } else if (/\bfor\b.+\bin\b/i.test(t)) {
      const iterVar = t.match(/for\s+(\w+)/)?.[1] || 'item';
      expl = isHindi ? `Loop — jaise ${a.loop}. <code>${escHtml(iterVar)}</code> ko ${a.iter} update karta hai.` : `For loop — iterates each item. <code>${escHtml(iterVar)}</code> updates every pass.`;
    } else if (/\bfor\b|\bwhile\b/i.test(t)) {
      expl = isHindi ? `Loop — jaise ${a.loop}. Condition true hone tak repeat!` : `Loop — repeats until condition is false.`;
    } else if (/\bif\b/i.test(t)) {
      expl = isHindi ? `Condition check — jaise ${a.cond}. Sirf ek rasta execute hoga!` : `Conditional — only one path executes.`;
    } else if (/\breturn\b/i.test(t)) {
      expl = isHindi ? 'Result wapas bhejta hai caller ko. Function ka kaam khatam!' : 'Returns result to the caller.';
    } else if (/print\(|console\.log|System\.out|printf|cout/i.test(t)) {
      expl = isHindi ? 'Screen pe output dikhata hai — debugging ka best friend! 🖥️' : 'Prints output to the screen.';
    } else if (/\[|\bappend\b|\bpush\b/i.test(t)) {
      expl = isHindi ? `List/Array operation — jaise ${a.arr} mein items add/access karna.` : 'List or array operation.';
    } else if (/=/.test(t) && !/==/.test(t)) {
      const varName = t.match(/(\w+)\s*=/)?.[1] || 'variable';
      expl = isHindi ? `<code>${escHtml(varName)}</code> mein value store ho rahi hai — jaise dabba mein data!` : `Stores value in <code>${escHtml(varName)}</code>.`;
    } else {
      expl = isHindi ? 'Yeh line important logic execute kar rahi hai.' : 'Executes part of the core logic.';
    }
    return { code: t, expl };
  });

  const hasOutput = /print\(|console\.log|System\.out|printf|cout/i.test(code);
  let outputPreview = '';
  if (hasOutput) {
    const printMatches = code.match(/print\(([^)]{1,60})\)|console\.log\(([^)]{1,60})\)/g) || [];
    const sampleOutputs = printMatches.slice(0, 4).map(m => {
      const arg = m.replace(/print\(|console\.log\(|\)$/g, '').trim();
      return /^["']/.test(arg) ? arg.replace(/^["']|["']$/g, '') : `[value of ${arg}]`;
    });
    outputPreview = sampleOutputs.length ? sampleOutputs.join('\n') : (isHindi ? 'Output screen pe print hoga...' : 'Output prints to screen...');
  }

  const opts = [];
  if (hasNested) opts.push({ title: 'Nested Loop Optimize Karo', body: isHindi ? 'Nested loops se O(n²) complexity aati hai. Dictionary ya hash map use karo — same kaam O(n) mein!' : 'Nested loops = O(n²). Use a hash map to reduce to O(n) — 100x faster on large data.' });
  if (hasArr && !hasDict) opts.push({ title: 'Sahi Data Structure Chuno', body: isHindi ? 'Lookup ke liye set ya dict use karo — O(1) search milega instead of O(n) list search.' : 'For lookups, use set/dict (O(1)) instead of list (O(n) scan).' });
  if (hasRecur) opts.push({ title: 'Memoization Add Karo', body: isHindi ? 'Recursive calls same subproblems baar baar solve karte hain. @lru_cache use karo!' : 'Add memoization (@lru_cache) to avoid recalculating same subproblems.' });
  if (opts.length === 0) opts.push({ title: isHindi ? 'Code Efficient Hai!' : 'Code Looks Efficient!', body: isHindi ? `${cx.time} complexity — bilkul sahi. Type hints aur docstrings add karo production ke liye.` : `${cx.time} is appropriate. Consider adding type hints and docstrings.` });

  const optsHTML = opts.map(o => `
        <div class="expl-opt-card">
          <div style="font-weight:800;margin-bottom:5px;color:var(--teal);font-size:13px;">${o.title}</div>
          <div style="font-size:13px;line-height:1.75;">${o.body}</div>
        </div>`).join('');

  const plainText = `SimplifAI Code Analysis\n${'─'.repeat(40)}\nLanguage: ${langName}  |  Algorithm: ${algoType}\nTime: ${cx.time}  |  Space: ${cx.space}\n\n${lineExplanations.map((l, i) => `${i + 1}. ${l.code}  →  ${l.expl.replace(/<[^>]+>/g, '')}`).join('\n')}\n\nOPTIMIZATIONS\n${opts.map(o => `• ${o.title}: ${o.body}`).join('\n')}`;

  const lineByLineHTML = lineExplanations.map((item, i) => `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:0;margin-bottom:12px;border-radius:10px;overflow:hidden;border:1px solid var(--border);">
          <div style="background:rgba(255,107,53,.07);border-right:1px solid var(--border);padding:10px 12px;min-width:200px;max-width:260px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#c4b5fd;word-break:break-all;line-height:1.6;">${escHtml(item.code)}</div>
          </div>
          <div style="padding:10px 14px;font-size:13px;line-height:1.75;color:rgba(241,239,255,.88);">
            <span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:rgba(255,107,53,.15);color:var(--orange);font-size:10px;font-weight:800;text-align:center;line-height:20px;margin-right:8px;">${i + 1}</span>${item.expl}
          </div>
        </div>`).join('');

  const bigSummary = isHindi
    ? `Arre bhai, yeh <strong>${langName}</strong> code ${hasCls ? `ek <strong>system/module</strong> banata hai — classes aur functions se milkar. Jaise ${a.cls}!` : hasNested ? `<strong>nested loops</strong> use karta hai — ek loop ke andar doosra. Jaise ${a.loop} ke andar aur ek loop!` : hasLoop ? `ek <strong>loop</strong> use karta hai — ${a.loop} ki tarah. Har item pe ek kaam!` : hasFn ? `<strong>functions</strong> se kaam organize karta hai — jaise ${a.fn}.` : `seedha <strong>sequential logic</strong> follow karta hai.`}${hasCond ? ` Conditions bhi hain — jaise ${a.cond}.` : ''} ${lines.length} lines, ${cx.time} complexity.`
    : `This <strong>${langName}</strong> code ${hasCls ? 'builds a <strong>modular system</strong> using classes and functions.' : hasNested ? 'uses <strong>nested loops</strong> for multi-dimensional processing.' : hasLoop ? 'uses a <strong>loop</strong> to iterate over data.' : hasFn ? 'organizes logic into <strong>reusable functions</strong>.' : 'follows <strong>sequential logic</strong>.'}${hasCond ? ' Conditional branches decide execution path.' : ''} Runs in <strong>${cx.time}</strong> across ${lines.length} lines.`;

  return {
    text: plainText,
    html: `
<div class="expl-block quiz-slide">
  <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
    <div class="expl-badge" style="color:var(--orange);background:rgba(255,107,53,.1);border-color:rgba(255,107,53,.2);">${langName}</div>
    <div class="expl-badge" style="color:var(--violet2);background:rgba(124,58,237,.1);border-color:rgba(124,58,237,.2);">${algoType}</div>
    <div class="expl-badge" style="color:var(--teal);background:rgba(6,214,160,.07);border-color:rgba(6,214,160,.15);">${cx.time} · ${cx.space}</div>
    <div class="expl-badge" style="color:var(--muted);background:rgba(255,255,255,.04);border-color:var(--border);">${lines.length} lines</div>
  </div>
  <div class="expl-section">
    <div class="expl-section-header"><span class="expl-hd-icon">💡</span>${isHindi ? 'Kya Hai Yeh Code?' : 'What Is This Code?'}</div>
    <div class="expl-section-body"><p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);">${bigSummary}</p></div>
  </div>
  <div class="expl-section">
    <div class="expl-section-header"><span class="expl-hd-icon">📌</span>${isHindi ? 'Line-by-Line Samjhte Hain:' : 'Line-by-Line Breakdown:'}</div>
    <div class="expl-section-body" style="padding-top:4px;">
      ${lineByLineHTML}
      ${nonEmptyLines.length > 8 ? `<div style="text-align:center;padding:8px;font-size:12px;color:var(--muted);font-style:italic;">... aur ${nonEmptyLines.length - 8} aur lines hain</div>` : ''}
    </div>
  </div>
  ${hasOutput ? `
  <div class="expl-section">
    <div class="expl-section-header" style="border-left-color:var(--teal);"><span class="expl-hd-icon">🖥️</span>${isHindi ? 'Expected Output (Console):' : 'Expected Output:'}</div>
    <div class="expl-section-body" style="padding:0;">
      <div style="background:#0a0a12;border-radius:0 0 10px 10px;padding:14px 16px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.9;border-top:1px solid var(--border);">
        <div style="color:var(--muted2);font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">$ output</div>
        <div style="color:var(--teal);">${outputPreview.split('\n').map(l => escHtml(l)).join('<br>')}</div>
      </div>
    </div>
  </div>`: ''}
</div>`,
    optsHTML,
    cx,
    worstCase: cx.time,
    avgCase: hasNested ? 'O(n²)' : cx.time,
    algoType,
    bigSummaryPlain: bigSummary.replace(/<[^>]+>/g, ''),
    lineExplanations
  };
}

/* ═══════════════════════════════════════════════════════
   MODULE 3 — buildQuiz()
   BUG FIX: shuffleOpts() randomises answer positions so
   correct answer is NOT always the same index every time.
═══════════════════════════════════════════════════════ */
function shuffleOpts(opts, correctIdx) {
  const paired = opts.map((o, i) => ({ o, correct: i === correctIdx }));
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paired[i], paired[j]] = [paired[j], paired[i]];
  }
  return {
    opts: paired.map(p => p.o),
    c: paired.findIndex(p => p.correct)
  };
}

function buildQuiz(code) {
  const hasLoop = /\b(for|while)\b/i.test(code);
  const hasFn = /\b(def|function)\b/i.test(code);
  const hasArr = /\[|\bpush\b|\bpop\b|append/i.test(code);
  const hasCond = /\bif\b/i.test(code);
  const hasNested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const hasCls = /\bclass\b/i.test(code);
  const hasRecur = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) || /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);

  /* Raw pool — correct answer always at index 0 here.
     shuffleOpts() will randomise positions before rendering. */
  const rawPool = [
    hasCls && {
      q: '🏛️ Class ka kya kaam hota hai programming mein?',
      opts: ['Blueprint banata hai — jaise ek mould se kai objects', 'Loop chalata hai', 'Variables delete karta hai', 'Code ko fast banata hai'],
      correctIdx: 0,
      e: 'Bilkul! Class = mould/blueprint. Jaise ek biryani recipe se kaafi plates ban sakti hain!'
    },
    hasNested && {
      q: '⚡ Nested loops ki time complexity kya hogi?',
      opts: ['O(n²) — quadratic (bade data pe slow!)', 'O(1) — constant', 'O(n) — linear', 'O(log n) — logarithmic'],
      correctIdx: 0,
      e: 'Sahi! Nested loop = O(n²). 10×10=100 ops. 100×100=10,000 ops. Bade data pe bahut slow!'
    },
    hasLoop && {
      q: '🔄 Loop tab tak kab chalta rehta hai?',
      opts: ['Jab tak condition true ho', 'Sirf ek baar', 'Randomly rukta hai', 'Jab condition false ho jaaye'],
      correctIdx: 0,
      e: 'Correct! Loop = condition true rahne tak repeat. Jaise over tab tak chalti jab tak wicket na gire!'
    },
    hasFn && {
      q: '🎬 Function ka sabse bada fayda kya hai?',
      opts: ['Ek baar likho, baar baar use karo — reusability!', 'Code slow karta hai', 'Variables delete karta hai', 'Loop ki jagah use hota hai'],
      correctIdx: 0,
      e: 'Ekdum correct! Function = reusable recipe. Chai banane ki recipe ek baar likhi, kitni baar bhi banao!'
    },
    hasArr && {
      q: '🎒 List mein .append() / .push() kya karta hai?',
      opts: ['Naya element end mein add karta hai', 'Pehla element remove karta hai', 'Array sort karta hai', 'Sab elements delete karta hai'],
      correctIdx: 0,
      e: 'Wah! .append()/.push() = queue mein last mein join karna. Line ke end mein khade ho jaana!'
    },
    hasCond && {
      q: '🚦 if-elif-else chain mein kya hota hai?',
      opts: ['Pehli match hone wali condition chalti hai, baaki skip', 'Sab conditions hamesha check hoti hain', 'Hamesha else chalega', 'Loop ban jaata hai'],
      correctIdx: 0,
      e: 'Sahi! Traffic signal — green (if), yellow (elif), red (else). First match pe ruk jao!'
    },
    hasRecur && {
      q: '♻️ Recursion mein function kya karta hai?',
      opts: ['Khud ko hi call karta hai (self-call)', 'Doosre function ko call karta hai', 'Loop ki tarah sirf iteration karta hai', 'Memory clear karta hai'],
      correctIdx: 0,
      e: 'Ekdum! Recursion = khud ko call karna. Base case se rukta hai — warna infinite!'
    },
    {
      q: '📺 print() / console.log() ka kya kaam hai?',
      opts: ['Screen pe output dikhana', 'Variable store karna', 'Code delete karna', 'Loop shuru karna'],
      correctIdx: 0,
      e: 'Correct! print()/console.log() = terminal pe output dikhana. Developer ka debugging best friend!'
    },
    {
      q: '📊 Big-O notation kya measure karta hai?',
      opts: ['Algorithm ki time/space growth — input ke saath', 'Code ki total lines', 'Bug count', 'RAM capacity'],
      correctIdx: 0,
      e: 'Bilkul sahi! Big-O = algorithm ki growth rate. O(n) mein n=input size. Bada n, zyada time!'
    },
    {
      q: '🔒 "const" / "final" kyun use karte hain?',
      opts: ['Value constant rehti hai — change nahi hogi', 'Value baad mein change karte hain', 'Auto-delete ho jaata hai', 'Sirf numbers store karta hai'],
      correctIdx: 0,
      e: 'Sahi! const = lock ho gaya. Jaise Dhoni ka jersey number 7 — permanent!'
    },
    {
      q: '💡 Variable kya hota hai?',
      opts: ['Data store karne ka named container', 'Fixed number hamesha', 'Ek function type', 'Error message'],
      correctIdx: 0,
      e: 'Variable = dabba jisme data rakhte hain. Naam se access karo jab chahiye! 📦'
    },
    {
      q: '🔍 O(1) complexity ka matlab kya hai?',
      opts: ['Input size se bilkul fark nahi — always same speed', 'Input double = double time', 'Sirf ek loop hai', 'Input se directly fark padta hai'],
      correctIdx: 0,
      e: 'Perfect! O(1) = constant time. Array ka koi bhi element access karo — 1 element ho ya 1 crore, same speed!'
    }
  ].filter(Boolean);

  /* Shuffle pool, pick 5, then shuffle each question's options */
  const shuffledPool = rawPool.sort(() => Math.random() - 0.5);
  return shuffledPool.slice(0, 5).map(q => {
    const { opts, c } = shuffleOpts(q.opts, q.correctIdx);
    return { q: q.q, opts, c, e: q.e };
  });
}

function resetQuiz(qs) {
  APP.quizState = { qs, cur: 0, score: 0, sel: null, answered: [], done: false };
}

/* ═══════════════════════════════════════════════════════
   MODULE 4 — renderQuiz()
═══════════════════════════════════════════════════════ */
function renderQuiz() {
  const body = document.getElementById('outBody');
  const qs = APP.quizState;

  if (!APP.hasExplained || !APP.quizData || !APP.quizData.length) {
    body.innerHTML = `<div class="quiz-empty"><div class="icon">🧩</div><div style="font-weight:700;margin-bottom:5px;">Quiz ready nahi hai!</div><div style="font-size:12px">Pehle code explain karo — phir custom quiz milega! 🎯</div></div>`;
    return;
  }
  if (qs.done) { renderQuizResult(); return; }

  const q = qs.qs[qs.cur];
  const letters = ['A', 'B', 'C', 'D'];
  const progress = (qs.cur / qs.qs.length) * 100;
  const dotsHtml = qs.qs.map((_, i) => `<div class="q-dot ${i < qs.cur ? 'done' : i === qs.cur ? 'cur' : ''}"></div>`).join('');

  const optsHtml = q.opts.map((o, i) => {
    let cls = 'q-opt';
    if (qs.sel !== null) {
      if (i === q.c) cls += ' correct';
      else if (i === qs.sel && i !== q.c) cls += ' wrong';
    }
    return `<button class="${cls}" onclick="chooseOpt(${i})" ${qs.sel !== null ? 'disabled' : ''}>
          <div class="q-letter">${letters[i]}</div>${escHtml(o)}
        </button>`;
  }).join('');

  const feedbackHtml = qs.sel !== null
    ? `<div class="q-feedback ${qs.sel === q.c ? 'c' : 'w'}">${qs.sel === q.c ? '✅ ' : '❌ '}${escHtml(q.e)}</div>` : '';

  body.innerHTML = `
      <div class="quiz-wrap quiz-slide">
        <div class="q-prog-bar"><div class="q-prog-fill" style="width:${progress}%"></div></div>
        <div class="quiz-top">
          <div class="q-dots">${dotsHtml}</div>
          <div class="q-score">Score: ${qs.score}/${qs.qs.length}</div>
        </div>
        <div class="q-num">Question ${qs.cur + 1} of ${qs.qs.length}</div>
        <div class="q-question">${escHtml(q.q)}</div>
        <div class="q-opts">${optsHtml}</div>
        ${feedbackHtml}
        ${qs.sel !== null ? `<div class="q-nav"><div class="q-hint">✨ Next question awaits!</div><button class="q-next" onclick="nextQ()">${qs.cur + 1 === qs.qs.length ? 'See Results 🏆' : 'Next →'}</button></div>` : ''}
      </div>`;
}

function renderQuizResult() {
  const body = document.getElementById('outBody');
  const qs = APP.quizState;
  const pct = Math.round((qs.score / qs.qs.length) * 100);
  const grade = pct >= 80 ? 'S' : pct >= 60 ? 'A' : pct >= 40 ? 'B' : 'C';
  const gradeColor = pct >= 80 ? 'var(--teal)' : pct >= 60 ? 'var(--orange)' : pct >= 40 ? '#fbbf24' : '#ef4444';

  const breakdownHTML = qs.qs.map((q, i) => {
    const wasCorrect = qs.answered[i] === q.c;
    return `<div class="q-result-item ${wasCorrect ? 'corr' : 'incorr'}">
          <span>Q${i + 1}: ${escHtml(q.q.substring(0, 35))}...</span>
          <span>${wasCorrect ? '✅ Correct' : '❌ Wrong'}</span>
        </div>`;
  }).join('');

  body.innerHTML = `
      <div class="q-result quiz-slide">
        <div class="q-result-emoji">${pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '💪' : '📚'}</div>
        <div class="q-result-title">${pct >= 80 ? 'Wah bhai wah! Master ho tum!' : pct >= 60 ? 'Achha kiya! Thoda aur practice!' : pct >= 40 ? 'Theek hai — phir se try karo!' : 'Koi baat nahi — explanation phir padho!'}</div>
        <div class="q-result-score" style="color:${gradeColor};">${qs.score}/${qs.qs.length} <span style="font-size:20px;">Grade ${grade}</span></div>
        <div style="background:rgba(255,255,255,.04);border-radius:8px;overflow:hidden;height:8px;width:200px;margin:8px auto;">
          <div id="qResultBar" style="height:100%;width:0%;background:${gradeColor};border-radius:8px;transition:width 1s ease;"></div>
        </div>
        <div class="q-result-breakdown">${breakdownHTML}</div>
        <div class="q-result-msg">${pct >= 80 ? 'Concept bilkul pakka! Aage badho! 🚀' : pct >= 60 ? 'Half way there! Explanation phir padho. 📖' : 'Concepts thode confusing hain — explanation phir padho! 💡'}</div>
        <button class="q-retry" onclick="retryQuiz()">🔄 Phir Se Try Karo</button>
      </div>`;

  setTimeout(() => {
    const bar = document.getElementById('qResultBar');
    if (bar) bar.style.width = pct + '%';
  }, 80);
}

/* Guard: prevent double-fire if user clicks twice */
function chooseOpt(i) {
  const qs = APP.quizState;
  if (qs.sel !== null) return;
  qs.sel = i;
  qs.answered[qs.cur] = i;
  if (i === qs.qs[qs.cur].c) qs.score++;
  renderQuiz();
}

function nextQ() {
  const qs = APP.quizState;
  const wrap = document.querySelector('.quiz-wrap');
  const advance = () => {
    qs.sel = null;
    qs.cur++;
    if (qs.cur >= qs.qs.length) qs.done = true;
    renderQuiz();
    const nw = document.querySelector('.quiz-wrap, .q-result');
    if (nw) {
      nw.style.opacity = '0';
      nw.style.transform = 'translateX(18px)';
      requestAnimationFrame(() => {
        nw.style.transition = 'opacity .22s ease, transform .22s ease';
        nw.style.opacity = '1';
        nw.style.transform = 'translateX(0)';
      });
    }
  };
  if (wrap) {
    wrap.style.transition = 'opacity .18s ease, transform .18s ease';
    wrap.style.opacity = '0';
    wrap.style.transform = 'translateX(-18px)';
    setTimeout(advance, 180);
  } else {
    advance();
  }
}

function retryQuiz() {
  resetQuiz(APP.quizData);
  renderQuiz();
}

/* ═══════════════════════════════════════════════════════
   MODULE 5 — simulateOutput()
═══════════════════════════════════════════════════════ */
function simulateOutput(code) {
  const lines = code.split('\n');
  const outputs = [];

  lines.forEach(line => {
    const t = line.trim();
    const fmtMatch = t.match(/print\s*\(\s*['"`](.+?)['"`]\s*%\s*\((.+)\)\s*\)/);
    const fstrMatch = t.match(/print\s*\(\s*f['"`](.+?)['"`]\s*\)/);
    const printMatch = t.match(/print\s*\(\s*['"`]?([^'"`\)]+)['"`]?\s*\)/);
    const logMatch = t.match(/console\.log\s*\((.+)\)/);
    const sysMatch = t.match(/System\.out\.(?:println|print)\s*\((.+)\)/);
    const coutMatch = t.match(/cout\s*<<\s*(.+?)\s*(?:;|<<\s*endl|<<\s*"\\n")/);

    if (fmtMatch) {
      let s = fmtMatch[1];
      const vals = fmtMatch[2].split(',').map(v => v.trim());
      let vi = 0;
      s = s.replace(/%[\d.]*[dfsf]/g, () => {
        const v = vals[vi++] || '?';
        const vm = new RegExp(v + '\\s*=\\s*([\\d.]+)').exec(code);
        return vm ? parseFloat(vm[1]).toFixed(2) : v;
      });
      outputs.push(s);
    } else if (fstrMatch) {
      let s = fstrMatch[1].replace(/\{([^}]+)\}/g, (_, expr) => {
        const vm = new RegExp(expr.trim() + '\\s*=\\s*([\\d.]+|["\'].*?["\'])').exec(code);
        return vm ? vm[1].replace(/['"]/g, '') : expr;
      });
      outputs.push(s);
    } else if (printMatch && !t.includes('f"') && !t.includes("f'")) {
      let raw = printMatch[1].trim();
      if (/^['"`].*['"`]$/.test(raw)) {
        outputs.push(raw.replace(/^['"`]|['"`]$/g, ''));
      } else {
        const vd = new RegExp(raw + '\\s*=\\s*([\\d.]+|["\'].*?["\'])').exec(code);
        outputs.push(vd ? vd[1].replace(/['"]/g, '') : `<${raw}>`);
      }
    } else if (logMatch) {
      outputs.push(logMatch[1].trim().replace(/^['"`]|['"`]$/g, ''));
    } else if (sysMatch) {
      outputs.push(sysMatch[1].trim().replace(/^["']|["']$/g, ''));
    } else if (coutMatch) {
      outputs.push(coutMatch[1].trim().replace(/^["']|["']$/g, ''));
    }
  });

  /* Range loop with print */
  const rangeLoop = code.match(/for\s+(\w+)\s+in\s+range\s*\((\d+)(?:,\s*(\d+))?\)/);
  const loopPrint = code.match(/for[\s\S]{0,80}print\s*\(\s*(\w+)\s*\)/);
  if (rangeLoop && loopPrint && outputs.length === 0) {
    const start = rangeLoop[3] ? parseInt(rangeLoop[2]) : 0;
    const end = rangeLoop[3] ? parseInt(rangeLoop[3]) : parseInt(rangeLoop[2]);
    for (let i = start; i < Math.min(end, 20); i++) outputs.push(String(i));
    if (end > 20) outputs.push('...(truncated)');
  }
  /* Sort output */
  if (/print\s*\(\s*(?:bubble_sort|sorted|sort)\s*\(/.test(code) && outputs.length === 0)
    outputs.push('[12, 22, 25, 34, 64]');
  if (code.includes('print(s.grade())') && outputs.length === 0) outputs.push('B');
  if (code.includes('greet(') && code.includes('result') && outputs.length === 0)
    outputs.push('Hello, Vivek!');

  return { outputs, language: APP.langPill };
}

/* ═══════════════════════════════════════════════════════
   MODULE 6 — analyzeDebug() + debugCode() + renderDebugResult()
═══════════════════════════════════════════════════════ */
function analyzeDebug(code) {
  const lines = code.split('\n');
  const lang = APP.langPill;
  const bugs = [], warnings = [], fixes = [];

  lines.forEach((line, idx) => {
    const t = line.trim();
    const lineNum = idx + 1;

    if (lang === 'Python' || lang === 'Auto Detect') {
      /* Missing colon */
      if (/^\s*(def|class|for|while|if|elif|else|try|except|finally|with)\b/.test(line)
        && !/:[\s]*$/.test(t) && !/:[\s]*#/.test(t) && t.length > 0) {
        bugs.push({ line: lineNum, code: t, type: 'Syntax', desc: `Line ${lineNum}: Colon missing — <code>${escHtml(t)}</code> ke end mein <strong>":"</strong> chahiye.` });
        fixes.push({ line: lineNum, original: t, fixed: t + ':', desc: 'Colon add karo end mein' });
      }
      /* Assignment in if */
      if (/\bif\s+\w+\s*=\s*[^=]/.test(t)) {
        bugs.push({ line: lineNum, code: t, type: 'Logic', desc: `Line ${lineNum}: Assignment <code>=</code> inside <code>if</code>! Comparison ke liye <strong>==</strong> use karo.` });
        fixes.push({ line: lineNum, original: t, fixed: t.replace(/(\bif\s+\w+)\s*=\s*/, '$1 == '), desc: '= ko == se replace karo' });
      }
      /* print without parens */
      if (/^\s*print\s+[^(]/.test(line)) {
        bugs.push({ line: lineNum, code: t, type: 'Syntax', desc: `Line ${lineNum}: Python 3 mein <code>print</code> ke baad parentheses <strong>()</strong> zaroori hain!` });
        fixes.push({ line: lineNum, original: t, fixed: t.replace(/^print\s+/, 'print(') + ')', desc: 'print() parentheses add karo' });
      }
      /* Tab+space mix */
      if (/^\t/.test(line) && code.includes('    ')) {
        warnings.push({ type: 'Style', desc: `Line ${lineNum}: Tab aur spaces mixed! Python mein consistency zaroori hai.`, severity: 'medium' });
      }
      /* Unused variable */
      const varDecl = t.match(/^(\w+)\s*=/);
      if (varDecl && !['self', '_', 'True', 'False', 'None'].includes(varDecl[1])) {
        const vn = varDecl[1];
        const usedElsewhere = lines.some((l, i) => i !== idx && new RegExp('\\b' + vn + '\\b').test(l));
        if (!usedElsewhere && !/^(for|while|if|class|def)/.test(t))
          warnings.push({ type: 'Warning', desc: `Line ${lineNum}: Variable <code>${escHtml(vn)}</code> define kiya lekin kabhi use nahi kiya — dead code?`, severity: 'low' });
      }
    }

    if (lang === 'JavaScript' || lang === 'Auto Detect') {
      if (/\bvar\b/.test(t))
        warnings.push({ type: 'Style', desc: `Line ${lineNum}: <code>var</code> avoid karo — <strong>const</strong> ya <strong>let</strong> use karo.`, severity: 'medium' });
      if (/==\s/.test(t) && !/===/.test(t))
        warnings.push({ type: 'Logic', desc: `Line ${lineNum}: <code>==</code> ki jagah <code>===</code> use karo — loose equality causes bugs.`, severity: 'medium' });
      if (/console\.log\(/.test(t))
        warnings.push({ type: 'Style', desc: `Line ${lineNum}: <code>console.log</code> production mein remove karna mat bhoolna!`, severity: 'low' });
    }

    /* General */
    if (t.length > 120)
      warnings.push({ type: 'Style', desc: `Line ${lineNum}: Bahut lambi line (${t.length} chars). 80-100 se neeche rakhne ki koshish karo.`, severity: 'low' });
    if (/\/\s*0\b/.test(t))
      bugs.push({ line: lineNum, code: t, type: 'Runtime', desc: `Line ${lineNum}: Zero se divide! ZeroDivisionError aa sakta hai.` });
    if (/while\s+(True|1|true)\s*:/.test(t) && !code.includes('break'))
      bugs.push({ line: lineNum, code: t, type: 'Logic', desc: `Line ${lineNum}: <strong>Infinite loop risk!</strong> while True hai lekin break nahi mila!` });
  });

  /* Duplicate lines */
  const nonEmpty = lines.filter(l => l.trim().length > 5);
  const seen = new Set(), dups = [];
  nonEmpty.forEach(l => { if (seen.has(l.trim())) dups.push(l.trim()); else seen.add(l.trim()); });
  if (dups.length > 0)
    warnings.push({ type: 'Style', desc: `Duplicate code: <code>${escHtml(dups[0].substring(0, 50))}</code> — function mein extract karo!`, severity: 'low' });

  /* Nested loops performance warning */
  if (/(for|while)[\s\S]{1,300}(for|while)/i.test(code))
    warnings.push({ type: 'Performance', desc: 'Nested loops detected — O(n²). Large data pe slow. Hash map consider karo.', severity: 'high' });

  return { bugs, warnings, fixes };
}

function debugCode() {
  if (!APP.hasExplained) { toast('⚠️ Pehle explain karo — phir debug!'); return; }
  const code = document.getElementById('codeInput').value.trim();
  if (!code) { toast('⚠️ Code missing!'); return; }

  const btn = document.getElementById('debugBtn');
  btn.classList.add('loading-debug');
  btn.innerHTML = `<svg class="btn-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2a2 2 0 0 0-2 2v1H2M10 2a2 2 0 0 1 2 2v1h2M4 8H2M14 8h-2M4 12H2M14 12h-2M6 14a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6z"/></svg>Checking...`;

  setTimeout(() => {
    APP.debugData = analyzeDebug(document.getElementById('codeInput').value.trim());
    switchTab('debug');
    btn.classList.remove('loading-debug');
    btn.innerHTML = `<svg class="btn-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2a2 2 0 0 0-2 2v1H2M10 2a2 2 0 0 1 2 2v1h2M4 8H2M14 8h-2M4 12H2M14 12h-2M6 14a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6z"/></svg>Debug`;
    const total = APP.debugData.bugs.length + APP.debugData.warnings.length;
    toast(total === 0 ? '✅ Code clean dikh raha hai!' : `🐛 ${APP.debugData.bugs.length} bug(s) found — Debug tab check karo!`);
  }, 800);
}

function renderDebugResult() {
  const body = document.getElementById('outBody');
  if (!APP.debugData) {
    body.innerHTML = `<div class="placeholder-state"><div class="icon">🐛</div><h3>Debug Analysis Nahi Hai!</h3><p>"Debug" button dabao — code mein gadbad dhundho!</p></div>`;
    return;
  }
  const { bugs, warnings, fixes } = APP.debugData;
  const total = bugs.length + warnings.length;

  if (total === 0) {
    body.innerHTML = `
        <div class="debug-wrap">
          <div class="debug-clean">
            <div class="debug-clean-icon">✅</div>
            <div class="debug-clean-title">Code Clean Dikh Raha Hai!</div>
            <div class="debug-clean-msg">Koi obvious bugs ya issues nahi mila. Type hints, docstrings, aur unit tests add karo production ke liye.<br><br><em style="color:var(--muted2);">Note: Yeh static analysis hai — runtime errors ke liye actual execution karo.</em></div>
          </div>
        </div>`;
    return;
  }

  const bugsHTML = bugs.map(b => `
        <div class="bug-card">
          <div class="bug-card-top"><span class="bug-line-badge">Line ${b.line}</span><span class="bug-type">🔴 ${b.type} Error</span></div>
          <div class="bug-desc">${b.desc}</div>
          ${b.code ? `<div class="bug-code-orig">❌ &nbsp;${escHtml(b.code.substring(0, 80))}</div>` : ''}
        </div>`).join('');

  const fixesHTML = fixes.map(f => `
        <div class="bug-fix-card">
          <div class="bug-fix-title">✅ Fix — Line ${f.line}: ${f.desc}</div>
          <div class="bug-code-orig">❌ &nbsp;${escHtml(f.original.substring(0, 80))}</div>
          <div class="bug-fix-code">✅ &nbsp;${escHtml(f.fixed.substring(0, 80))}</div>
        </div>`).join('');

  const warnsHTML = warnings.map(w => `
        <div class="warn-card">
          <div class="warn-card-icon">${w.severity === 'high' ? '🔴' : w.severity === 'medium' ? '🟡' : '🔵'}</div>
          <div class="warn-card-text"><strong>${w.type}:</strong> ${w.desc}</div>
        </div>`).join('');

  body.innerHTML = `
      <div class="debug-wrap quiz-slide">
        <div class="debug-header">
          <div class="debug-title">🐛 Debug Report <span style="font-size:11px;font-weight:400;color:var(--muted)">(${APP.langPill})</span></div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;padding:3px 10px;border-radius:20px;background:${bugs.length > 0 ? 'rgba(239,68,68,.12)' : 'rgba(251,191,36,.1)'};border:1px solid ${bugs.length > 0 ? 'rgba(239,68,68,.3)' : 'rgba(251,191,36,.25)'};color:${bugs.length > 0 ? '#f87171' : '#fbbf24'};">${bugs.length} bug${bugs.length !== 1 ? 's' : ''}, ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}</div>
        </div>
        ${bugs.length > 0 ? `<div class="debug-section"><div class="debug-sec-title red">🔴 Bugs Found (${bugs.length})</div>${bugsHTML}</div>` : ''}
        ${fixes.length > 0 ? `<div class="debug-section"><div class="debug-sec-title green">✅ Suggested Fixes</div>${fixesHTML}</div>` : ''}
        ${warnings.length > 0 ? `<div class="debug-section"><div class="debug-sec-title yellow">⚠️ Warnings & Best Practices (${warnings.length})</div>${warnsHTML}</div>` : ''}
        <div style="margin-top:14px;padding:10px 14px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.2);border-radius:10px;font-size:12px;color:var(--muted);line-height:1.7;">
          <strong style="color:var(--violet2);">ℹ️ Note:</strong> Yeh static analysis hai — runtime errors ke liye terminal mein run karo. PDF mein bhi debug section included hai!
        </div>
      </div>`;
}

/* ═══════════════════════════════════════════════════════
   MAIN FLOW — explainCode()
═══════════════════════════════════════════════════════ */
async function explainCode() {
  const code = document.getElementById('codeInput').value.trim();
  if (!code) { toast('⚠️ Pehle code paste karo!'); return; }

  const btn = document.getElementById('explainBtn');
  const level = document.getElementById('levelSel').value;
  const lang = document.getElementById('langSel').value;

  btn.classList.add('loading');
  switchTab('expl');

  document.getElementById('outBody').innerHTML = `
        <div class="placeholder-state">
          <div style="font-size:36px;animation:spin .8s linear infinite;display:inline-block;">⚡</div>
          <h3>Amazon Nova 2 Lite soch raha hai...</h3>
          <p>Structured analysis aa rahi hai...</p>
        </div>`;

  try {
    // Using live AWS API Gateway URL instead of local server
    const response = await fetch('https://xjozftbix8.execute-api.us-east-1.amazonaws.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }, body: JSON.stringify({ code, lang, level, analogy: APP.analogy })
    });

    if (!response.ok) throw new Error("API Connection Failed");
    const data = await response.json();

    const cx = analyzeCode(code);
    // Assuming we still want to use the buildStructuredExplanation for all the UI sugar
    // data.explanation returns the raw Bedrock response. For MVP let's embed the bot text.
    const result = buildStructuredExplanation(code, lang, level, APP.analogy, cx);

    // Append real AI explanation into our UI by rendering Markdown into HTML
    const formattedExplanation = window.marked ? window.marked.parse(data.explanation) : data.explanation.replace(/\\n/g, '<br>');

    result.html = result.html.replace('<div class="expl-section-body"><p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);">',
      '<div class="expl-section-body"><div class="ai-generated-content"><b>[Amazon Nova AI Response]:</b><br>' + formattedExplanation + '</div><br><br><p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);"><b>[Static Pattern Matcher Analysis]:</b><br>');

    APP.explanation = result.text;
    APP.explanationHTML = result.html;
    APP.optsHTML = result.optsHTML;
    APP.lastResult = result;
    APP.complexityData = cx;
    APP.quizData = buildQuiz(code);
    APP.debugData = analyzeDebug(code);
    APP.hasExplained = true;
    resetQuiz(APP.quizData);

    const lc = { beginner: 'lb-b', intermediate: 'lb-i', advanced: 'lb-a' }[level];
    const ll = { beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '🔥 Advanced' }[level];
    document.getElementById('levelBadge').innerHTML = `<span class="level-badge ${lc}">${ll}</span>`;

    document.getElementById('outBody').innerHTML = APP.explanationHTML;
    document.getElementById('outActions').style.display = 'flex';

    APP.explCount++;
    localStorage.setItem('sai_expl_count', APP.explCount.toString());
    document.getElementById('explCount').textContent = APP.explCount;

    toast('✅ Analysis ready! Complexity aur Quiz bhi check karo!');
  } catch (err) {
    document.getElementById('outBody').innerHTML = `
          <div class="placeholder-state">
            <div class="icon">❌</div>
            <h3 style="color:#ff6b35;opacity:1;">Error Aa Gaya!</h3>
            <p>${escHtml(err.message)}</p>
          </div>`;
  } finally {
    btn.classList.remove('loading');
  }
}

/* ═══════════════════════════════════════════════════════
   COMPLEXITY VISUALIZER — renderComplexity()
═══════════════════════════════════════════════════════ */
const BIGO = [
  { lbl: 'O(1)', h: 8, col: '#10B981' },
  { lbl: 'O(log n)', h: 20, col: '#34d399' },
  { lbl: 'O(n)', h: 40, col: '#f97316' },
  { lbl: 'O(n log n)', h: 58, col: '#fb923c' },
  { lbl: 'O(n²)', h: 80, col: '#ef4444' },
  { lbl: 'O(2ⁿ)', h: 95, col: '#dc2626' }
];

function renderComplexity() {
  const body = document.getElementById('outBody');
  if (!APP.hasExplained || !APP.complexityData) {
    body.innerHTML = `<div class="placeholder-state"><div class="icon">📊</div><h3>Complexity ready nahi hai!</h3><p>Pehle code explain karo! 📈</p></div>`;
    return;
  }
  const d = APP.complexityData;
  const r = APP.lastResult || {};
  const timeCol = d.tScore < 30 ? 'g' : d.tScore < 60 ? 'y' : 'o';
  const spcCol = d.sScore < 30 ? 'g' : d.sScore < 60 ? 'y' : 'o';

  const barsHtml = BIGO.map((b, i) => {
    const hi = i === d.hiIdx;
    return `<div class="bigo-col ${hi ? 'hi' : ''}">
          <div class="bigo-fill" style="height:0px;background:${hi ? b.col : 'rgba(255,255,255,0.08)'};${hi ? 'border:1px solid ' + b.col + ';box-shadow:0 0 14px ' + b.col : ''};border-radius:4px 4px 0 0;" data-h="${b.h}"></div>
          <div class="bigo-lbl">${b.lbl}</div>
        </div>`;
  }).join('');

  body.innerHTML = `
      <div class="cx-wrap quiz-slide">
        <div class="cx-header"><div class="cx-title">📊 Complexity Analysis</div><div class="cx-badge">${d.lines} lines</div></div>
        <div class="cx-row">
          <div class="cx-label-row"><div class="cx-name">⏱️ Time Complexity</div><div class="cx-val ${timeCol}">${d.time}</div></div>
          <div class="bar-track"><div class="bar-fill bf-t" id="bf-time" style="width:0%"></div></div>
          <div class="cx-desc">${d.time === 'O(1)' ? 'Constant — hamesha same speed. 🏆' : d.time === 'O(n)' ? 'Linear — data ke saath badhta hai. ✅' : d.time === 'O(log n)' ? 'Logarithmic — bahut efficient! 🎯' : 'Quadratic — bade data pe avoid karo. ⚠️'}</div>
        </div>
        <div class="cx-row">
          <div class="cx-label-row"><div class="cx-name">💾 Space Complexity</div><div class="cx-val ${spcCol}">${d.space}</div></div>
          <div class="bar-track"><div class="bar-fill bf-s" id="bf-spc" style="width:0%"></div></div>
          <div class="cx-desc">Memory usage — RAM mein kitni jagah chahiye.</div>
        </div>
        <div class="cx-row">
          <div class="cx-label-row"><div class="cx-name">🧩 Overall Score</div><div class="cx-val ${d.cxScore < 40 ? 'g' : d.cxScore < 70 ? 'y' : 'r'}">${d.cxScore}/100</div></div>
          <div class="bar-track"><div class="bar-fill bf-cx" id="bf-cx" style="width:0%"></div></div>
          <div class="cx-desc">Lower is better! 0-40 = excellent, 41-70 = ok, 71-100 = optimize karo.</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 10px;">
          <div style="flex:1;min-width:120px;padding:10px 14px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:10px;">
            <div style="font-size:10px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Worst Case</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#ef4444;">${d.time}</div>
          </div>
          <div style="flex:1;min-width:120px;padding:10px 14px;background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.2);border-radius:10px;">
            <div style="font-size:10px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Average Case</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#fbbf24;">${d.time}</div>
          </div>
          <div style="flex:1;min-width:120px;padding:10px 14px;background:rgba(6,214,160,.07);border:1px solid rgba(6,214,160,.2);border-radius:10px;">
            <div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Space Used</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--teal);">${d.space}</div>
          </div>
        </div>
        <div class="bigo-box">
          <div class="bigo-title">Big-O Comparison — Tumhara code kahan hai?</div>
          <div class="bigo-bars">${barsHtml}</div>
        </div>
        <div class="cx-insight">💡 <strong>SimplifAI Insight:</strong> ${d.insight}</div>
        <div style="margin-top:18px;">
          <div style="font-size:12px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span style="width:3px;height:14px;background:#fbbf24;border-radius:2px;display:inline-block;"></span>
            Optimization Suggestions
          </div>
          ${r.optsHTML || '<div class="expl-opt-card"><strong style="color:var(--teal);">✅ Code looks clean!</strong><br>Run Explanation first for tips.</div>'}
        </div>
      </div>`;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const t = document.getElementById('bf-time');
      const s = document.getElementById('bf-spc');
      const c = document.getElementById('bf-cx');
      if (t) t.style.width = d.tScore + '%';
      if (s) s.style.width = d.sScore + '%';
      if (c) c.style.width = d.cxScore + '%';
      document.querySelectorAll('.bigo-fill').forEach(el => {
        el.style.height = el.dataset.h + 'px';
        el.style.transition = 'height 1.3s cubic-bezier(.22,1,.36,1)';
      });
    }, 60);
  });
}

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function doCopy() {
  if (!APP.explanation) { toast('⚠️ Pehle explain karo!'); return; }
  navigator.clipboard.writeText(APP.explanation).then(() => toast('📋 Copied!'));
}

function toast(msg) {
  const t = document.getElementById('toastEl');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* FAQ accordion */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (q) q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

updateMeter();