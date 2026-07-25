import { NextResponse } from "next/server";
import { getCotizacionBlue } from "@/lib/dolarapi";
import { getCotizacionUsdtBob } from "@/lib/criptoya";
import { calcularTipoCambioCliente, MARGEN_DEFAULT, type TasasMercado } from "@/lib/pricing";

// GET /api/tasas — todo el tablero de un solo pedido, para la pizarra pública.
export async function GET() {
  try {
    const [blue, usdtBob] = await Promise.all([
      getCotizacionBlue(),
      getCotizacionUsdtBob(),
    ]);

    const tasas: TasasMercado = {
      ARS: blue.venta,
      BOB: usdtBob.ask,
      fechaArs: blue.fechaActualizacion,
      fechaBob: usdtBob.time,
    };

    const margenPct = MARGEN_DEFAULT;

    return NextResponse.json({
      actualizado: new Date().toISOString(),
      margenPct,
      usdArs: { compra: blue.compra, venta: blue.venta },
      usdBob: { compra: usdtBob.bid, venta: usdtBob.ask },
      // Cuántas unidades de la moneda destino entrega el operador por
      // cada 1.000 unidades de la moneda de origen, ya con el margen
      // aplicado (es el precio real que se le ofrece al cliente).
      arsABob1000: calcularTipoCambioCliente("ARS", "BOB", tasas, margenPct) * 1000,
      bobAArs1000: calcularTipoCambioCliente("BOB", "ARS", tasas, margenPct) * 1000,
    });
  } catch (err) {
    console.error("Error armando el tablero de tasas:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
