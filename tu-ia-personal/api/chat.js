// api/chat.js
// Función serverless (Vercel) que recibe el historial de conversación
// y llama a la API de Anthropic desde el servidor, para que la
// ANTHROPIC_API_KEY nunca se exponga en el navegador del usuario.
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

  const { messages, facts } = req.body || {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Formato de petición inválido' });
    return;
  }

  const systemPrompt =
    "Eres un asistente de IA personal y cercano, tipo 'Alexa superpersonalizada'. " +
    "Responde en español, de forma breve, cálida y útil." +
    (Array.isArray(facts) && facts.length
      ? '\n\nDatos que recuerdas de este usuario de conversaciones anteriores:\n- ' + facts.join('\n- ')
      : '');

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
        max_tokens: 800,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'Error de la API de Anthropic', detail: errText });
      return;
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Error al contactar con la IA', detail: String(err) });
  }
}
