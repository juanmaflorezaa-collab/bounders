// api/extract-facts.js
// Analiza la conversación y devuelve una lista breve de datos personales
// duraderos (gustos, rutinas, contexto) para personalizar futuras respuestas.
// Requiere un usuario autenticado con Supabase (header Authorization).

import { createClient } from '@supabase/supabase-js';

async function requireUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en las variables de entorno del servidor' });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Formato de petición inválido' });
    return;
  }

  const transcript = messages
    .map((m) => (m.role === 'user' ? 'Usuario: ' : 'IA: ') + m.content)
    .join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content:
              'A partir de esta conversación, extrae una lista breve (máx 5) de datos personales ' +
              'duraderos sobre el usuario (gustos, rutinas, contexto) útiles para personalizar futuras ' +
              'respuestas. Responde SOLO con JSON válido de la forma {"facts": ["dato1", "dato2"]}, sin texto adicional.\n\n' +
              transcript,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'Error de la API de Anthropic', detail: errText });
      return;
    }

    const data = await response.json();
    const raw = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    let facts = [];
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.facts)) facts = parsed.facts.slice(0, 5);
    } catch (e) {
      // si no se puede parsear, simplemente no actualizamos los datos
    }

    res.status(200).json({ facts });
  } catch (err) {
    res.status(500).json({ error: 'Error al contactar con la IA', detail: String(err) });
  }
}
