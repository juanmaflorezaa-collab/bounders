// api/memory.js
// GET  -> devuelve { facts, history } del usuario autenticado.
// POST -> guarda { facts, history } para el usuario autenticado.
// La identidad del usuario se verifica con el token de Supabase enviado
// en el header Authorization: Bearer <access_token>.

import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getUser(req, supabase) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el servidor' });
    return;
  }

  const supabase = getServiceClient();
  const user = await getUser(req, supabase);
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('memories')
      .select('facts, history')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ facts: data?.facts || [], history: data?.history || [] });
    return;
  }

  if (req.method === 'POST') {
    const { facts, history } = req.body || {};
    const { error } = await supabase
      .from('memories')
      .upsert({
        user_id: user.id,
        facts: Array.isArray(facts) ? facts : [],
        history: Array.isArray(history) ? history.slice(-30) : [],
        updated_at: new Date().toISOString(),
      });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
}
