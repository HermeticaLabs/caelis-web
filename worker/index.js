/**
 * worker/index.js — Caelis Web · Cloudflare Worker
 * Proxy seguro para la API de Anthropic.
 * La API key nunca se expone en el frontend.
 *
 * Deploy: wrangler publish
 * Variables de entorno (Cloudflare Dashboard):
 *   ANTHROPIC_API_KEY = sk-ant-...
 *
 * © 2024–2026 Cristian Valeria Bravo / Hermetica Labs
 */

const ALLOWED_ORIGIN = 'https://hermeticalabs.github.io';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1000;

// System prompt hermético para lecturas Atacir
const SYSTEM_PROMPT = `Eres el intérprete de Caelis Engine, motor astronómico hermético de precisión.
Tu rol es traducir los datos matemáticos del Atacir en una lectura contemplativa y precisa.

Estilo: equilibrio entre lo simbólico y lo técnico. Preciso pero no frío. Contemplativo pero no vago.
Idioma: responde siempre en el mismo idioma que el usuario.
Extensión: lectura completa en 4-6 párrafos estructurados por sección.
Tono: hermético, sobrio, directo. Sin dramatismo ni predicciones absolutas.

Estructura de la lectura:
1. Momento natal — posición de los astros al nacer
2. Aspectos dominantes — los más exactos y su significado
3. Direcciones activas — arcos dentro de ±2 años (marcados con ◀)
4. Ciclos y resonancias — patrones de largo plazo
5. El cielo ahora — tránsitos sobre la carta natal

Basa todo en los datos matemáticos del JSON. No inventes posiciones.`;

export default {
  async fetch(request, env) {

    // CORS — solo origen autorizado
    const origin = request.headers.get('Origin') || '';
    const isAllowed = origin === ALLOWED_ORIGIN ||
                      origin.includes('localhost') ||
                      origin.includes('127.0.0.1');

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Solo POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { atacirData, isPremium, lang } = body;

      if (!atacirData) {
        return new Response(JSON.stringify({ error: 'atacirData requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }

      // Free: solo aspecto natal más exacto
      // Premium: JSON completo
      const dataToSend = isPremium
        ? atacirData
        : { aspecto_natal: atacirData.aspectos_natales?.[0] || null };

      const userMessage = isPremium
        ? `Genera una lectura completa de este Atacir:\n\n${JSON.stringify(dataToSend, null, 2)}`
        : `Genera una breve interpretación de este aspecto natal:\n\n${JSON.stringify(dataToSend, null, 2)}\n\nMáximo 3 líneas.`;

      // Llamada a Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: isPremium ? MAX_TOKENS : 200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      const result = await response.json();
      const text = result.content?.[0]?.text || '';

      return new Response(JSON.stringify({ lectura: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Error interno', detail: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
  }
};
