import { NextResponse } from "next/server";
import { obtenerOportunidad } from "@/lib/oportunidad";

export async function GET() {
  try {
    const oportunidad = await obtenerOportunidad();
    return NextResponse.json(oportunidad);
  } catch (err) {
    console.error("Error calculando la oportunidad entre exchanges:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
