import { NextResponse } from "next/server";
import { getTitulares } from "@/lib/noticias";

// GET /api/noticias — titulares recientes sobre el dólar en Argentina y Bolivia.
export async function GET() {
  try {
    const [argentina, bolivia] = await Promise.all([
      getTitulares("AR", "dólar OR dolar blue OR dólar oficial"),
      getTitulares("BO", "dólar Bolivia OR tipo de cambio Bolivia"),
    ]);

    return NextResponse.json({ argentina, bolivia });
  } catch (err) {
    console.error("Error trayendo noticias:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
