import { NextResponse } from "next/server";
import { getCotizacionBlue } from "@/lib/dolarapi";
import { calcularTipoCambioCliente, MARGEN_DEFAULT } from "@/lib/pricing";
import type { Cotizacion } from "@/lib/pricing";

// GET /api/cotizacion?margen=0.03
// Si no se pasa "margen", usa MARGEN_DEFAULT.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const margenParam = searchParams.get("margen");
  const margenPct = margenParam ? Number(margenParam) : MARGEN_DEFAULT;

  if (Number.isNaN(margenPct) || margenPct < 0 || margenPct >= 1) {
    return NextResponse.json(
      { error: "El parámetro 'margen' debe ser un número entre 0 y 1" },
      { status: 400 }
    );
  }

  try {
    const blue = await getCotizacionBlue();
    const tipoCambioCliente = calcularTipoCambioCliente(
      blue.venta,
      margenPct
    );

    const cotizacion: Cotizacion = {
      ventaBlue: blue.venta,
      margenPct,
      tipoCambioCliente,
      fechaActualizacion: blue.fechaActualizacion,
    };

    return NextResponse.json(cotizacion);
  } catch (err) {
    console.error("Error obteniendo cotización:", err);
    return NextResponse.json(
      { error: "No se pudo obtener la cotización del blue. Probá de nuevo." },
      { status: 502 }
    );
  }
}
