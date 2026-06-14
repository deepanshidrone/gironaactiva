// Netlify event-triggered function
// S'executa automàticament cada vegada que es rep un formulari
// Variables d'entorn necessàries a Netlify:
//   NOTION_TOKEN       → token de la integració de Notion
//   NOTION_DATABASE_ID → ID de la base de dades de Notion

exports.handler = async function (event) {
  try {
    const payload = JSON.parse(event.body).payload;
    const d = payload.data;

    // Mapa de valors del camp "com_conegut" → etiquetes llegibles
    const comConescut = {
      'instagram':    'Instagram',
      'google':       'Google',
      'recomanacio':  'Recomanació',
      'passant':      'Passant pel carrer',
      'altre':        'Altre',
    };

    // Mapa de valors del camp "inversio" → etiquetes llegibles
    const inversio = {
      'menys-50': 'Menys de 50€',
      '50-100':   '50 – 100€',
      '100-150':  '100 – 150€',
      'mes-150':  'Més de 150€',
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Notion API error:', JSON.stringify(error, null, 2));
      console.error('Status:', response.status);
      return { statusCode: 500, body: JSON.stringify(error) };
    }

    console.log('✅ Nou contacte guardat a Notion:', d.nom, d.email);
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('❌ Error inesperat:', err.message);
    console.error('Stack:', err.stack);
    return { statusCode: 500, body: err.toString() };
  }
};
