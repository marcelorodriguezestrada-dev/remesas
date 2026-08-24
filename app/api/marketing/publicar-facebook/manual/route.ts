import { NextResponse } from "next/server";
import { publicarCotizacionEnFacebook } from "@/lib/marketing-publicacion";

// POST /api/marketing/publicar-facebook/manual
//
// Dispara la misma publicación que el cron diario, pero a demanda desde
// el botón "Publicar ahora" en /admin/marketing. No pide CRON_SECRET
// porque, siguiendo el mismo criterio que el resto de los endpoints de
// /admin en esta app (ver /api/operaciones y /api/competencia), la
// protección es que esta ruta solo se llama desde una página que ya está
// detrás de AdminGuard (sesión de Firebase Auth requerida).
export async function POST() {
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
