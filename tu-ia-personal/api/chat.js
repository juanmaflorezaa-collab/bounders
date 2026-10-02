// api/chat.js
// Función serverless (Vercel) que recibe el historial de conversación
// y llama a la API de Anthropic desde el servidor, para que la
// ANTHROPIC_API_KEY nunca se exponga en el navegador del usuario.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
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
