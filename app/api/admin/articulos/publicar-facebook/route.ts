import { NextRequest, NextResponse } from "next/server";
import { obtenerArticulo } from "@/lib/articulos";
import { publicarArticuloEnFacebook } from "@/lib/publicar-articulo-facebook";

// POST /api/admin/articulos/publicar-facebook
// Body: { slug: string }
//
// Mismo criterio que /api/marketing/publicar-facebook/manual: sin
// CRON_SECRET, porque esta ruta solo se llama desde /admin/analisis, ya
// protegida por AdminGuard.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Falta el slug del artículo" }, { status: 400 });
    }

    let articulo;
    try {
      articulo = await obtenerArticulo(slug);
    } catch {
      // Un borrador (publicado: false) rechaza la lectura por permisos
      // acá mismo, porque esta ruta corre sin sesión de usuario — lo
      // tratamos igual que "no encontrado/no publicado" de cara al admin.
      articulo = null;
    }

    if (!articulo) {
      return NextResponse.json(
        { error: "Artículo no encontrado o todavía es un borrador (publicalo primero)" },
        { status: 404 }
      );
    }

    const resultado = await publicarArticuloEnFacebook(articulo);
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, postId: resultado.postId });
  } catch (err) {
    console.error("Error publicando artículo en Facebook:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
