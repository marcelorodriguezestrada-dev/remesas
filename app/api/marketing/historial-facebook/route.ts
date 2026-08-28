import { NextRequest, NextResponse } from "next/server";
import { listarPublicaciones } from "@/lib/publicaciones-marketing";

export async function GET(req: NextRequest) {
  const cantidadParam = req.nextUrl.searchParams.get("cantidad");
  const cantidad = cantidadParam ? Math.min(Number(cantidadParam) || 20, 200) : 20;

  try {
    const publicaciones = await listarPublicaciones(cantidad);
    return NextResponse.json(publicaciones);
  } catch (err) {
    console.error("Error listando publicaciones:", err);
    return NextResponse.json([], { status: 200 });
  }
}
