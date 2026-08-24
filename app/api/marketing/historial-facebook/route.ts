import { NextResponse } from "next/server";
import { listarPublicaciones } from "@/lib/publicaciones-marketing";

export async function GET() {
  try {
    const publicaciones = await listarPublicaciones(20);
    return NextResponse.json(publicaciones);
  } catch (err) {
    console.error("Error listando publicaciones:", err);
    return NextResponse.json([], { status: 200 });
  }
}
