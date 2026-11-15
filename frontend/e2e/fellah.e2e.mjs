// Test de bout en bout de « سول بالدارجة » (/advisor) dans Chrome sans interface, piloté par le protocole
// DevTools (WebSocket intégré à Node, aucune dépendance).
//
// Prérequis : backend (python manage.py runserver 8000) et frontend (npm run dev) lancés.
// Utilisation :
//   npm run test:e2e
//   npm run test:e2e -- --wav chemin/question.wav --attendu QUOI_PLANTER   (micro simulé par un fichier audio)
// Variables : E2E_URL (défaut http://localhost:5173), CHROME_PATH.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : undefined);
const URL_APP = (process.env.E2E_URL || 'http://localhost:5173') + '/advisor';
const WAV = opt('--wav');
const ATTENDU = opt('--attendu');
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
  '--use-fake-ui-for-media-stream', '--lang=ar',
];
if (WAV) flags.push('--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${resolve(WAV)}`);
const proc = spawn(chrome, [...flags, 'about:blank'], { stdio: 'ignore' });

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const enAttente = new Map();
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
const reponse = () => evaluer(`document.querySelector('[data-testid=fellah-reponse]')?.innerText || ''`);

let echecs = 0;
function verifier(nom, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ' — ' + detail : ''}`);
  if (!ok) echecs++;
}

async function poserEcrit(question) {
  await evaluer(`(() => {
    const i = document.getElementById('fellah-question');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(i, ${JSON.stringify(question)});
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.form.requestSubmit();
  })()`);
  await attendreQue(`document.querySelector('[data-testid=fellah-reponse]')?.dataset.question === ${JSON.stringify(question)}`);
  return reponse();
}

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
    }
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Page.navigate', { url: URL_APP });
  await attendreQue(`!!document.getElementById('fellah-question') && document.querySelectorAll('[data-testid=fellah-suggestion]').length > 0`);

  verifier('champ « اكتب سؤالك » présent', await evaluer(`document.getElementById('fellah-question').placeholder === 'اكتب سؤالك'`));
  verifier('bloc en droite-à-gauche', await evaluer(`document.getElementById('fellah-question').closest('[dir=rtl]') !== null`));
  const micro = await evaluer(`!!document.querySelector('[aria-label="سجل سؤالك"]')`);
  const reco = await evaluer(`!!(window.SpeechRecognition || window.webkitSpeechRecognition)`);
  verifier('bouton 🎤 affiché seulement si le navigateur reconnaît la voix', micro === reco, `reconnaissance=${reco}`);

  const r1 = await poserEcrit('واش نبقى نزرع القمح؟');
  verifier('question écrite → réponse darija (blé : pas cette année)', r1.includes('القمح الطري') && r1.includes('ماشي هاد العام'), r1.split('\n')[0]);
  verifier('réponse sans chiffre', !/[0-9٠-٩]/.test(r1.replace(/Démo.*$/s, '')));
  verifier('sans clip enregistré : 🔊 désactivé, texte seul', await evaluer(
    `[...document.querySelectorAll('[data-testid=fellah-reponse] button')].some(b => b.disabled && b.innerText.includes('الصوت'))`));

  const r2 = await poserEcrit('شحال غادي نحصد؟');
  verifier('hors sujet → renvoi au conseiller, aucun rendement inventé', r2.includes('سول المستشار') && !/[0-9]/.test(r2.split('Démo')[0]));

  const suggestion = await evaluer(`(() => { const b = [...document.querySelectorAll('[data-testid=fellah-suggestion]')].at(-1); b.click(); return b.innerText; })()`);
  await attendreQue(`document.querySelector('[data-testid=fellah-reponse]')?.dataset.question === ${JSON.stringify(suggestion)}`);
  verifier('bouton de suggestion → réponse', (await reponse()).length > 0);

  if (WAV) {
    if (!reco) {
      verifier('micro simulé', false, 'reconnaissance vocale absente dans ce Chrome');
    } else {
      await evaluer(`(() => {
        const i = document.getElementById('fellah-question');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '');
        i.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      const avant = await evaluer(`document.querySelector('[data-testid=fellah-reponse]')?.dataset.question || ''`);
      await evaluer(`document.querySelector('[aria-label="سجل سؤالك"]').click()`);
      try {
        await attendreQue(`(document.querySelector('[data-testid=fellah-reponse]')?.dataset.question || '') !== ${JSON.stringify(avant)} || !!document.querySelector('[role=status]')`, 25000);
        const transcription = await evaluer(`document.getElementById('fellah-question').value`);
        const statut = await evaluer(`document.querySelector('[role=status]')?.innerText || ''`);
        verifier('micro simulé → transcription', !!transcription && !statut, transcription || statut);
        if (ATTENDU && transcription) {
          const r = await (await fetch((process.env.E2E_URL || 'http://localhost:5173') + '/api/v1/fellah/question/', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: transcription }),
          })).json();
          verifier(`type reconnu = ${ATTENDU}`, r.intention === ATTENDU, r.intention);
        }
      } catch (e) {
        verifier('micro simulé → transcription', false, String(e.message));
      }
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
