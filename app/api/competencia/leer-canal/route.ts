import { NextResponse } from "next/server";
import { extraerCompraVenta } from "@/lib/parse-cotizacion-texto";

// GET /api/competencia/leer-canal?canal=jhsafebolivia
//
// Telegram expone una vista web pública de sus canales en t.me/s/{canal},
// sin necesidad de login ni bot token — es la misma página que ves si
// entrás desde el navegador sin la app. Leemos esa página y extraemos el
// texto del último mensaje.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const canalCrudo = searchParams.get("canal");

  if (!canalCrudo) {
    return NextResponse.json(
      { error: "Falta el parámetro 'canal' (el @usuario del canal público)" },
      { status: 400 }
    );
  }

  // Aceptamos que lo pasen como "@canal", "canal" o la URL completa.
  const canal = canalCrudo
    .replace(/^https?:\/\/t\.me\/s?\/?/i, "")
    .replace(/^@/, "")
    .trim();

  if (!/^[a-zA-Z0-9_]{5,}$/.test(canal)) {
    return NextResponse.json(
      { error: "El nombre de canal no parece válido" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://t.me/s/${canal}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; remesas-app/1.0)" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo acceder al canal @${canal} (¿es público?)` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Cada mensaje del canal viene en un bloque
    // <div class="tgme_widget_message_text ...">...</div>; tomamos el
    // último que aparece en la página (los más recientes).
    const bloques = [
      ...html.matchAll(
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g
      ),
    ];

    if (bloques.length === 0) {
      return NextResponse.json(
        { error: `No se encontraron mensajes públicos en @${canal}` },
        { status: 404 }
      );
    }

    const ultimoHtml = bloques[bloques.length - 1][1];
    const texto = ultimoHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    const { compra, venta } = extraerCompraVenta(texto);

    return NextResponse.json({ canal, texto, compra, venta });
  } catch (err) {
    console.error("Error leyendo canal de Telegram:", err);
    return NextResponse.json(
      { error: "No se pudo leer el canal. Probá de nuevo." },
      { status: 502 }
    );
  }
}
