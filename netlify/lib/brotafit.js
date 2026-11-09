// Enviament de leads a BrotaFit (contracte v1, brotafit/docs/spec-crm.md §5.2 i §6.1).
//
// Mòdul compartit: l'usen la funció netlify/functions/submission-created.js i el
// script scripts/reenviar-leads.mjs. Viu fora de netlify/functions perquè tot el
// que hi ha en aquella carpeta es publica com a funció.
//
// Els textos (preguntes, opcions i casella RGPD) són els visibles a index.html:
// si canvien a la web, s'han de canviar aquí.
// Cap funció d'aquest mòdul escriu dades personals al log.

const crypto = require('crypto');

const POLICY_URL = 'https://gironaactiva.com/politica-privacitat.html';

const CONSENT_TEXT =
  'He llegit i accepto la Política de Privacitat i el tractament de les meves dades personals per contactar amb Girona Activa.';

// <select name="com_conegut">: clau del formulari → text visible
const CHANNELS = {
  'recomanacio-amic':  'Recomanació (amic/ga, familiar)',
  'recomanacio-metge': 'Recomanació metge o clínica',
  'passava-davant':    'Passava per davant del centre',
  'instagram':         'Instagram',
  'google':            'Google',
  'altres':            'Altres',
};

// Radios name="inversio": valor → text visible
const INVESTMENT = {
  'menys-50': 'Menys de 50€/mes',
  '50-100':   'Entre 50€ i 100€/mes',
  '100-150':  'Entre 100€ i 150€/mes',
  'mes-150':  'Més de 150€/mes',
};

// Preguntes del formulari, en l'ordre de la web (sense l'asterisc d'obligatori)
const ANSWERS = [
  { key: 'edat',           label: 'Edat' },
  { key: 'objectiu',       label: 'Què vols aconseguir?' },
  { key: 'obstacle',       label: 'Per què creus que no ho estàs aconseguint fins ara?' },
  { key: 'disponibilitat', label: 'Quina és la teva disponibilitat horària?' },
  { key: 'inversio',       label: 'Quina inversió estàs disposat/da a fer en la teva salut?' },
];

// Reintents (D11): espera abans de cada intent, temps màxim per intent i pressupost total
const RETRY_DELAYS_MS = [0, 1000, 3000];
const ATTEMPT_TIMEOUT_MS = 2000;
const TOTAL_BUDGET_MS = 9000; // la funció de Netlify té 10 s
const MIN_ATTEMPT_MS = 500;

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const orNull = (v) => (str(v) === '' ? null : str(v));

/** La casella RGPD arriba marcada? (Netlify envia "on" si està marcada) */
function hasConsent(data) {
  const v = str(data && data.rgpd).toLowerCase();
  return v !== '' && v !== 'false' && v !== 'off';
}

/**
 * Construeix el JSON del contracte v1 a partir d'un enviament de Netlify Forms
 * ({ id, created_at, data }). Retorna null si no hi ha consentiment.
 */
function buildLead(submission) {
  const d = (submission && submission.data) || {};
  if (!hasConsent(d)) return null;

  const channelKey = str(d.com_conegut);
  const channel = channelKey
    ? { key: channelKey, label: CHANNELS[channelKey] || channelKey }
    : null;

  const answers = ANSWERS.map(({ key, label }) => ({
    key,
    label,
    value: key === 'inversio' ? (INVESTMENT[str(d.inversio)] || str(d.inversio)) : str(d[key]),
  }));

  return {
    version: 1,
    source: 'web',
    form: 'contacte',
    external_id: str(submission.id),
    submitted_at: str(submission.created_at),
    page_url: orNull(d.referrer),
    contact: {
      full_name: str(d.nom),
      email: orNull(d.email),
      phone: orNull(d.telefon),
    },
    channel,
    message: null,
    answers,
    consent: {
      accepted: true,
      text: CONSENT_TEXT,
      policy_url: POLICY_URL,
    },
  };
}

/** Falten les variables de BrotaFit? Retorna la llista de les que falten. */
function missingConfig(env) {
  return ['BROTAFIT_LEADS_URL', 'BROTAFIT_LEADS_SECRET'].filter((k) => !env[k]);
}

function sign(secret, timestamp, body) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isRetryable = (status) => status === 429 || status >= 500;

/**
 * Envia un lead signat a BrotaFit amb fins a 3 intents.
 * Retorna { ok, status, attempts, duplicate, error }, sense dades personals.
 *   ok=true amb 201 (creat) o 200 (ja existia).
 *   status=null vol dir error de xarxa o temps esgotat.
 */
async function sendLead(lead, env = process.env, opts = {}) {
  const url = env.BROTAFIT_LEADS_URL;
  const secret = env.BROTAFIT_LEADS_SECRET;
  const bypass = env.BROTAFIT_VERCEL_BYPASS;
  const delays = opts.delays || RETRY_DELAYS_MS;
  const attemptTimeout = opts.attemptTimeoutMs || ATTEMPT_TIMEOUT_MS;
  const deadline = Date.now() + (opts.budgetMs || TOTAL_BUDGET_MS);

  // El cos i la signatura es calculen un cop: els reintents envien exactament el mateix
  const body = JSON.stringify(lead);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = {
    'Content-Type': 'application/json',
    'X-Brotafit-Timestamp': timestamp,
    'X-Brotafit-Signature': sign(secret, timestamp, body),
  };
  if (bypass) headers['x-vercel-protection-bypass'] = bypass;

  let last = { ok: false, status: null, attempts: 0, error: 'sense intents' };

  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) {
      if (Date.now() + delays[i] + MIN_ATTEMPT_MS > deadline) break;
      await sleep(delays[i]);
    }
    const timeout = Math.min(attemptTimeout, deadline - Date.now());
    if (timeout < MIN_ATTEMPT_MS) break;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
      // Es llegeix el cos per alliberar la connexió; no es registra
      await res.text().catch(() => {});
      last = { ok: res.status === 200 || res.status === 201, status: res.status, attempts: i + 1, duplicate: res.status === 200 };
      if (last.ok || !isRetryable(res.status)) return last;
    } catch (err) {
      last = { ok: false, status: null, attempts: i + 1, error: err.name === 'AbortError' ? 'temps esgotat' : 'error de xarxa' };
    } finally {
      clearTimeout(timer);
    }
  }
  return last;
}

module.exports = {
  CHANNELS,
  INVESTMENT,
  ANSWERS,
  CONSENT_TEXT,
  POLICY_URL,
  hasConsent,
  buildLead,
  missingConfig,
  sendLead,
};
