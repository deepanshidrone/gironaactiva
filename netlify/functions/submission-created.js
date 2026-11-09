// Funció de Netlify activada per esdeveniment: s'executa automàticament amb cada
// enviament vàlid de Netlify Forms (els que Akismet o el camp trampa no descarten).
//
// Doble enviament (brotafit/docs/spec-crm.md, D2): cada lead va a Notion i a BrotaFit,
// de forma independent. La funció només retorna error si fallen tots dos.
// Logs SENSE dades personals: només l'id de l'enviament i el resultat de cada destí.

const https = require('https');
const { buildLead, missingConfig, sendLead, CHANNELS } = require('../lib/brotafit');

// ---------- Notion ----------

// Notion no admet comes als noms de les opcions de tipus select
const notionChannel = (key) => (CHANNELS[key] || key || '').replace(/,\s*/g, ' o ');

// Opcions d'inversió que ja existeixen a la base de dades de Notion
const NOTION_INVESTMENT = {
  'menys-50': 'Menys de 50€',
  '50-100':   '50 – 100€',
  '100-150':  '100 – 150€',
  'mes-150':  'Més de 150€',
};

function notionRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.notion.com',
      path: '/v1/pages',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: responseData }));
    });

    req.on('timeout', () => req.destroy(new Error('temps esgotat')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Codi d'error de Notion (p. ex. "validation_error"), sense el missatge, que pot portar dades
function notionErrorCode(body) {
  try { return JSON.parse(body).code || 'desconegut'; } catch { return 'desconegut'; }
}

async function sendToNotion(id, d) {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
    console.warn(`[notion] ${id} omès: falten NOTION_TOKEN o NOTION_DATABASE_ID`);
    return { skipped: true };
  }

  const notionBody = {
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      'Nom': { title: [{ text: { content: d.nom || '' } }] },
      'Edat': { number: parseInt(d.edat) || null },
      'Telèfon': { phone_number: d.telefon || '' },
      'Email': { email: d.email || '' },
      'Com ens ha conegut': { select: d.com_conegut ? { name: notionChannel(d.com_conegut) } : null },
      'Objectiu': { rich_text: [{ text: { content: d.objectiu || '' } }] },
      'Situació actual': { rich_text: [{ text: { content: d.obstacle || '' } }] },
      'Disponibilitat': { rich_text: [{ text: { content: d.disponibilitat || '' } }] },
      'Inversió mensual': { select: d.inversio ? { name: NOTION_INVESTMENT[d.inversio] || d.inversio } : null },
    },
  };

  const result = await notionRequest(notionBody);
  if (result.status !== 200) {
    throw new Error(`Notion ${result.status} (${notionErrorCode(result.body)})`);
  }
  console.log(`[notion] ${id} desat`);
  return { ok: true };
}

// ---------- BrotaFit ----------

async function sendToBrotafit(id, payload) {
  const missing = missingConfig(process.env);
  if (missing.length) {
    console.warn(`[brotafit] ${id} omès: falten ${missing.join(', ')}`);
    return { skipped: true };
  }

  const lead = buildLead(payload);
  if (!lead) {
    console.warn(`[brotafit] ${id} omès: sense consentiment RGPD`);
    return { skipped: true };
  }

  const r = await sendLead(lead);
  if (r.ok) {
    console.log(`[brotafit] ${id} ${r.status === 201 ? 'creat' : 'ja existia'} (${r.status}, intents: ${r.attempts})`);
    return { ok: true };
  }
  console.error(`[brotafit] ${id} error ${r.status || r.error} (intents: ${r.attempts})`);
  console.error(`LEAD NO ENTREGADO ${id}`);
  throw new Error(`BrotaFit ${r.status || r.error}`);
}

// ---------- Handler ----------

exports.handler = async function (event) {
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch {
    console.error('Esdeveniment no vàlid: cos il·legible');
    return { statusCode: 400, body: 'Bad event' };
  }

  const id = payload.id || 'sense-id';
  const d = payload.data || {};
  console.log(`Enviament rebut ${id}`);

  const [notion, brotafit] = await Promise.allSettled([
    sendToNotion(id, d),
    sendToBrotafit(id, payload),
  ]);

  if (notion.status === 'rejected') console.error(`[notion] ${id} error: ${notion.reason.message}`);
  if (brotafit.status === 'rejected' && !/^BrotaFit/.test(brotafit.reason.message)) {
    console.error(`[brotafit] ${id} error inesperat: ${brotafit.reason.message}`);
    console.error(`LEAD NO ENTREGADO ${id}`);
  }

  // Només és error si fallen tots dos (un destí omès no compta com a fallada)
  if (notion.status === 'rejected' && brotafit.status === 'rejected') {
    return { statusCode: 500, body: 'Error' };
  }
  return { statusCode: 200, body: 'OK' };
};
