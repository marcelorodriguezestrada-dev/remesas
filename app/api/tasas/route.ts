import { NextResponse } from "next/server";
import { getCotizacionBlue } from "@/lib/dolarapi";
import { getCotizacionUsdtBob, getCotizacionUsdtArs } from "@/lib/criptoya";
import { calcularTipoCambioCliente, MARGEN_DEFAULT, type TasasMercado } from "@/lib/pricing";
import { registrarSnapshot } from "@/lib/historial-tasas";

// GET /api/tasas — todo el tablero de un solo pedido, para la pizarra
// pública y el kit de marketing (necesita también el precio de USDT).
export async function GET() {
  try {
    const [blue, usdtBob, usdtArs] = await Promise.all([
      getCotizacionBlue(),
      getCotizacionUsdtBob(),
      getCotizacionUsdtArs(),
    ]);

    const tasas: TasasMercado = {
      ARS: blue.venta,
      BOB: usdtBob.ask,
      ARS_USDT: usdtArs.ask,
      fechaArs: blue.fechaActualizacion,
      fechaBob: usdtBob.time,
      fechaArsUsdt: usdtArs.time,
    };

    const margenPct = MARGEN_DEFAULT;

    const arsABob1000 = calcularTipoCambioCliente("ARS", "BOB", tasas, margenPct) * 1000;
    const bobAArs1000 = calcularTipoCambioCliente("BOB", "ARS", tasas, margenPct) * 1000;
    const usdtAArs = calcularTipoCambioCliente("USDT", "ARS", tasas, margenPct);
    const usdtABob = calcularTipoCambioCliente("USDT", "BOB", tasas, margenPct);

    // Guardamos la foto de esta hora para el gráfico histórico. Si esto
    // falla (ej. reglas de Firestore mal configuradas), no queremos que
    // rompa la respuesta del tablero público — solo lo logueamos.
    registrarSnapshot({
      usdArs: blue.venta,
      usdBob: usdtBob.ask,
      margenPct,
      arsABob1000,
      bobAArs1000,
    }).catch((err) => console.error("No se pudo guardar el snapshot:", err));

    return NextResponse.json({
      actualizado: new Date().toISOString(),
      margenPct,
      usdArs: { compra: blue.compra, venta: blue.venta },
      usdBob: { compra: usdtBob.bid, venta: usdtBob.ask },
      arsABob1000,
      bobAArs1000,
      usdtAArs,
      usdtABob,
    });
  } catch (err) {
    console.error("Error armando el tablero de tasas:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 502 });
  }
}
