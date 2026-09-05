import { NextRequest, NextResponse } from "next/server";
import { generarBorradorArticulo } from "@/lib/generar-articulo-ia";

// POST /api/admin/articulos/generar-ia
// Body opcional: { tema?: string }
//
// Como el resto de los endpoints de acción bajo /admin (ver publicar-facebook/manual),
// no valida sesión acá: la protección es que esta ruta solo se llama desde
// /admin/analisis, que ya está detrás de AdminGuard. No toca Firestore —
// solo llama a Groq y devuelve el borrador para que el admin lo revise
// y lo guarde él mismo (esa escritura sí va directo del navegador autenticado).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const borrador = await generarBorradorArticulo(body.tema);
    return NextResponse.json(borrador);
  } catch (err) {
    console.error("Error generando artículo con IA:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
