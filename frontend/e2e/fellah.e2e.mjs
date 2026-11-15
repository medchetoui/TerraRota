// Test de bout en bout de « سول بالدارجة » (/advisor) dans Chrome sans interface, piloté par le protocole
// DevTools (WebSocket intégré à Node, aucune dépendance).
//
// Prérequis : backend (python manage.py runserver 8000) et frontend (npm run dev) lancés.
// L'appel /api/v1/recommendations/ (qui interroge NASA POWER en ligne) n'atteint jamais le backend : il est bloqué,
// ou remplacé par une réponse fictive (FAUSSE_RECO) pour tester les questions sur la parcelle du formulaire.
// Utilisation :
//   npm run test:e2e
//   npm run test:e2e -- --wav chemin/question.wav   (micro simulé ; expérimental : dans Chrome sans interface,
//                                                    la reconnaissance vocale n'entend en général rien)
// Variables : E2E_URL (défaut http://localhost:5173), CHROME_PATH.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);
const BASE = process.env.E2E_URL || 'http://localhost:5173';
const WAV = opt('--wav');
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = CHROMES.find((c) => existsSync(c));
if (!chrome) throw new Error('Chrome introuvable : définir CHROME_PATH');

const profil = mkdtempSync(join(tmpdir(), 'fellah-e2e-'));
const port = 9300 + Math.floor(Math.random() * 500);
const flags = [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run',
  '--use-fake-ui-for-media-stream', '--lang=ar', '--autoplay-policy=no-user-gesture-required',
];
if (WAV) flags.push('--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${resolve(WAV)}`);
const proc = spawn(chrome, [...flags, 'about:blank'], { stdio: 'ignore' });

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const enAttente = new Map();
let erreursConsole = [];
const ATTENDUES = /recommendations|NASA API query error|ERR_BLOCKED_BY_CLIENT/;

function cdp(method, params = {}) {
  return new Promise((ok, ko) => {
    const n = ++id;
    enAttente.set(n, { ok, ko });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
async function evaluer(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function attendreQue(expr, ms = 15000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await evaluer(expr)) return;
    await attendre(200);
  }
  throw new Error(`délai dépassé : ${expr}`);
}

let echecs = 0;
function verifier(nom, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ' — ' + detail : ''}`);
  if (!ok) echecs++;
}

let scriptInjecte = null;
async function ouvrir(chemin, injection) {
  if (scriptInjecte) await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptInjecte });
  scriptInjecte = injection ? (await cdp('Page.addScriptToEvaluateOnNewDocument', { source: injection })).identifier : null;
  erreursConsole = [];
  await cdp('Page.navigate', { url: BASE + chemin });
  await attendre(300);
  await attendreQue(`document.readyState === 'complete' && document.getElementById('root')?.children.length > 0`);
}
const ouvrirAdvisor = async (injection) => {
  await ouvrir('/advisor', injection);
  await attendreQue(`document.querySelectorAll('[data-testid=fellah-suggestion]').length > 0`);
};
const reponse = () => evaluer(`(() => {
  const r = document.querySelector('[data-testid=fellah-reponse]');
  return r ? [...r.querySelectorAll('.text-xl')].map((e) => e.innerText).join(' ') : '';
})()`);
async function poserEcrit(question) {
  await evaluer(`(() => {
    const i = document.getElementById('fellah-question');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(question)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.form.requestSubmit();
  })()`);
  await attendreQue(`document.querySelector('[data-testid=fellah-reponse]')?.dataset.question === ${JSON.stringify(question.trim())}`);
  return reponse();
}
async function suggestionsMarchent() {
  const textes = await evaluer(`[...document.querySelectorAll('[data-testid=fellah-suggestion]')].map((b) => b.innerText)`);
  for (let k = 0; k < textes.length; k++) {
    await evaluer(`document.querySelectorAll('[data-testid=fellah-suggestion]')[${k}].click()`);
    await attendreQue(`document.querySelector('[data-testid=fellah-reponse]')?.dataset.question === ${JSON.stringify(textes[k])}`);
    const r = await reponse();
    if (!r || /[0-9٠-٩]/.test(r)) return { ok: false, detail: `${textes[k]} → ${r}` };
  }
  return { ok: textes.length > 0, detail: `${textes.length} suggestions` };
}
const FAUSSE_REPONSE_RECO = {
  status: 'ok', data_status: 'live', provenance: null,
  indicators: { annual_rain_mm: 350, mean_annual_temp_c: 18, gdd_base10: 2100, frost_days_per_year: 6,
    aridity_index: 0.25, dry_months: 6, missing_data_pct: 0 },
  recommendations: [{ crop_id: 'barley', crop_name_fr: 'Orge', crop_name_ar: 'الشعير', crop_name_en: 'Barley',
    crop_category: 'cereal', crop_emoji: '🌾', score: 80, rank: 1, eligible: true, reasons: ['test'],
    reasons_fr: ['test'], reasons_en: ['test'], cautions: [], cautions_fr: [], cautions_en: [] }],
  abstained_crops: [], abstention_reason: null, insufficient_data_reason: null,
};
let recommandation = 'bloquee';
const erreursInattendues = () => erreursConsole.filter((e) => !ATTENDUES.test(e));
const FAUSSE_RECO = (erreur) => `window.SpeechRecognition = undefined;
  window.webkitSpeechRecognition = class { start() { setTimeout(() => { this.onerror && this.onerror({ error: '${erreur}' }); this.onend && this.onend(); }, 50); } stop() {} };`;
const SANS_RECO = `delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
  Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined }); Object.defineProperty(window, 'SpeechRecognition', { value: undefined });`;

try {
  let cible;
  for (let k = 0; k < 50 && !cible; k++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      cible = pages.find((p) => p.type === 'page');
    } catch { await attendre(200); }
  }
  ws = new WebSocket(cible.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && enAttente.has(d.id)) {
      const { ok, ko } = enAttente.get(d.id);
      enAttente.delete(d.id);
      d.error ? ko(new Error(d.error.message)) : ok(d.result);
    } else if (d.method === 'Fetch.requestPaused') {
      const requestId = d.params.requestId;
      if (recommandation === 'fictive') {
        cdp('Fetch.fulfillRequest', { requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
          body: Buffer.from(JSON.stringify(FAUSSE_REPONSE_RECO)).toString('base64') }).catch(() => undefined);
      } else {
        cdp('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => undefined);
      }
    } else if (d.method === 'Runtime.exceptionThrown') {
      erreursConsole.push('exception : ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      erreursConsole.push('console.error : ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    } else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') {
      erreursConsole.push('log : ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    }
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Log.enable');
  await cdp('Network.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: '*/api/v1/recommendations*' }] });

  // 1. Page /advisor : chargement, champ texte, micro, réponses
  await ouvrirAdvisor();
  verifier('/advisor se charge sans erreur dans la console', erreursInattendues().length === 0, erreursInattendues().join(' | '));
  verifier('champ « اكتب سؤالك » présent', await evaluer(`document.getElementById('fellah-question').placeholder === 'اكتب سؤالك'`));
  verifier('bloc en droite-à-gauche', await evaluer(`document.getElementById('fellah-question').closest('[dir=rtl]') !== null`));
  const reco = await evaluer(`!!(window.SpeechRecognition || window.webkitSpeechRecognition)`);
  verifier('bouton 🎤 présent (Chrome)', reco && await evaluer(`!!document.querySelector('[aria-label="سجل سؤالك"]')`));

  const r1 = await poserEcrit('واش نبقى نزرع القمح؟');
  verifier('question écrite → réponse darija (blé : pas cette année)', r1.includes('القمح الطري') && r1.includes('ماشي هاد العام'), r1);
  const clipsR1 = (await (await fetch(`${BASE}/api/v1/fellah/question/`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'واش نبقى نزرع القمح؟' }) })).json()).phrases.flat().filter((p) => p.audio).length;
  const desactive = await evaluer(`[...document.querySelectorAll('[data-testid=fellah-reponse] button')].at(-1).disabled`);
  verifier(clipsR1 ? '🔊 actif quand des clips existent' : 'sans clip enregistré : 🔊 désactivé, texte seul', desactive === !clipsR1,
    `${clipsR1} clip(s) dans cette réponse`);
  for (const q of ['سلام', 'salam', 'السلام، لاباس؟', 'شحال غادي نحصد؟', 'واش نحط الغبار؟', 'شنو هي عاصمة فرنسا؟']) {
    const r = await poserEcrit(q);
    verifier(`« ${q} » → réponse propre, renvoi au conseiller, sans chiffre`, r.includes('سول المستشار') && !/[0-9٠-٩]/.test(r), r);
  }
  const s = await suggestionsMarchent();
  verifier('toutes les suggestions répondent, sans chiffre', s.ok, s.detail);
  verifier('aucune erreur dans la console après les questions', erreursInattendues().length === 0, erreursInattendues().join(' | '));

  // 1b. Clips enregistrés : 🔊 joue chaque clip présent (seulement si des clips sont dans public/audio/darija)
  await evaluer(`(() => { window.__clipsJoues = []; const jouer = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { window.__clipsJoues.push(this.src); return jouer.call(this); }; })()`);
  await poserEcrit('شحال غادي نحصد؟');
  const urls = await (await fetch(`${BASE}/api/v1/fellah/question/`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'واش نبقى نزرع القمح؟' }) })).json().then((r) => r.phrases.flat().map((p) => p.audio).filter(Boolean));
  if (urls.length) {
    await poserEcrit('واش نبقى نزرع القمح؟');
    const bouton = `[...document.querySelectorAll('[data-testid=fellah-reponse] button')].at(-1)`;
    await evaluer(`${bouton}.click()`);
    await attendreQue(`window.__clipsJoues.length >= ${urls.length}`, 20000).catch(() => undefined);
    const joues = await evaluer(`window.__clipsJoues.map((u) => new URL(u).pathname)`);
    verifier('🔊 joue les clips présents, dans l’ordre', JSON.stringify(joues) === JSON.stringify(urls), joues.join(', '));
    const rep = await fetch(BASE + urls[0]);
    verifier('clip servi en audio/wav', rep.ok && (rep.headers.get('content-type') || '').includes('audio/wav'), rep.headers.get('content-type'));
  } else {
    console.log('—    aucun clip enregistré dans public/audio/darija : lecture 🔊 non testée');
  }

  // 2. Sécurité de la démo : pas de reconnaissance vocale (Firefox, Safari...), pas d'internet, micro refusé
  await ouvrirAdvisor(SANS_RECO);
  verifier('navigateur sans reconnaissance vocale : pas de bouton 🎤', !(await evaluer(`!!document.querySelector('[aria-label="سجل سؤالك"]')`)));
  verifier('… la question écrite marche', (await poserEcrit('شنو نزرع هاد العام؟')).includes('سول المستشار'));
  verifier('… les suggestions marchent', (await suggestionsMarchent()).ok);
  for (const [erreur, message] of [['network', 'الأنترنيت'], ['not-allowed', 'الميكرو'], ['audio-capture', 'الميكرو']]) {
    await ouvrirAdvisor(FAUSSE_RECO(erreur));
    await evaluer(`document.querySelector('[aria-label="سجل سؤالك"]').click()`);
    await attendreQue(`!!document.querySelector('[role=status]')`);
    const notice = await evaluer(`document.querySelector('[role=status]').innerText`);
    verifier(`micro en erreur « ${erreur} » → message clair`, notice.includes(message) && notice.includes('اكتب سؤالك'), notice);
    verifier(`… puis la question écrite marche`, (await poserEcrit('علاش هاد النصيحة؟')).length > 0);
  }

  // 2b. Questions sur la parcelle du formulaire (réponse de /recommendations fictive : 350 mm, 18 °C)
  recommandation = 'fictive';
  await ouvrirAdvisor();
  await attendreQue(`!!document.querySelector('[data-testid=resume-parcelle]')`);
  verifier('parcelle du formulaire : mode « الأرض ديالي » actif et résumé affiché',
    (await evaluer(`document.querySelector('[data-testid=resume-parcelle]').innerText`)).includes('350 mm'));
  const surParcelle = await poserEcrit('شنو نزرع هاد العام؟');
  verifier('… réponse calculée sur la parcelle, sans chiffre', surParcelle.length > 0 && !/[0-9٠-٩]/.test(surParcelle), surParcelle);
  const sol = await poserEcrit('واش الأرض ديالي مزيانة؟');
  verifier('… sol inconnu du formulaire → « aucune information », pas de valeur inventée', sol.includes('ما عندنا حتى معلومة'), sol);
  await evaluer(`document.querySelector('[data-testid=mode-demo]').click()`);
  await attendreQue(`!document.querySelector('[data-testid=resume-parcelle]')`);
  const demo = await poserEcrit('شنو نزرع هاد العام؟');
  verifier('… bascule « أمثلة » → scénario de démo, autre réponse', demo !== surParcelle && demo.length > 0, demo);
  verifier('… sans erreur dans la console', erreursInattendues().length === 0, erreursInattendues().join(' | '));
  recommandation = 'bloquee';

  // 3. Le reste de l'application s'affiche comme avant (sans appel NASA : endpoint bloqué)
  for (const chemin of ['/', '/recommendation', '/weather']) {
    await ouvrir(chemin);
    await attendre(1500);
    const contenu = await evaluer(`document.getElementById('root').innerText.length`);
    verifier(`${chemin} s'affiche`, contenu > 100, `${contenu} caractères`);
    verifier(`${chemin} sans exception JavaScript`, !erreursConsole.some((e) => e.startsWith('exception')),
      erreursInattendues().join(' | '));
  }

  // 4. Micro simulé par un fichier audio (option)
  if (WAV) {
    await ouvrirAdvisor();
    await evaluer(`document.querySelector('[aria-label="سجل سؤالك"]').click()`);
    try {
      await attendreQue(`!!document.querySelector('[data-testid=fellah-reponse]') || !!document.querySelector('[role=status]')`, 25000);
      const transcription = await evaluer(`document.getElementById('fellah-question').value`);
      const statut = await evaluer(`document.querySelector('[role=status]')?.innerText || ''`);
      verifier('micro simulé → transcription', !!transcription && !statut, transcription || statut);
    } catch (e) {
      verifier('micro simulé → transcription', false, String(e.message));
    }
  }
} catch (e) {
  verifier('déroulé du test', false, String(e.message || e));
} finally {
  ws?.close();
  proc.kill();
  await attendre(500);
  try { rmSync(profil, { recursive: true, force: true }); } catch { /* profil encore verrouillé */ }
}
console.log(echecs ? `\n${echecs} échec(s)` : '\nTout est OK');
process.exit(echecs ? 1 : 0);
