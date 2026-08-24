import { NextResponse } from "next/server";
import { obtenerTablero } from "@/lib/tablero";

// GET /api/tasas — todo el tablero de un solo pedido, para la pizarra
// pública y el kit de marketing (necesita también el precio de USDT).
export async function GET() {
  try {
    const tablero = await obtenerTablero();
    return NextResponse.json(tablero);
  } catch (err) {
    console.error("Error armando el tablero de tasas:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
