import { NextRequest, NextResponse } from "next/server";
import { publicarCotizacionEnFacebook } from "@/lib/marketing-publicacion";

// GET /api/marketing/publicar-facebook?secret=...
//
// Pensado para que lo llame un cron externo (GitHub Actions, cron-job.org,
// Render Cron Job, etc.) una vez por día. No requiere sesión de admin
// porque un cron no puede "loguearse" — en cambio, se protege con un
// secreto compartido (CRON_SECRET) que solo vos y el cron conocen. Sin
// este chequeo, cualquiera que encuentre la URL podría spamear la página
// de Facebook a demanda.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await publicarCotizacionEnFacebook();
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, postId: resultado.postId, texto: resultado.texto });
  } catch (err) {
    console.error("Error publicando en Facebook:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
