#!/usr/bin/env node
// Reenviament manual de leads a BrotaFit (brotafit/docs/spec-crm.md §5.4, D11).
//
// Llegeix els enviaments verificats del formulari "contacte" dels últims N dies
// amb l'API de Netlify i els envia a BrotaFit amb el mateix mòdul que la funció.
// BrotaFit respon 200 als que ja té i no els toca, així que es pot repetir sense por.
//
// Ús (variables només per a aquesta execució, mai en fitxers):
//   node scripts/reenviar-leads.mjs [--days 7] [--dry-run]
//
// Variables:
//   NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID          (lectura de formularis)
//   BROTAFIT_LEADS_URL, BROTAFIT_LEADS_SECRET    (no calen amb --dry-run)
//   BROTAFIT_VERCEL_BYPASS                       (opcional)
//
// No escriu dades personals per pantalla: només ids, dates i resultats.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildLead, missingConfig, sendLead } = require('../netlify/lib/brotafit.js');

const API = 'https://api.netlify.com/api/v1';
const FORM_NAME = 'contacte';

function parseArgs(argv) {
  const args = { days: 7, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--days') args.days = Number(argv[++i]);
    else if (a.startsWith('--days=')) args.days = Number(a.slice(7));
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Opció desconeguda: ${a}`);
  }
  if (!Number.isFinite(args.days) || args.days <= 0) throw new Error('--days ha de ser un nombre positiu');
  return args;
}

async function netlify(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`API de Netlify ${res.status} a ${path.split('?')[0]}`);
  return res.json();
}

async function fetchSubmissions(siteId, token, since) {
  const forms = await netlify(`/sites/${siteId}/forms`, token);
  const form = forms.find((f) => f.name === FORM_NAME);
  if (!form) throw new Error(`No s'ha trobat el formulari "${FORM_NAME}"`);

  const out = [];
  // L'API retorna els més recents primer; només els verificats (no el spam)
  for (let page = 1; page <= 50; page++) {
    const batch = await netlify(`/forms/${form.id}/submissions?per_page=100&page=${page}`, token);
    if (!batch.length) break;
    let reachedOld = false;
    for (const s of batch) {
      if (new Date(s.created_at) >= since) out.push(s);
      else reachedOld = true;
    }
    if (reachedOld || batch.length < 100) break;
  }
  // Del més antic al més recent
  return out.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Ús: node scripts/reenviar-leads.mjs [--days 7] [--dry-run]');
    return 0;
  }

  const env = process.env;
  const needed = ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'].filter((k) => !env[k]);
  if (!args.dryRun) needed.push(...missingConfig(env));
  if (needed.length) {
    console.error(`Falten variables d'entorn: ${needed.join(', ')}`);
    return 1;
  }

  const since = new Date(Date.now() - args.days * 24 * 60 * 60 * 1000);
  const subs = await fetchSubmissions(env.NETLIFY_SITE_ID, env.NETLIFY_AUTH_TOKEN, since);
  console.log(`${subs.length} enviaments de "${FORM_NAME}" des del ${since.toISOString()}${args.dryRun ? ' (dry-run)' : ''}`);

  if (args.dryRun) {
    for (const s of subs) {
      console.log(`  ${s.id}  ${s.created_at}${buildLead(s) ? '' : '  (sense consentiment: no s\'enviaria)'}`);
    }
    return 0;
  }

  const summary = { created: 0, existing: 0, noConsent: 0, errors: [] };
  for (const s of subs) {
    const lead = buildLead(s);
    if (!lead) {
      summary.noConsent++;
      console.log(`  ${s.id}  omès: sense consentiment`);
      continue;
    }
    const r = await sendLead(lead, env);
    if (r.status === 201) summary.created++;
    else if (r.status === 200) summary.existing++;
    else summary.errors.push(s.id);
    console.log(`  ${s.id}  ${s.created_at}  → ${r.status || r.error} (intents: ${r.attempts})`);
  }

  console.log('\nResum');
  console.log(`  Creats (201):         ${summary.created}`);
  console.log(`  Ja existents (200):   ${summary.existing}`);
  console.log(`  Sense consentiment:   ${summary.noConsent}`);
  console.log(`  Errors:               ${summary.errors.length}${summary.errors.length ? '  → ' + summary.errors.join(', ') : ''}`);
  return summary.errors.length ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => { console.error(`Error: ${err.message}`); process.exit(1); },
);
