import { obtenerTablero } from "@/lib/tablero";

export interface BorradorArticulo {
  titulo: string;
  resumen: string;
  contenido: string;
}

const SYSTEM_PROMPT = `Sos un analista financiero que escribe para un público general en Argentina y Bolivia,
sobre el mercado del dólar blue, el USDT y el cambio ARS/BOB. Tu artículo tiene que:

- Estar en español, tono claro y cercano, sin jerga innecesaria.
- Usar ÚNICAMENTE los números que te paso en el mensaje del usuario. NUNCA inventes cifras,
  porcentajes, fechas de eventos, declaraciones de funcionarios, ni datos históricos que no
  te di. Si querés dar contexto histórico o político, hacelo en términos generales sin
  inventar números o hechos puntuales que no te consta que sean reales.
- Pensado para SEO: el título tiene que ser algo que alguien buscaría en Google
  (ej. "cuánto está el dólar blue hoy", "cambio de pesos a bolivianos").
- 3 a 5 párrafos cortos, sin títulos de sección ni viñetas — texto corrido, párrafos
  separados por una línea en blanco.
- Terminar con una oración que invite a cotizar el monto propio (sin poner un link, eso lo
  agrega la plantilla después).
- Si te paso opiniones o análisis de otros comentaristas como referencia (más abajo, entre
  las etiquetas <opiniones_referencia>), usalas SOLO para entender qué tendencia o ángulo
  está comentando la gente ahora mismo — nunca copies frases textuales de esas opiniones, ni
  las atribuyas a una persona o medio puntual (no sabés si esa cita es exacta ni tenés
  permiso para reproducirla). Si las mencionás, hacelo en términos generales tipo "algunos
  analistas vienen señalando que..." parafraseado con tus propias palabras, nunca entre
  comillas.

Devolvé ÚNICAMENTE JSON válido, sin texto ni markdown alrededor, con esta forma EXACTA:
{ "titulo": "...", "resumen": "...", "contenido": "..." }
"resumen" es una sola oración (para mostrar en la lista de artículos), "contenido" son los
párrafos completos separados por "\\n\\n".`;

// Groq expone una API compatible con el formato de OpenAI (chat completions),
// así que la llamada es un POST simple con Bearer token — nada de SDKs.
//
// Este es el modelo más liviano de la tabla "Production Models" de Groq:
// suficiente para armar un artículo corto y estructurado, y con más
// margen dentro del tier gratis (rate limits más generosos que un modelo
// grande). Sin tarjeta cargada en tu cuenta de Groq, no te pueden cobrar
// nada — el free tier solo limita cuántos pedidos por minuto hacés, no
// cobra automático.
//
// OJO: Groq va moviendo modelos entre "Production" y "Enterprise" (solo
// con contrato) sin mucho aviso. Si este modelo alguna vez responde 404
// con "does not exist or you do not have access to it", entrá a
// https://console.groq.com/docs/models y fijate cuál está en la tabla
// "Production Models" (no en "Enterprise" / "Contact Sales").
const GROQ_MODEL = "openai/gpt-oss-20b";

export async function generarBorradorArticulo(
  tema?: string,
  opinionesReferencia?: string
): Promise<BorradorArticulo> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar GROQ_API_KEY en las variables de entorno del servidor.");
  }

  const tablero = await obtenerTablero();

  const datosReales = `
Datos actuales (${new Date(tablero.actualizado).toLocaleString("es-AR")}):
- Dólar blue Argentina: compra $${tablero.usdArs.compra}, venta $${tablero.usdArs.venta}
- 1.000 ARS equivalen a ${tablero.arsABob1000.toFixed(2)} BOB
- 1.000 BOB equivalen a $${tablero.bobAArs1000.toFixed(2)} ARS
- 1 USDT equivale a $${tablero.usdtAArs.toFixed(2)} ARS
- 1 USDT equivale a ${tablero.usdtABob.toFixed(2)} BOB
- Margen de conversión aplicado por la casa de cambio: ${(tablero.margenPct * 100).toFixed(1)}%
`.trim();

  const bloqueOpiniones = opinionesReferencia?.trim()
    ? `\n\n<opiniones_referencia>\n${opinionesReferencia.trim()}\n</opiniones_referencia>`
    : "";

  const userPrompt = tema
    ? `${datosReales}\n\nEscribí el artículo enfocado en este tema puntual: ${tema}${bloqueOpiniones}`
    : `${datosReales}\n\nEscribí un artículo de análisis general sobre el estado actual del cambio ARS/BOB/USDT con estos datos.${bloqueOpiniones}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_completion_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" },
      // Los modelos gpt-oss "piensan" antes de responder, gastando tokens
      // en ese razonamiento interno — con esfuerzo "low" y el razonamiento
      // oculto del content, casi todo el presupuesto de tokens queda
      // disponible para escribir el artículo en sí, no para pensarlo.
      reasoning_effort: "low",
      reasoning_format: "hidden",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Groq respondió ${res.status}: ${detalle.slice(0, 300)}`);
  }

  const data = await res.json();
  const texto = (data.choices?.[0]?.message?.content ?? "").trim();
  const limpio = texto.replace(/```json\n?|\n?```/g, "").trim();

  try {
    const parseado = JSON.parse(limpio);
    return {
      titulo: parseado.titulo,
      resumen: parseado.resumen,
      contenido: parseado.contenido,
    };
  } catch {
    throw new Error(`Groq no devolvió JSON válido: ${limpio.slice(0, 300)}`);
  }
}
