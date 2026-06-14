// Netlify event-triggered function
// S'executa automàticament cada vegada que es rep un formulari
// Usa el mòdul https natiu (compatible amb totes les versions de Node.js)

const https = require('https');

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
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: responseData });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async function (event) {
  console.log('📩 Funció iniciada');

  try {
    const parsed = JSON.parse(event.body);
    const d = parsed.payload.data;
    console.log('📋 Dades rebudes:', JSON.stringify(d));

    const comConescut = {
      'instagram':   'Instagram',
      'google':      'Google',
      'recomanacio': 'Recomanació',
      'passant':     'Passant pel carrer',
      'altre':       'Altre',
    };

    const inversio = {
      'menys-50': 'Menys de 50€',
      '50-100':   '50 – 100€',
      '100-150':  '100 – 150€',
      'mes-150':  'Més de 150€',
    };

    const notionBody = {
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        'Nom': {
          title: [{ text: { content: d.nom || '' } }],
        },
        'Edat': {
          number: parseInt(d.edat) || null,
        },
        'Telèfon': {
          phone_number: d.telefon || '',
        },
        'Email': {
          email: d.email || '',
        },
        'Com ens ha conegut': {
          select: { name: comConescut[d.com_conegut] || d.com_conegut || '' },
        },
        'Objectiu': {
          rich_text: [{ text: { content: d.objectiu || '' } }],
        },
        'Situació actual': {
          rich_text: [{ text: { content: d.obstacle || '' } }],
        },
        'Disponibilitat': {
          rich_text: [{ text: { content: d.disponibilitat || '' } }],
        },
        'Inversió mensual': {
          select: { name: inversio[d.inversio] || d.inversio || '' },
        },
      },
    };

    console.log('🚀 Enviant a Notion...');
    const result = await notionRequest(notionBody);
    console.log('📬 Resposta Notion status:', result.status);
    console.log('📬 Resposta Notion body:', result.body);

    if (result.status !== 200) {
      console.error('❌ Error de Notion:', result.body);
      return { statusCode: 500, body: result.body };
    }

    console.log('✅ Guardat correctament a Notion');
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('❌ Error inesperat:', err.message);
    console.error('Stack:', err.stack);
    return { statusCode: 500, body: err.toString() };
  }
};
