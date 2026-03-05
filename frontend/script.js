/* ──────────── 1. MOBILE ERROR HANDLER ──────────── */
window.onerror = function (msg, src, line) {
  document.body.style.cssText =
    'background:#09090b;color:white;padding:30px;font-family:sans-serif;min-height:100vh;';
  document.body.innerHTML =
    '<div style="max-width:400px;margin:40px auto;text-align:center;">' +
    '<div style="font-size:48px;margin-bottom:16px;">&#x26A0;&#xFE0F;</div>' +
    '<h2 style="color:#ff6b35;margin-bottom:8px;">Kuch Error Aa Gaya</h2>' +
    '<p style="color:#aaa;font-size:14px;margin-bottom:8px;">' + msg + '</p>' +
    '<p style="color:#666;font-size:12px;">Line: ' + line + '</p>' +
    '<button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;' +
    'background:#ff6b35;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;">' +
    'Reload Karo</button></div>';
  return false;
};

/* ──────────── 2. SAFE DOM HELPER ──────────── */
const $ = id => document.getElementById(id);

/* ──────────── 3. DEBOUNCE UTILITY ──────────── */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ──────────── 4. SAFE localStorage HELPERS ──────────── */
function lsGet(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
}

/* ──────────── 5. AI RESPONSE CACHE (in-memory) ──────────── */
const AI_CACHE = {};
function cacheKey(code, lang, level, analogy) {
  return [lang, level, analogy, code.trim().substring(0, 200)].join('|');
}

/* ──────────── 6. API CONFIG ──────────── */
const API_URL = 'https://xjozftbix8.execute-api.us-east-1.amazonaws.com/'; // For explain (POST /)
const RUN_API_URL = 'https://xjozftbix8.execute-api.us-east-1.amazonaws.com/run'; // For run code (POST /run)
const API_TIMEOUT = 12000;

/* ──────────── 7. GLOBAL STATE ──────────── */
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
  runOutputHTML: null,
  explCount: parseInt(lsGet('sai_expl_count', '0')),
  quizState: { qs: [], cur: 0, score: 0, sel: null, answered: [], done: false }
};

const explCountEl = $('explCount');
if (explCountEl) explCountEl.textContent = APP.explCount;

/* ──────────── 8. SAMPLES ──────────── */
const SAMPLES = {
  loop: 'for i in range(5):\n    print(i)',
  fn: 'def greet(name):\n    message = "Hello, " + name + "!"\n    return message\n\nresult = greet("Vivek")\nprint(result)',
  cls: 'class Student:\n    def __init__(self, name, marks):\n        self.name = name\n        self.marks = marks\n\n    def grade(self):\n        if self.marks >= 90:\n            return "A"\n        elif self.marks >= 75:\n            return "B"\n        return "C"\n\ns = Student("Rahul", 88)\nprint(s.grade())',
  nested: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nprint(bubble_sort([64, 34, 25, 12, 22]))'
};

function loadSample(k) {
  const ci = $('codeInput');
  if (ci) ci.value = SAMPLES[k] || '';
  updateMeter();
  toast('Sample load ho gaya!');
}

/* ──────────── 9. COMPLEXITY METER ──────────── */
function updateMeter() {
  const ci = $('codeInput');
  const fill = $('meterFill');
  const val = $('meterVal');
  if (!ci || !fill || !val) return;
  const code = ci.value;
  if (!code.trim()) { fill.style.width = '0%'; val.textContent = '--'; return; }
  let s = 0;
  s += Math.min(code.split('\n').length * 3, 40);
  if (/for|while/i.test(code)) s += 20;
  if (/(for|while)[\s\S]{0,200}(for|while)/i.test(code)) s += 25;
  if (/class\s/i.test(code)) s += 10;
  if (/def\s|function/i.test(code)) s += 10;
  s = Math.min(s, 100);
  fill.style.width = s + '%';
  val.textContent = s + '%';
}
const debouncedMeter = debounce(updateMeter, 300);

/* ──────────── 10. LANG / ANALOGY ──────────── */
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

/* ──────────── 11. TAB SWITCHING ──────────── */
function switchTab(tab) {
  APP.currentTab = tab;
  ['expl', 'debug', 'cx', 'quiz', 'run'].forEach(t => {
    const el = $('tab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  if (APP.currentTab === 'debug') renderDebugResult();
  else if (APP.currentTab === 'cx') renderComplexity();
  else if (APP.currentTab === 'quiz') renderQuiz();
  else if (APP.currentTab === 'run') renderRunTab();
  else renderExplanation();
}

/* ── Render the Output/Run tab ── */
function renderRunTab() {
  const body = $('outBody');
  if (!body) return;
  // If we already have run output stored, show it
  if (APP.runOutputHTML) {
    body.innerHTML = APP.runOutputHTML;
  } else {
    body.innerHTML =
      '<div class="placeholder-state">' +
      '<div class="icon">▶️</div>' +
      '<h3>Output Ready Nahi Hai!</h3>' +
      '<p>"Run Karo & Output Dekho" button dabao — code ka output yahan milega!</p>' +
      '</div>';
  }
}

function renderExplanation() {
  const body = $('outBody');
  if (!body) return;
  body.innerHTML = APP.explanation
    ? APP.explanationHTML
    : '<div class="placeholder-state"><div class="icon">&#x1F916;</div>' +
    '<h3>SimplifAI Ready Hai!</h3>' +
    '<p>Code paste karo aur "Explain Karo!" dabao — Hinglish mein samjho!</p></div>';
}

/* ============================================================
   MODULE 1 — analyzeCode()
   ============================================================ */
function analyzeCode(code) {
  const nested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const loop = /\b(for|while)\b/i.test(code);
  const recursion = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) ||
    /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);
  const lines = code.split('\n').length;
  let time, tScore, space, sScore, insight, hiIdx;

  if (nested) {
    time = 'O(n2)'; tScore = 85; hiIdx = 4;
    insight = 'Nested loops = O(n2)! 100 elements pe 10,000 operations. Bade data pe bahut slow. Hash map consider karo.';
  } else if (recursion) {
    time = 'O(log n)'; tScore = 45; hiIdx = 1;
    insight = 'Recursion detected! Divide & conquer approach. Memoization add karo aur bhi fast ho jayega!';
  } else if (loop) {
    time = 'O(n)'; tScore = 40; hiIdx = 2;
    insight = 'Linear time! Data ke saath proportionally badhta hai. Most use cases ke liye sahi hai.';
  } else {
    time = 'O(1)'; tScore = 10; hiIdx = 0;
    insight = 'Constant time! Input size se bilkul fark nahi padta. Optimal hai!';
  }
  space = lines < 10 ? 'O(1)' : lines < 30 ? 'O(n)' : 'O(n2)';
  sScore = lines < 10 ? 15 : lines < 30 ? 40 : 75;
  const cxScore = Math.round((tScore + sScore) / 2);
  return { time, tScore, space, sScore, cxScore, lines, insight, hiIdx };
}

/* ============================================================
   MODULE 2 — buildStructuredExplanation()
   ============================================================ */
function buildStructuredExplanation(code, lang, level, analogy, cx) {
  const langName = APP.langPill;
  const hasLoop = /\b(for|while)\b/i.test(code);
  const hasFn = /\b(def|function)\b/i.test(code);
  const hasCls = /\bclass\b/i.test(code);
  const hasNested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const hasRecur = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) ||
    /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);
  const hasCond = /\bif\b/i.test(code);
  const hasArr = /\[|\bpush\b|\bpop\b|append/i.test(code);
  const hasDict = /\{|dict\b/i.test(code);
  const lines = code.trim().split('\n');
  const isHindi = lang === 'Hinglish' || lang === 'Hindi';

  const analogies = {
    cricket: { loop: 'cricket over', fn: 'batting playbook', arr: 'team lineup', cls: 'team blueprint', cond: 'DRS review', iter: 'har ball' },
    bollywood: { loop: 'item song replay', fn: 'hero entry scene', arr: 'star cast', cls: 'film production house', cond: 'plot twist', iter: 'har scene' },
    food: { loop: 'chai rounds', fn: 'biryani recipe', arr: 'thali items', cls: 'restaurant menu template', cond: 'mirchi ya meethi', iter: 'har serving' },
    school: { loop: 'revision cycle', fn: 'formula card', arr: 'class roll', cls: 'syllabus template', cond: 'pass/fail check', iter: 'har chapter' },
    none: { loop: 'iteration', fn: 'function', arr: 'list', cls: 'blueprint', cond: 'condition', iter: 'each item' }
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
    if (/^(import|from|require|#include)/i.test(t)) expl = isHindi ? 'Baahri library load karta hai.' : 'Imports an external module.';
    else if (/^(def |function )/i.test(t)) {
      const fn = t.match(/(?:def|function)\s+(\w+)/)?.[1] || 'function';
      expl = isHindi ? escHtml(fn) + ' naam ka function — jaise ' + a.fn + '.' : 'Defines function ' + escHtml(fn) + ' — reusable block.';
    } else if (/^class\s/i.test(t)) {
      const cl = t.match(/class\s+(\w+)/)?.[1] || 'class';
      expl = isHindi ? escHtml(cl) + ' class — jaise ' + a.cls + '. Isse objects banate hain!' : 'Defines class ' + escHtml(cl) + ' — object blueprint.';
    } else if (/\bfor\b.+\bin\b/i.test(t)) {
      const iv = t.match(/for\s+(\w+)/)?.[1] || 'item';
      expl = isHindi ? 'Loop — jaise ' + a.loop + '. ' + escHtml(iv) + ' ko ' + a.iter + ' update karta hai.' : 'For loop — ' + escHtml(iv) + ' updates every pass.';
    } else if (/\bfor\b|\bwhile\b/i.test(t)) expl = isHindi ? 'Loop — condition true hone tak repeat!' : 'Loop — repeats until condition is false.';
    else if (/\bif\b/i.test(t)) expl = isHindi ? 'Condition check — jaise ' + a.cond + '. Sirf ek rasta execute hoga!' : 'Conditional — only one path executes.';
    else if (/\breturn\b/i.test(t)) expl = isHindi ? 'Result wapas bhejta hai caller ko.' : 'Returns result to the caller.';
    else if (/print\(|console\.log|System\.out|printf|cout/i.test(t))
      expl = isHindi ? 'Screen pe output dikhata hai — debugging ka best friend!' : 'Prints output to the screen.';
    else if (/\[|\bappend\b|\bpush\b/i.test(t)) expl = isHindi ? 'List/Array — jaise ' + a.arr + '.' : 'List or array operation.';
    else if (/=/.test(t) && !/==/.test(t)) {
      const vn = t.match(/(\w+)\s*=/)?.[1] || 'variable';
      expl = isHindi ? escHtml(vn) + ' mein value store ho rahi hai.' : 'Stores value in ' + escHtml(vn) + '.';
    } else expl = isHindi ? 'Yeh line important logic execute kar rahi hai.' : 'Executes part of the core logic.';
    return { code: t, expl };
  });

  const hasOutput = /print\(|console\.log|System\.out|printf|cout/i.test(code);
  let outputPreview = '';
  if (hasOutput) {
    const pm = code.match(/print\(([^)]{1,60})\)|console\.log\(([^)]{1,60})\)/g) || [];
    const so = pm.slice(0, 4).map(m => {
      const arg = m.replace(/print\(|console\.log\(|\)$/g, '').trim();
      return /^["']/.test(arg) ? arg.replace(/^["']|["']$/g, '') : '[value of ' + arg + ']';
    });
    outputPreview = so.length ? so.join('\n') : (isHindi ? 'Output screen pe print hoga...' : 'Output prints to screen...');
  }

  const opts = [];
  if (hasNested) opts.push({ title: 'Nested Loop Optimize Karo', body: isHindi ? 'Nested loops se O(n2). Hash map use karo — same kaam O(n) mein!' : 'Use a hash map to reduce O(n2) to O(n).' });
  if (hasArr && !hasDict) opts.push({ title: 'Sahi Data Structure Chuno', body: isHindi ? 'Lookup ke liye dict use karo — O(1) search milega.' : 'Use dict/set (O(1)) instead of list (O(n) scan).' });
  if (hasRecur) opts.push({ title: 'Memoization Add Karo', body: isHindi ? 'Same subproblems baar baar solve hote hain. @lru_cache try karo!' : 'Add @lru_cache to avoid recalculating subproblems.' });
  if (!opts.length) opts.push({ title: isHindi ? 'Code Efficient Hai!' : 'Code Looks Efficient!', body: isHindi ? cx.time + ' — bilkul sahi. Type hints aur docstrings bhi add karo.' : cx.time + ' is appropriate. Consider adding type hints.' });

  const optsHTML = opts.map(o =>
    '<div class="expl-opt-card">' +
    '<div style="font-weight:800;margin-bottom:5px;color:var(--teal);font-size:13px;">' + o.title + '</div>' +
    '<div style="font-size:13px;line-height:1.75;">' + o.body + '</div></div>'
  ).join('');

  const plainText =
    'SimplifAI Code Analysis\nLanguage: ' + langName + '  |  Algorithm: ' + algoType +
    '\nTime: ' + cx.time + '  |  Space: ' + cx.space + '\n\n' +
    lineExplanations.map((l, i) => (i + 1) + '. ' + l.code + '  ->  ' + l.expl.replace(/<[^>]+>/g, '')).join('\n') +
    '\n\nOPTIMIZATIONS\n' + opts.map(o => '* ' + o.title + ': ' + o.body).join('\n');

  const lineByLineHTML = lineExplanations.map((item, i) =>
    '<div style="display:grid;grid-template-columns:auto 1fr;gap:0;margin-bottom:12px;border-radius:10px;overflow:hidden;border:1px solid var(--border);">' +
    '<div style="background:rgba(255,107,53,.07);border-right:1px solid var(--border);padding:10px 12px;min-width:140px;max-width:200px;">' +
    '<code style="font-size:11px;color:#c4b5fd;word-break:break-all;line-height:1.6;white-space:pre-wrap;">' + escHtml(item.code) + '</code></div>' +
    '<div style="padding:10px 14px;font-size:13px;line-height:1.75;color:rgba(241,239,255,.88);">' +
    '<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:rgba(255,107,53,.15);color:var(--orange);font-size:10px;font-weight:800;text-align:center;line-height:20px;margin-right:8px;">' + (i + 1) + '</span>' +
    item.expl + '</div></div>'
  ).join('');

  const bigSummary = isHindi
    ? 'Yeh ' + langName + ' code ' + (hasCls ? 'ek system banata hai — classes aur functions se.' : hasNested ? 'nested loops use karta hai.' : hasLoop ? 'ek loop use karta hai — ' + a.loop + ' ki tarah.' : hasFn ? 'functions se kaam organize karta hai.' : 'sequential logic follow karta hai.') + (hasCond ? ' Conditions bhi hain.' : '') + ' ' + lines.length + ' lines, ' + cx.time + ' complexity.'
    : 'This ' + langName + ' code ' + (hasCls ? 'builds a modular system using classes.' : hasNested ? 'uses nested loops.' : hasLoop ? 'uses a loop to iterate.' : hasFn ? 'organizes logic into functions.' : 'follows sequential logic.') + (hasCond ? ' Conditional branches present.' : '') + ' Runs in ' + cx.time + ' across ' + lines.length + ' lines.';

  const html =
    '<div class="expl-block quiz-slide">' +
    '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">' +
    '<div class="expl-badge" style="color:var(--orange);background:rgba(255,107,53,.1);border-color:rgba(255,107,53,.2);">' + langName + '</div>' +
    '<div class="expl-badge" style="color:var(--violet2);background:rgba(124,58,237,.1);border-color:rgba(124,58,237,.2);">' + algoType + '</div>' +
    '<div class="expl-badge" style="color:var(--teal);background:rgba(6,214,160,.07);border-color:rgba(6,214,160,.15);">' + cx.time + ' \xb7 ' + cx.space + '</div>' +
    '<div class="expl-badge" style="color:var(--muted);background:rgba(255,255,255,.04);border-color:var(--border);">' + lines.length + ' lines</div></div>' +
    '<div class="expl-section"><div class="expl-section-header"><span class="expl-hd-icon">&#x1F4A1;</span>' + (isHindi ? 'Kya Hai Yeh Code?' : 'What Is This Code?') + '</div>' +
    '<div class="expl-section-body"><p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);">' + bigSummary + '</p></div></div>' +
    '<div class="expl-section"><div class="expl-section-header"><span class="expl-hd-icon">&#x1F4CC;</span>' + (isHindi ? 'Line-by-Line Samjhte Hain:' : 'Line-by-Line Breakdown:') + '</div>' +
    '<div class="expl-section-body" style="padding-top:4px;">' + lineByLineHTML +
    (nonEmptyLines.length > 8 ? '<div style="text-align:center;padding:8px;font-size:12px;color:var(--muted);font-style:italic;">... aur ' + (nonEmptyLines.length - 8) + ' aur lines hain</div>' : '') +
    '</div></div>' +
    (hasOutput
      ? '<div class="expl-section"><div class="expl-section-header" style="border-left-color:var(--teal);"><span class="expl-hd-icon">&#x1F5A5;&#xFE0F;</span>Expected Output:</div>' +
      '<div class="expl-section-body" style="padding:0;"><div style="background:#0a0a12;border-radius:0 0 10px 10px;padding:14px 16px;font-family:monospace;font-size:12.5px;line-height:1.9;border-top:1px solid var(--border);">' +
      '<div style="color:var(--muted2);font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">$ output</div>' +
      '<div style="color:var(--teal);">' + outputPreview.split('\n').map(l => escHtml(l)).join('<br>') + '</div></div></div></div>'
      : '') +
    '</div>';

  return { text: plainText, html, optsHTML, cx, algoType, bigSummaryPlain: bigSummary, lineExplanations };
}

/* ============================================================
   MODULE 3 — buildQuiz()
   ============================================================ */
function shuffleOpts(opts, correctIdx) {
  const paired = opts.map((o, i) => ({ o, correct: i === correctIdx }));
  for (let i = paired.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paired[i], paired[j]] = [paired[j], paired[i]];
  }
  return { opts: paired.map(p => p.o), c: paired.findIndex(p => p.correct) };
}

function buildQuiz(code) {
  const hasLoop = /\b(for|while)\b/i.test(code);
  const hasFn = /\b(def|function)\b/i.test(code);
  const hasArr = /\[|\bpush\b|\bpop\b|append/i.test(code);
  const hasCond = /\bif\b/i.test(code);
  const hasNested = /(for|while)[\s\S]{1,300}(for|while)/i.test(code);
  const hasCls = /\bclass\b/i.test(code);
  const hasRecur = /def\s+(\w+)[\s\S]*?\1\s*\(/i.test(code) ||
    /function\s+(\w+)[\s\S]*?\1\s*\(/i.test(code);

  /* ── Code-specific questions (shown only when relevant) ── */
  const codeSpecific = [
    hasCls && { q: 'Class ka kya kaam hota hai programming mein?', opts: ['Blueprint banata hai — jaise ek mould se kai objects', 'Loop chalata hai', 'Variables delete karta hai', 'Code ko fast banata hai'], correctIdx: 0, e: 'Bilkul! Class = mould/blueprint. Jaise biryani recipe se kaafi plates!' },
    hasCls && { q: 'Class se object kaise banate hain?', opts: ['ClassName() call karke — jaise Student("Rahul", 90)', 'Loop use karke', 'Import statement se', 'print() se'], correctIdx: 0, e: 'Sahi! ClassName() = constructor call. Object ban jaata hai!' },
    hasNested && { q: 'Nested loops ki time complexity kya hogi?', opts: ['O(n2) — quadratic (bade data pe slow!)', 'O(1) — constant', 'O(n) — linear', 'O(log n) — logarithmic'], correctIdx: 0, e: 'Sahi! Nested loop = O(n2). 10x10=100 ops. Bade data pe bahut slow!' },
    hasNested && { q: 'Nested loops ko optimize karne ka best tarika kya hai?', opts: ['Hash map / dictionary use karo — O(n) mein kaam hoga', 'Aur zyada loops add karo', 'Variables delete karo', 'Functions mat use karo'], correctIdx: 0, e: 'Ekdum sahi! Hash map se O(n2) ko O(n) mein reduce kar sakte ho!' },
    hasLoop && { q: 'Loop tab tak kab chalta rehta hai?', opts: ['Jab tak condition true ho', 'Sirf ek baar', 'Randomly rukta hai', 'Jab condition false ho jaaye'], correctIdx: 0, e: 'Correct! Loop = condition true rahne tak repeat.' },
    hasLoop && { q: 'for loop aur while loop mein kya fark hai?', opts: ['for = fixed iterations, while = condition-based', 'Dono bilkul same hain', 'for sirf numbers ke liye hai', 'while sirf strings ke liye hai'], correctIdx: 0, e: 'Sahi! for = pehle se pata kitni baar, while = condition check karo.' },
    hasFn && { q: 'Function ka sabse bada fayda kya hai?', opts: ['Ek baar likho, baar baar use karo — reusability!', 'Code slow karta hai', 'Variables delete karta hai', 'Loop ki jagah use hota hai'], correctIdx: 0, e: 'Ekdum correct! Function = reusable recipe. Ek baar likhi, kitni baar bhi banao!' },
    hasFn && { q: 'Function mein "return" statement ka kya kaam hai?', opts: ['Result wapas bhejta hai caller ko', 'Loop band karta hai', 'Variable delete karta hai', 'Error throw karta hai'], correctIdx: 0, e: 'Bilkul! return = kaam khatam, result wapas bhejo!' },
    hasArr && { q: 'List mein .append() / .push() kya karta hai?', opts: ['Naya element end mein add karta hai', 'Pehla element remove karta hai', 'Array sort karta hai', 'Sab elements delete karta hai'], correctIdx: 0, e: 'Wah! .append()/.push() = line ke end mein join karna.' },
    hasArr && { q: 'List ka pehla element access karne ke liye kya likhte hain?', opts: ['list[0] — index 0 se shuru hota hai', 'list[1] — pehla element', 'list[-1] — pehla element', 'list.first()'], correctIdx: 0, e: 'Sahi! Index 0 se shuru hota hai. list[0] = pehla element!' },
    hasCond && { q: 'if-elif-else chain mein kya hota hai?', opts: ['Pehli match hone wali condition chalti hai, baaki skip', 'Sab conditions hamesha check hoti hain', 'Hamesha else chalega', 'Loop ban jaata hai'], correctIdx: 0, e: 'Sahi! Traffic signal — green (if), yellow (elif), red (else). First match pe ruk jao!' },
    hasCond && { q: 'if ke andar == aur = mein kya fark hai?', opts: ['== comparison karta hai, = assignment karta hai', 'Dono same hain', '= comparison hai, == assignment hai', 'Dono sirf numbers ke liye hain'], correctIdx: 0, e: 'Bahut important! == = check karo equal hai ya nahi. = = value store karo.' },
    hasRecur && { q: 'Recursion mein function kya karta hai?', opts: ['Khud ko hi call karta hai (self-call)', 'Doosre function ko call karta hai', 'Sirf iteration karta hai', 'Memory clear karta hai'], correctIdx: 0, e: 'Ekdum! Recursion = khud ko call karna. Base case se rukta hai.' },
    hasRecur && { q: 'Recursion mein "base case" kyun zaroori hai?', opts: ['Warna infinite loop ho jaata hai — stack overflow!', 'Speed badhane ke liye', 'Memory save karne ke liye', 'Output print karne ke liye'], correctIdx: 0, e: 'Bilkul sahi! Base case nahi toh function kabhi nahi rukta — crash!' },
  ].filter(Boolean);

  /* ── General CS questions (always available) — large pool for variety ── */
  const general = [
    { q: 'print() / console.log() ka kya kaam hai?', opts: ['Screen pe output dikhana', 'Variable store karna', 'Code delete karna', 'Loop shuru karna'], correctIdx: 0, e: 'Correct! Terminal pe output dikhana — developer ka best friend!' },
    { q: 'Big-O notation kya measure karta hai?', opts: ['Algorithm ki time/space growth — input ke saath', 'Code ki total lines', 'Bug count', 'RAM capacity'], correctIdx: 0, e: 'Bilkul sahi! Big-O = algorithm ki growth rate. Bada input = zyada time.' },
    { q: '"const" / "final" kyun use karte hain?', opts: ['Value constant rehti hai — change nahi hogi', 'Value baad mein change karte hain', 'Auto-delete ho jaata hai', 'Sirf numbers store karta hai'], correctIdx: 0, e: 'Sahi! const = lock ho gaya. Permanent value!' },
    { q: 'Variable kya hota hai?', opts: ['Data store karne ka named container', 'Fixed number hamesha', 'Ek function type', 'Error message'], correctIdx: 0, e: 'Variable = dabba jisme data rakhte hain. Naam se access karo!' },
    { q: 'O(1) complexity ka matlab kya hai?', opts: ['Input size se bilkul fark nahi — always same speed', 'Input double = double time', 'Sirf ek loop hai', 'Input se fark padta hai'], correctIdx: 0, e: 'Perfect! O(1) = constant time. 1 element ho ya 1 crore — same speed!' },
    { q: 'O(n) complexity ka matlab kya hai?', opts: ['Input ke saath linearly badhta hai', 'Hamesha ek hi operation', 'Input square ke saath badhta hai', 'Logarithmic growth'], correctIdx: 0, e: 'Sahi! O(n) = linear. 10 items = 10 ops, 100 items = 100 ops.' },
    { q: 'Array aur List mein kya common hai?', opts: ['Dono ordered sequence mein data store karte hain', 'Dono sirf numbers store karte hain', 'Dono mein length change nahi hoti', 'Dono same speed pe kaam karte hain'], correctIdx: 0, e: 'Bilkul! Ordered sequence — index se access karo.' },
    { q: 'Bug kya hota hai code mein?', opts: ['Code mein galti jo unexpected behavior cause kare', 'Ek type ka insect', 'Memory unit', 'Function ka naam'], correctIdx: 0, e: 'Sahi! Bug = galti jisse program galat kaam kare ya crash ho.' },
    { q: 'Comment (#, //) likhne ka kya fayda hai?', opts: ['Code explain karta hai — dusron ke liye (aur future self ke liye!)', 'Code faster banata hai', 'Variables delete karta hai', 'Errors hatata hai'], correctIdx: 0, e: 'Bilkul! Comments = notes. 6 mahine baad khud ko samjhne ke kaam aata hai!' },
    { q: 'Compilation aur Interpretation mein kya fark hai?', opts: ['Compile = pehle pura translate, Interpret = line by line run', 'Dono same hain', 'Compile slow hai, Interpret fast hai', 'Sirf C++ compile hota hai'], correctIdx: 0, e: 'Sahi! Python = interpreted (line by line). C++ = compiled (pehle build karo).' },
    { q: 'Kya hoga agar infinite loop mein break nahi hoga?', opts: ['Program hang/crash ho jaayega — infinite loop!', 'Program faster chalega', 'Memory kam use hogi', 'Output better hogi'], correctIdx: 0, e: 'Correct! Infinite loop = program kabhi nahi rukta. CPU 100% use hogi — crash!' },
    { q: 'String kya hoti hai programming mein?', opts: ['Characters ka sequence — text data', 'Sirf numbers', 'Boolean value', 'Function type'], correctIdx: 0, e: 'Bilkul! String = text. "Hello", "Vivek", "123" — quotes mein likho.' },
    { q: 'Boolean ka matlab kya hai?', opts: ['Sirf do values — True ya False', 'Numbers ka type', 'Text data', 'List ka type'], correctIdx: 0, e: 'Sahi! Boolean = True/False. Conditions aur logic ke liye use hota hai.' },
    { q: 'Stack overflow error kab aata hai?', opts: ['Jab recursion ya function calls bahut deep ho jaaye', 'Jab variable bada ho', 'Jab loop zyada baar chale', 'Jab print zyada baar ho'], correctIdx: 0, e: 'Ekdum! Infinite recursion ya very deep function calls = stack overflow.' },
    { q: 'DRY principle ka matlab kya hai?', opts: ["Don't Repeat Yourself — code duplicate mat karo", "Do Repeat Yourself", "Debug Run Yourself", "Delete Repeat Yield"], correctIdx: 0, e: 'Wah! DRY = Don\'t Repeat Yourself. Same code baar baar likhne se bachao — functions use karo!' },
  ];

  /* ── Merge, shuffle, pick 5 fresh every time ── */
  const combined = [...codeSpecific, ...general].sort(() => Math.random() - 0.5);
  const picked = combined.slice(0, 5);

  return picked.map(q => {
    const { opts, c } = shuffleOpts(q.opts, q.correctIdx);
    return { q: q.q, opts, c, e: q.e };
  });
}

function resetQuiz(qs) {
  APP.quizState = { qs, cur: 0, score: 0, sel: null, answered: [], done: false };
}

/* ============================================================
   MODULE 4 — renderQuiz()
   ============================================================ */
function renderQuiz() {
  const body = $('outBody');
  if (!body) return;
  const qs = APP.quizState;

  if (!APP.hasExplained || !APP.quizData || !APP.quizData.length) {
    body.innerHTML =
      '<div class="quiz-empty"><div class="icon">&#x1F9E9;</div>' +
      '<div style="font-weight:700;margin-bottom:5px;">Quiz ready nahi hai!</div>' +
      '<div style="font-size:12px">Pehle code explain karo — phir custom quiz milega!</div></div>';
    return;
  }
  if (qs.done) { renderQuizResult(); return; }

  const q = qs.qs[qs.cur];
  const letters = ['A', 'B', 'C', 'D'];
  const progress = (qs.cur / qs.qs.length) * 100;
  const dotsHtml = qs.qs.map((_, i) =>
    '<div class="q-dot ' + (i < qs.cur ? 'done' : i === qs.cur ? 'cur' : '') + '"></div>'
  ).join('');

  const optsHtml = q.opts.map((o, i) => {
    let cls = 'q-opt';
    if (qs.sel !== null) {
      if (i === q.c) cls += ' correct';
      else if (i === qs.sel && i !== q.c) cls += ' wrong';
    }
    return '<button class="' + cls + '" onclick="chooseOpt(' + i + ')" ' + (qs.sel !== null ? 'disabled' : '') + '>' +
      '<div class="q-letter">' + letters[i] + '</div>' + escHtml(o) + '</button>';
  }).join('');

  const feedbackHtml = qs.sel !== null
    ? '<div class="q-feedback ' + (qs.sel === q.c ? 'c' : 'w') + '">' +
    (qs.sel === q.c ? '&#x2705; ' : '&#x274C; ') + escHtml(q.e) + '</div>'
    : '';

  body.innerHTML =
    '<div class="quiz-wrap quiz-slide">' +
    '<div class="q-prog-bar"><div class="q-prog-fill" style="width:' + progress + '%"></div></div>' +
    '<div class="quiz-top"><div class="q-dots">' + dotsHtml + '</div>' +
    '<div class="q-score">Score: ' + qs.score + '/' + qs.qs.length + '</div></div>' +
    '<div class="q-num">Question ' + (qs.cur + 1) + ' of ' + qs.qs.length + '</div>' +
    '<div class="q-question">' + escHtml(q.q) + '</div>' +
    '<div class="q-opts">' + optsHtml + '</div>' + feedbackHtml +
    (qs.sel !== null
      ? '<div class="q-nav"><div class="q-hint">&#x2728; Next question awaits!</div>' +
      '<button class="q-next" onclick="nextQ()">' +
      (qs.cur + 1 === qs.qs.length ? 'See Results &#x1F3C6;' : 'Next &rarr;') + '</button></div>'
      : '') +
    '</div>';
}

function renderQuizResult() {
  const body = $('outBody');
  if (!body) return;
  const qs = APP.quizState;
  const pct = Math.round((qs.score / qs.qs.length) * 100);
  const grade = pct >= 80 ? 'S' : pct >= 60 ? 'A' : pct >= 40 ? 'B' : 'C';
  const gradeColor = pct >= 80 ? 'var(--teal)' : pct >= 60 ? 'var(--orange)' : pct >= 40 ? '#fbbf24' : '#ef4444';

  const breakdownHTML = qs.qs.map((q, i) => {
    const ok = qs.answered[i] === q.c;
    return '<div class="q-result-item ' + (ok ? 'corr' : 'incorr') + '">' +
      '<span>Q' + (i + 1) + ': ' + escHtml(q.q.substring(0, 35)) + '...</span>' +
      '<span>' + (ok ? '&#x2705; Correct' : '&#x274C; Wrong') + '</span></div>';
  }).join('');

  body.innerHTML =
    '<div class="q-result quiz-slide">' +
    '<div class="q-result-emoji">' + (pct >= 80 ? '&#x1F3C6;' : pct >= 60 ? '&#x1F3AF;' : pct >= 40 ? '&#x1F4AA;' : '&#x1F4DA;') + '</div>' +
    '<div class="q-result-title">' + (pct >= 80 ? 'Wah bhai wah! Master ho tum!' : pct >= 60 ? 'Achha kiya! Thoda aur practice!' : pct >= 40 ? 'Theek hai — phir se try karo!' : 'Koi baat nahi — explanation phir padho!') + '</div>' +
    '<div class="q-result-score" style="color:' + gradeColor + ';">' + qs.score + '/' + qs.qs.length +
    ' <span style="font-size:20px;">Grade ' + grade + '</span></div>' +
    '<div style="background:rgba(255,255,255,.04);border-radius:8px;overflow:hidden;height:8px;width:200px;margin:8px auto;">' +
    '<div id="qResultBar" style="height:100%;width:0%;background:' + gradeColor + ';border-radius:8px;transition:width 1s ease;"></div></div>' +
    '<div class="q-result-breakdown">' + breakdownHTML + '</div>' +
    '<div class="q-result-msg">' + (pct >= 80 ? 'Concept bilkul pakka! Aage badho!' : pct >= 60 ? 'Half way there! Explanation phir padho.' : 'Concepts thode confusing hain — explanation phir padho!') + '</div>' +
    '<button class="q-retry" onclick="retryQuiz()">&#x1F504; Phir Se Try Karo</button></div>';

  setTimeout(() => { const b = $('qResultBar'); if (b) b.style.width = pct + '%'; }, 80);
}

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
    qs.sel = null; qs.cur++;
    if (qs.cur >= qs.qs.length) qs.done = true;
    renderQuiz();
    const nw = document.querySelector('.quiz-wrap, .q-result');
    if (nw) {
      nw.style.opacity = '0'; nw.style.transform = 'translateX(18px)';
      requestAnimationFrame(() => {
        nw.style.transition = 'opacity .22s ease, transform .22s ease';
        nw.style.opacity = '1'; nw.style.transform = 'translateX(0)';
      });
    }
  };
  if (wrap) {
    wrap.style.transition = 'opacity .18s ease, transform .18s ease';
    wrap.style.opacity = '0'; wrap.style.transform = 'translateX(-18px)';
    setTimeout(advance, 180);
  } else { advance(); }
}

function retryQuiz() {
  /* Fresh shuffle every retry — nayi questions milegi! */
  const code = $("codeInput") ? $("codeInput").value.trim() : "";
  if (code) APP.quizData = buildQuiz(code);
  resetQuiz(APP.quizData);
  renderQuiz();
}

/* ============================================================
   MODULE 5 — INTERACTIVE CODE RUNNER
   Detects input() calls, shows popup, then simulates output
   ============================================================ */

/* ── Step 1: Detect all input() prompts in code ── */
function detectInputCalls(code) {
  const inputs = [];
  const lines = code.split('\n');

  // ── Java Scanner: detect print prompt + nextXxx() pattern ──
  // Strategy: find System.out.print("...") followed by scanner.nextInt/next/nextLine etc.
  const isJava = /import\s+java\.util\.Scanner|Scanner\s+\w+\s*=\s*new\s+Scanner/i.test(code);
  if (isJava) {
    // Find the scanner variable name
    const scannerVarMatch = code.match(/Scanner\s+(\w+)\s*=\s*new\s+Scanner/);
    const scanVar = scannerVarMatch ? scannerVarMatch[1] : 'input';

    // Find all variable assignments using scanner.nextXxx()
    lines.forEach((line, idx) => {
      const t = line.trim();
      // Match: int num1 = input.nextInt(); OR String s = input.next();
      const nextMatch = t.match(new RegExp(
        '(?:int|long|double|float|String|char)?\\s*(\\w+)\\s*=\\s*' +
        scanVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '\\.next(?:Int|Double|Long|Float|Line|\\(\\))\\s*\\(\\s*\\)'
      ));
      if (nextMatch) {
        const varName = nextMatch[1];
        // Look for the print prompt just before this line
        let promptText = 'Enter value for ' + varName;
        for (let j = idx - 1; j >= Math.max(0, idx - 3); j--) {
          const prevLine = lines[j].trim();
          const printMatch = prevLine.match(/System\.out\.print\s*\(\s*["\'`]([^"\'`]+)["\'`]\s*\)/);
          if (printMatch) { promptText = printMatch[1]; break; }
        }
        inputs.push({ varName, prompt: promptText, lineIdx: idx, raw: t });
      }
    });
    if (inputs.length) return inputs;
  }

  // ── C++ cin: detect cin >> varName ──
  const isCpp = /cin\s*>>/.test(code);
  if (isCpp) {
    lines.forEach((line, idx) => {
      const t = line.trim();
      const cinMatch = t.match(/cin\s*>>\s*(\w+)/);
      if (cinMatch) {
        const varName = cinMatch[1];
        let promptText = 'Enter value for ' + varName;
        for (let j = idx - 1; j >= Math.max(0, idx - 3); j--) {
          const prevLine = lines[j].trim();
          const coutMatch = prevLine.match(/cout\s*<<\s*["\'`]([^"\'`]+)["\'`]/);
          if (coutMatch) { promptText = coutMatch[1]; break; }
        }
        inputs.push({ varName, prompt: promptText, lineIdx: idx, raw: t });
      }
    });
    if (inputs.length) return inputs;
  }

  // ── Python: name = input("Enter name: ") ──
  // ── JS: let name = prompt("Enter name") ──
  lines.forEach((line, idx) => {
    const pyMatch = line.match(/(?:^|\s)(\w+)\s*=\s*(?:int|float|str)?\s*\(?\s*input\s*\(\s*["\'\`]?([^"\'\`\)]*)["\'\`]?\s*\)\s*\)?/);
    const jsMatch = line.match(/(?:let|const|var)?\s*(\w+)\s*=\s*prompt\s*\(\s*["\'\`]?([^"\'\`\)]*)["\'\`]?\s*\)/);
    if (pyMatch) inputs.push({ varName: pyMatch[1], prompt: pyMatch[2] || ('Value for ' + pyMatch[1]), lineIdx: idx, raw: line.trim() });
    else if (jsMatch) inputs.push({ varName: jsMatch[1], prompt: jsMatch[2] || ('Value for ' + jsMatch[1]), lineIdx: idx, raw: line.trim() });
  });
  return inputs;
}



/* ── Step 3: Show input modal if needed, else run directly ── */
function runCode() {
  const ci = $('codeInput');
  if (!ci || !ci.value.trim()) { toast('Pehle code paste karo!'); return; }
  const code = ci.value.trim();
  const inputs = detectInputCalls(code);

  if (inputs.length > 0) {
    showInputModal(code, inputs);
  } else {
    // No inputs — call AI directly
    runWithAI(code, {});
  }
}

/* ── Step 4: Input Modal UI ── */
function showInputModal(code, inputs) {
  // Remove existing modal if any
  const existing = document.getElementById('inputModal');
  if (existing) existing.remove();

  const fieldsHTML = inputs.map((inp, i) =>
    '<div style="margin-bottom:14px;">' +
    '<label style="display:block;font-size:12px;font-weight:700;color:var(--teal);margin-bottom:6px;letter-spacing:.5px;">' +
    '&#x1F4E5; ' + escHtml(inp.prompt || inp.varName) + '</label>' +
    '<div style="font-size:10px;color:var(--muted);margin-bottom:4px;font-family:monospace;">' + escHtml(inp.raw) + '</div>' +
    '<input id="inp_' + i + '" type="text" placeholder="Value daalo..." ' +
    'style="width:100%;box-sizing:border-box;background:#1a1a2e;border:1.5px solid var(--border);border-radius:8px;' +
    'padding:10px 12px;color:#f1efff;font-size:14px;outline:none;font-family:monospace;" ' +
    'onkeydown="if(event.key===\x27Enter\x27){document.getElementById(\x27runWithInputsBtn\x27).click();}" />' +
    '</div>'
  ).join('');

  const modal = document.createElement('div');
  modal.id = 'inputModal';
  modal.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);' +
    'display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML =
    '<div style="background:#13131f;border:1.5px solid var(--border);border-radius:16px;' +
    'padding:24px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.6);">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
    '<div style="font-size:16px;font-weight:800;color:#f1efff;">&#x2328;&#xFE0F; Input Values Do</div>' +
    '<button onclick="document.getElementById(\x27inputModal\x27).remove()" ' +
    'style="background:rgba(255,255,255,.07);border:none;color:var(--muted);border-radius:8px;' +
    'padding:4px 10px;cursor:pointer;font-size:16px;">&times;</button></div>' +
    '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;padding:8px 12px;' +
    'background:rgba(255,107,53,.07);border-radius:8px;border:1px solid rgba(255,107,53,.2);">' +
    '&#x26A1; Tumhara code <strong style="color:var(--orange);">' + inputs.length + ' input()</strong> use kar raha hai — values daalo!</div>' +
    fieldsHTML +
    '<div style="display:flex;gap:10px;margin-top:6px;">' +
    '<button id="runWithInputsBtn" onclick="runWithInputs()" ' +
    'style="flex:1;padding:12px;background:linear-gradient(135deg,#ff6b35,#f7931e);' +
    'color:white;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;">&#x25B6;&#xFE0F; Run Karo</button>' +
    '<button onclick="document.getElementById(\x27inputModal\x27).remove()" ' +
    'style="padding:12px 16px;background:rgba(255,255,255,.06);color:var(--muted);' +
    'border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer;">Cancel</button>' +
    '</div></div>';

  document.body.appendChild(modal);
  // Focus first input
  setTimeout(() => { const fi = document.getElementById('inp_0'); if (fi) fi.focus(); }, 100);

  // Store code + inputs for runWithInputs()
  modal._code = code;
  modal._inputs = inputs;
}

/* ── Step 5: Collect inputs and call AI ── */
function runWithInputs() {
  const modal = document.getElementById('inputModal');
  if (!modal) return;
  const code = modal._code;
  const inputs = modal._inputs;

  const userInputs = {};
  inputs.forEach((inp, i) => {
    const el = document.getElementById('inp_' + i);
    const raw = el ? el.value.trim() : '';
    userInputs[inp.varName] = (raw !== '' && !isNaN(raw)) ? Number(raw) : raw;
  });

  modal.remove();
  runWithAI(code, userInputs);
}

/* ── Step 5b: AI-powered code execution call ── */
async function runWithAI(code, userInputs) {
  const lang = APP.langPill || 'auto';

  // Show Output tab immediately with loading state
  switchTab('run');
  const ob = $('outBody');
  if (ob) {
    ob.innerHTML =
      '<div class="placeholder-state">' +
      '<div style="font-size:36px;animation:spin .8s linear infinite;display:inline-block;">&#x26A1;</div>' +
      '<h3>AI Code Chal Raha Hai...</h3>' +
      '<p>Amazon Nova compute kar raha hai output...</p></div>';
  }


  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), API_TIMEOUT);

    const resp = await fetch(RUN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ code, language: lang, userInputs })
    });
    clearTimeout(tid);

    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();

    // Parse AI output into lines
    const aiOutputLines = data.output
      ? data.output.split('\n').filter(l => l.trim() !== '')
      : ['(no output)'];

    // Save for PDF export
    APP.runOutputLines = aiOutputLines;
    APP.runInputs = userInputs;
    APP.runWasAI = true;

    showOutputPanel(code, aiOutputLines, userInputs, true);

  } catch (err) {
    console.warn('AI run failed:', err.message);
    const outputs = ['(AI failed to run code: ' + err.message + ')'];
    APP.runOutputLines = outputs;
    APP.runInputs = userInputs;
    APP.runWasAI = false;
    showOutputPanel(code, outputs, userInputs, false);
  }
}

/* ── Step 6: Show output in the dedicated Output tab ── */
function showOutputPanel(code, outputs, userInputs, isAI) {
  const inputSummaryHTML = Object.keys(userInputs).length
    ? '<div style="margin-bottom:16px;padding:12px 14px;background:rgba(6,214,160,.06);border:1px solid rgba(6,214,160,.2);border-radius:10px;">' +
    '<div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">&#x1F4E5; Tumhare Input Values</div>' +
    Object.entries(userInputs).map(([k, v]) =>
      '<div style="font-family:monospace;font-size:12.5px;color:#c4b5fd;margin-bottom:4px;">' +
      '<span style="color:var(--orange);">' + escHtml(k) + '</span>' +
      ' <span style="color:var(--muted);">= </span>' +
      '<span style="color:var(--teal);">&quot;' + escHtml(String(v)) + '&quot;</span></div>'
    ).join('') + '</div>'
    : '';

  const outputLines = outputs.map(line =>
    '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);">' +
    '<span style="color:var(--teal);font-weight:700;flex-shrink:0;">&#x25B6;</span>' +
    '<span style="color:#e8f5e9;font-family:monospace;font-size:13px;line-height:1.7;word-break:break-all;">' + escHtml(line) + '</span>' +
    '</div>'
  ).join('');

  // AI badge or simulated badge
  const badgeHTML = isAI
    ? '<div style="margin-top:12px;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--teal);">' +
    '<span style="background:rgba(6,214,160,.12);border:1px solid rgba(6,214,160,.3);border-radius:6px;padding:3px 8px;font-weight:700;">&#x1F916; Amazon Nova AI</span>' +
    '<span style="color:var(--muted);">se generate hua actual output</span></div>'
    : '<div style="margin-top:10px;font-size:11px;color:var(--muted);text-align:center;">&#x2139;&#xFE0F; Simulated output — AI unavailable tha</div>';

  // Build the full Output tab content
  const html =
    '<div style="padding:4px 2px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
    '<div style="font-size:13px;font-weight:800;color:var(--teal);">&#x1F4BB; Live Output</div>' +
    '<button onclick="reRunCode()" style="font-size:11px;padding:5px 12px;background:rgba(6,214,160,.12);' +
    'border:1px solid rgba(6,214,160,.3);color:var(--teal);border-radius:8px;cursor:pointer;font-weight:700;">&#x1F504; Dobara Run</button>' +
    '</div>' +
    inputSummaryHTML +
    '<div style="background:#0a0a12;border:1px solid var(--border);border-radius:10px;padding:14px 16px;">' +
    '<div style="font-size:10px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;">$ output</div>' +
    outputLines +
    '</div>' +
    badgeHTML +
    '</div>';

  // Store and switch to run tab
  APP.runOutputHTML = html;
  switchTab('run');
  // Always show action buttons (PDF, Debug, Share) after output
  const oa = $('outActions');
  if (oa) oa.style.display = '';
  toast('&#x2705; Output ready!');
}

/* ── Re-run: bring up input modal again ── */
function reRunCode() {
  const ci = $('codeInput');
  if (!ci || !ci.value.trim()) { toast('Pehle code paste karo!'); return; }
  runCode();
}

/* ── Legacy simulateOutput (kept for internal use) ── */
function simulateOutput(code) {
  const outputs = simulateOutputWithInputs(code, {});
  return { outputs, language: APP.langPill };
}

/* ============================================================
   MODULE 6 — analyzeDebug() + debugCode() + renderDebugResult()
   ============================================================ */
function analyzeDebug(code) {
  const lines = code.split('\n'), lang = APP.langPill;
  const bugs = [], warnings = [], fixes = [];

  lines.forEach((line, idx) => {
    const t = line.trim(), lineNum = idx + 1;

    if (lang === 'Python' || lang === 'Auto Detect') {
      if (/^\s*(def|class|for|while|if|elif|else|try|except|finally|with)\b/.test(line) && !/:[\s]*$/.test(t) && !/:[\s]*#/.test(t) && t.length > 0) {
        bugs.push({ line: lineNum, code: t, type: 'Syntax', desc: 'Line ' + lineNum + ': Colon missing — ' + escHtml(t) + ' ke end mein ":" chahiye.' });
        fixes.push({ line: lineNum, original: t, fixed: t + ':', desc: 'Colon add karo end mein' });
      }
      if (/\bif\s+\w+\s*=\s*[^=]/.test(t)) {
        bugs.push({ line: lineNum, code: t, type: 'Logic', desc: 'Line ' + lineNum + ': Assignment = inside if! Comparison ke liye == use karo.' });
        fixes.push({ line: lineNum, original: t, fixed: t.replace(/(\bif\s+\w+)\s*=\s*/, '$1 == '), desc: '= ko == se replace karo' });
      }
      if (/^\s*print\s+[^(]/.test(line)) {
        bugs.push({ line: lineNum, code: t, type: 'Syntax', desc: 'Line ' + lineNum + ': Python 3 mein print ke baad parentheses () zaroori hain!' });
        fixes.push({ line: lineNum, original: t, fixed: t.replace(/^print\s+/, 'print(') + ')', desc: 'print() parentheses add karo' });
      }
      if (/^\t/.test(line) && code.includes('    '))
        warnings.push({ type: 'Style', desc: 'Line ' + lineNum + ': Tab aur spaces mixed! Python mein consistency zaroori hai.', severity: 'medium' });
      const vd = t.match(/^(\w+)\s*=/);
      if (vd && !['self', '_', 'True', 'False', 'None'].includes(vd[1])) {
        const vn = vd[1];
        if (!lines.some((l, i) => i !== idx && new RegExp('\\b' + vn + '\\b').test(l)) && !/^(for|while|if|class|def)/.test(t))
          warnings.push({ type: 'Warning', desc: 'Line ' + lineNum + ': Variable ' + escHtml(vn) + ' define kiya lekin kabhi use nahi kiya — dead code?', severity: 'low' });
      }
    }
    if (lang === 'JavaScript' || lang === 'Auto Detect') {
      if (/\bvar\b/.test(t)) warnings.push({ type: 'Style', desc: 'Line ' + lineNum + ': var avoid karo — const ya let use karo.', severity: 'medium' });
      if (/==\s/.test(t) && !/===/.test(t)) warnings.push({ type: 'Logic', desc: 'Line ' + lineNum + ': == ki jagah === use karo.', severity: 'medium' });
      if (/console\.log\(/.test(t)) warnings.push({ type: 'Style', desc: 'Line ' + lineNum + ': console.log production mein remove karna mat bhoolna!', severity: 'low' });
    }
    if (t.length > 120) warnings.push({ type: 'Style', desc: 'Line ' + lineNum + ': Bahut lambi line (' + t.length + ' chars).', severity: 'low' });
    if (/\/\s*0\b/.test(t)) bugs.push({ line: lineNum, code: t, type: 'Runtime', desc: 'Line ' + lineNum + ': Zero se divide! ZeroDivisionError aa sakta hai.' });
    if (/while\s+(True|1|true)\s*:/.test(t) && !code.includes('break'))
      bugs.push({ line: lineNum, code: t, type: 'Logic', desc: 'Line ' + lineNum + ': Infinite loop risk! break statement nahi mila!' });
  });

  const ne = lines.filter(l => l.trim().length > 5), seen = new Set(), dups = [];
  ne.forEach(l => { if (seen.has(l.trim())) dups.push(l.trim()); else seen.add(l.trim()); });
  if (dups.length) warnings.push({ type: 'Style', desc: 'Duplicate code: ' + escHtml(dups[0].substring(0, 50)) + ' — function mein extract karo!', severity: 'low' });
  if (/(for|while)[\s\S]{1,300}(for|while)/i.test(code)) warnings.push({ type: 'Performance', desc: 'Nested loops detected — O(n2). Large data pe slow. Hash map consider karo.', severity: 'high' });

  return { bugs, warnings, fixes };
}

function debugCode() {
  if (!APP.hasExplained) { toast('Pehle explain karo — phir debug!'); return; }
  const ci = $('codeInput');
  if (!ci || !ci.value.trim()) { toast('Code missing!'); return; }
  const btn = $('debugBtn');
  if (btn) { btn.classList.add('loading-debug'); btn.textContent = 'Checking...'; }
  setTimeout(() => {
    APP.debugData = analyzeDebug(ci.value.trim());
    switchTab('debug');
    if (btn) { btn.classList.remove('loading-debug'); btn.textContent = 'Debug'; }
    const total = APP.debugData.bugs.length + APP.debugData.warnings.length;
    toast(total === 0 ? 'Code clean dikh raha hai!' : APP.debugData.bugs.length + ' bug(s) found — Debug tab check karo!');
  }, 800);
}

function renderDebugResult() {
  const body = $('outBody');
  if (!body) return;
  if (!APP.debugData) {
    body.innerHTML = '<div class="placeholder-state"><div class="icon">&#x1F41B;</div><h3>Debug Analysis Nahi Hai!</h3><p>"Debug" button dabao!</p></div>';
    return;
  }
  const { bugs, warnings, fixes } = APP.debugData;
  if (!bugs.length && !warnings.length) {
    body.innerHTML =
      '<div class="debug-wrap"><div class="debug-clean"><div class="debug-clean-icon">&#x2705;</div>' +
      '<div class="debug-clean-title">Code Clean Dikh Raha Hai!</div>' +
      '<div class="debug-clean-msg">Koi obvious bugs ya issues nahi mila.<br><em style="color:var(--muted2);">Yeh static analysis hai — runtime errors ke liye terminal mein run karo.</em></div>' +
      '</div></div>';
    return;
  }
  const bugsHTML = bugs.map(b =>
    '<div class="bug-card"><div class="bug-card-top"><span class="bug-line-badge">Line ' + b.line + '</span>' +
    '<span class="bug-type">&#x1F534; ' + b.type + ' Error</span></div>' +
    '<div class="bug-desc">' + b.desc + '</div>' +
    (b.code ? '<div class="bug-code-orig">&#x274C; &nbsp;' + escHtml(b.code.substring(0, 80)) + '</div>' : '') + '</div>'
  ).join('');
  const fixesHTML = fixes.map(f =>
    '<div class="bug-fix-card"><div class="bug-fix-title">&#x2705; Fix — Line ' + f.line + ': ' + f.desc + '</div>' +
    '<div class="bug-code-orig">&#x274C; &nbsp;' + escHtml(f.original.substring(0, 80)) + '</div>' +
    '<div class="bug-fix-code">&#x2705; &nbsp;' + escHtml(f.fixed.substring(0, 80)) + '</div></div>'
  ).join('');
  const warnsHTML = warnings.map(w =>
    '<div class="warn-card">' +
    '<div class="warn-card-icon">' + (w.severity === 'high' ? '&#x1F534;' : w.severity === 'medium' ? '&#x1F7E1;' : '&#x1F535;') + '</div>' +
    '<div class="warn-card-text"><strong>' + w.type + ':</strong> ' + w.desc + '</div></div>'
  ).join('');

  body.innerHTML =
    '<div class="debug-wrap quiz-slide">' +
    '<div class="debug-header"><div class="debug-title">&#x1F41B; Debug Report <span style="font-size:11px;font-weight:400;color:var(--muted)">(' + APP.langPill + ')</span></div>' +
    '<div style="font-family:monospace;font-size:11px;padding:3px 10px;border-radius:20px;background:' + (bugs.length ? 'rgba(239,68,68,.12)' : 'rgba(251,191,36,.1)') + ';border:1px solid ' + (bugs.length ? 'rgba(239,68,68,.3)' : 'rgba(251,191,36,.25)') + ';color:' + (bugs.length ? '#f87171' : '#fbbf24') + ';">' +
    bugs.length + ' bug' + (bugs.length !== 1 ? 's' : '') + ', ' + warnings.length + ' warning' + (warnings.length !== 1 ? 's' : '') + '</div></div>' +
    (bugs.length ? '<div class="debug-section"><div class="debug-sec-title red">&#x1F534; Bugs Found (' + bugs.length + ')</div>' + bugsHTML + '</div>' : '') +
    (fixes.length ? '<div class="debug-section"><div class="debug-sec-title green">&#x2705; Suggested Fixes</div>' + fixesHTML + '</div>' : '') +
    (warnings.length ? '<div class="debug-section"><div class="debug-sec-title yellow">&#x26A0;&#xFE0F; Warnings (' + warnings.length + ')</div>' + warnsHTML + '</div>' : '') +
    '<div style="margin-top:14px;padding:10px 14px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.2);border-radius:10px;font-size:12px;color:var(--muted);line-height:1.7;">' +
    '<strong style="color:var(--violet2);">&#x2139;&#xFE0F; Note:</strong> Yeh static analysis hai — runtime errors ke liye terminal mein run karo.</div></div>';
}

/* ============================================================
   MAIN FLOW — explainCode()  [Timeout + Cache + DOMPurify]
   ============================================================ */
async function explainCode() {
  const ci = $('codeInput');
  if (!ci) return;
  const code = ci.value.trim();
  if (!code) { toast('Pehle code paste karo!'); return; }

  const btn = $('explainBtn');
  const level = $('levelSel') ? $('levelSel').value : 'beginner';
  const lang = $('langSel') ? $('langSel').value : 'Hinglish';

  if (btn) btn.classList.add('loading');
  switchTab('expl');

  $('outBody').innerHTML =
    '<div class="placeholder-state">' +
    '<div style="font-size:36px;animation:spin .8s linear infinite;display:inline-block;">&#x26A1;</div>' +
    '<h3>Amazon Nova 2 Lite soch raha hai...</h3>' +
    '<p>Structured analysis aa rahi hai...</p></div>';

  try {
    /* ── CACHE CHECK ── */
    const ck = cacheKey(code, lang, level, APP.analogy);
    let data;
    if (AI_CACHE[ck]) {
      data = AI_CACHE[ck];
      toast('&#x26A1; Cache se load — instant!');
    } else {
      /* ── FETCH WITH TIMEOUT ── */
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), API_TIMEOUT);
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ code, lang, level, analogy: APP.analogy })
        });
        clearTimeout(tid);
        if (!response.ok) throw new Error('API error ' + response.status + ' — backend check karo!');
        data = await response.json();
        AI_CACHE[ck] = data;
      } catch (fetchErr) {
        clearTimeout(tid);
        throw fetchErr;
      }
    }

    /* ── BUILD UI ── */
    const cx = analyzeCode(code);
    const result = buildStructuredExplanation(code, lang, level, APP.analogy, cx);

    /* Markdown parse — safe fallback */
    let rawHtml = '';
    try {
      rawHtml = (window.marked && typeof window.marked.parse === 'function')
        ? window.marked.parse(data.explanation || '')
        : (data.explanation || '').replace(/\n/g, '<br>');
    } catch (e) {
      rawHtml = (data.explanation || '').replace(/\n/g, '<br>');
    }

    /* DOMPurify sanitize — safe fallback */
    const safeHtml = (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function')
      ? window.DOMPurify.sanitize(rawHtml)
      : rawHtml;

    result.html = result.html.replace(
      '<div class="expl-section-body"><p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);">',
      '<div class="expl-section-body">' +
      '<div class="ai-generated-content">' +
      '<b style="color:var(--teal);">[&#x1F916; Amazon Nova AI Response]:</b><br>' + safeHtml +
      '</div><br><br>' +
      '<p style="font-size:14.5px;line-height:2;color:rgba(241,239,255,.92);">' +
      '<b style="color:var(--orange);">[&#x1F4CA; Static Analysis]:</b><br>'
    );

    APP.explanation = result.text;
    APP.explanationHTML = result.html;
    APP.optsHTML = result.optsHTML;
    APP.lastResult = result;
    APP.complexityData = cx;
    APP.quizData = buildQuiz(code);
    APP.debugData = analyzeDebug(code);
    APP.hasExplained = true;
    resetQuiz(APP.quizData);

    const lc = { beginner: 'lb-b', intermediate: 'lb-i', advanced: 'lb-a' }[level] || 'lb-b';
    const ll = { beginner: '&#x1F331; Beginner', intermediate: '&#x26A1; Intermediate', advanced: '&#x1F525; Advanced' }[level] || 'Beginner';
    const lb = $('levelBadge');
    if (lb) lb.innerHTML = '<span class="level-badge ' + lc + '">' + ll + '</span>';

    $('outBody').innerHTML = APP.explanationHTML;
    const oa = $('outActions');
    if (oa) oa.style.display = 'flex';

    APP.explCount++;
    lsSet('sai_expl_count', APP.explCount.toString());
    const ce = $('explCount');
    if (ce) ce.textContent = APP.explCount;

    /* highlight.js — if available */
    if (window.hljs) {
      try { document.querySelectorAll('pre code').forEach(el => window.hljs.highlightElement(el)); } catch (e) { /* ignore */ }
    }

    toast('&#x2705; Analysis ready! Complexity aur Quiz bhi check karo!');

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    $('outBody').innerHTML =
      '<div class="placeholder-state"><div class="icon">&#x274C;</div>' +
      '<h3 style="color:#ff6b35;opacity:1;">' + (isTimeout ? '&#x23F1;&#xFE0F; Request Timeout!' : 'Error Aa Gaya!') + '</h3>' +
      '<p>' + escHtml(isTimeout ? 'Network slow hai — 12 seconds mein response nahi aaya. Dobara try karo!' : err.message) + '</p>' +
      '<p style="font-size:12px;color:#888;margin-top:8px;">Internet connection check karo aur dobara try karo.</p></div>';
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

/* ============================================================
   COMPLEXITY VISUALIZER — renderComplexity()
   ============================================================ */
const BIGO = [
  { lbl: 'O(1)', h: 8, col: '#10B981' },
  { lbl: 'O(log n)', h: 20, col: '#34d399' },
  { lbl: 'O(n)', h: 40, col: '#f97316' },
  { lbl: 'O(n log n)', h: 58, col: '#fb923c' },
  { lbl: 'O(n2)', h: 80, col: '#ef4444' },
  { lbl: 'O(2n)', h: 95, col: '#dc2626' }
];

function renderComplexity() {
  const body = $('outBody');
  if (!body) return;
  if (!APP.hasExplained || !APP.complexityData) {
    body.innerHTML = '<div class="placeholder-state"><div class="icon">&#x1F4CA;</div><h3>Complexity ready nahi hai!</h3><p>Pehle code explain karo!</p></div>';
    return;
  }
  const d = APP.complexityData;
  const r = APP.lastResult || {};
  const tc = d.tScore < 30 ? 'g' : d.tScore < 60 ? 'y' : 'o';
  const sc = d.sScore < 30 ? 'g' : d.sScore < 60 ? 'y' : 'o';

  const barsHtml = BIGO.map((b, i) => {
    const hi = i === d.hiIdx;
    return '<div class="bigo-col ' + (hi ? 'hi' : '') + '">' +
      '<div class="bigo-fill" style="height:0px;background:' + (hi ? b.col : 'rgba(255,255,255,.08)') + ';' +
      (hi ? 'border:1px solid ' + b.col + ';box-shadow:0 0 14px ' + b.col : '') +
      ';border-radius:4px 4px 0 0;" data-h="' + b.h + '"></div>' +
      '<div class="bigo-lbl">' + b.lbl + '</div></div>';
  }).join('');

  body.innerHTML =
    '<div class="cx-wrap quiz-slide">' +
    '<div class="cx-header"><div class="cx-title">&#x1F4CA; Complexity Analysis</div><div class="cx-badge">' + d.lines + ' lines</div></div>' +
    '<div class="cx-row"><div class="cx-label-row"><div class="cx-name">&#x23F1;&#xFE0F; Time Complexity</div><div class="cx-val ' + tc + '">' + d.time + '</div></div>' +
    '<div class="bar-track"><div class="bar-fill bf-t" id="bf-time" style="width:0%"></div></div>' +
    '<div class="cx-desc">' + (d.time === 'O(1)' ? 'Constant — hamesha same speed. &#x1F3C6;' : d.time === 'O(n)' ? 'Linear — data ke saath badhta hai. &#x2705;' : d.time === 'O(log n)' ? 'Logarithmic — bahut efficient! &#x1F3AF;' : 'Quadratic — bade data pe avoid karo. &#x26A0;&#xFE0F;') + '</div></div>' +
    '<div class="cx-row"><div class="cx-label-row"><div class="cx-name">&#x1F4BE; Space Complexity</div><div class="cx-val ' + sc + '">' + d.space + '</div></div>' +
    '<div class="bar-track"><div class="bar-fill bf-s" id="bf-spc" style="width:0%"></div></div>' +
    '<div class="cx-desc">Memory usage — RAM mein kitni jagah chahiye.</div></div>' +
    '<div class="cx-row"><div class="cx-label-row"><div class="cx-name">&#x1F9E9; Overall Score</div><div class="cx-val ' + (d.cxScore < 40 ? 'g' : d.cxScore < 70 ? 'y' : 'r') + '">' + d.cxScore + '/100</div></div>' +
    '<div class="bar-track"><div class="bar-fill bf-cx" id="bf-cx" style="width:0%"></div></div>' +
    '<div class="cx-desc">Lower is better! 0-40 = excellent, 41-70 = ok, 71-100 = optimize karo.</div></div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 10px;">' +
    '<div style="flex:1;min-width:100px;padding:10px 14px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Worst Case</div><div style="font-family:monospace;font-size:15px;font-weight:700;color:#ef4444;">' + d.time + '</div></div>' +
    '<div style="flex:1;min-width:100px;padding:10px 14px;background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.2);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Average Case</div><div style="font-family:monospace;font-size:15px;font-weight:700;color:#fbbf24;">' + d.time + '</div></div>' +
    '<div style="flex:1;min-width:100px;padding:10px 14px;background:rgba(6,214,160,.07);border:1px solid rgba(6,214,160,.2);border-radius:10px;"><div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Space Used</div><div style="font-family:monospace;font-size:15px;font-weight:700;color:var(--teal);">' + d.space + '</div></div></div>' +
    '<div class="bigo-box"><div class="bigo-title">Big-O Comparison — Tumhara code kahan hai?</div><div class="bigo-bars">' + barsHtml + '</div></div>' +
    '<div class="cx-insight">&#x1F4A1; <strong>SimplifAI Insight:</strong> ' + d.insight + '</div>' +
    '<div style="margin-top:18px;"><div style="font-size:12px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><span style="width:3px;height:14px;background:#fbbf24;border-radius:2px;display:inline-block;"></span>Optimization Suggestions</div>' +
    (r.optsHTML || '<div class="expl-opt-card"><strong style="color:var(--teal);">&#x2705; Code looks clean!</strong><br>Run Explanation first for tips.</div>') + '</div></div>';

  requestAnimationFrame(() => {
    setTimeout(() => {
      const t = $('bf-time'), s = $('bf-spc'), c = $('bf-cx');
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

/* ============================================================
   UTILITIES
   ============================================================ */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function doCopy() {
  if (!APP.explanation) { toast('Pehle explain karo!'); return; }
  navigator.clipboard.writeText(APP.explanation)
    .then(() => toast('&#x1F4CB; Copied!'))
    .catch(() => toast('Copy failed — manually select karo.'));
}

function toast(msg) {
  const t = $('toastEl');
  if (!t) return;
  t.innerHTML = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ──────────── FAQ ACCORDION ──────────── */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  if (q) q.addEventListener('click', () => {
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!open) item.classList.add('open');
  });
});

/* ──────────── DEBOUNCED INPUT LISTENER ──────────── */
const codeInputEl = $('codeInput');
if (codeInputEl) codeInputEl.addEventListener('input', debouncedMeter);

/* ──────────── INIT ──────────── */
updateMeter();