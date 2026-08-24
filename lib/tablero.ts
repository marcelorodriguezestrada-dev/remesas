import { getCotizacionBlue } from "@/lib/dolarapi";
import { getCotizacionUsdtBob, getCotizacionUsdtArs } from "@/lib/criptoya";
import { calcularTipoCambioCliente, MARGEN_DEFAULT, type TasasMercado } from "@/lib/pricing";
import { registrarSnapshot } from "@/lib/historial-tasas";

export interface Tablero {
  actualizado: string;
  margenPct: number;
  usdArs: { compra: number; venta: number };
  usdBob: { compra: number; venta: number };
  arsABob1000: number;
  bobAArs1000: number;
  usdtAArs: number;
  usdtABob: number;
}

/**
 * Un solo lugar para calcular el tablero de tasas. Antes esta cuenta vivía
 * únicamente adentro de /api/tasas — si mañana otro endpoint (como el de
 * publicación automática en Facebook) necesitaba los mismos números, la
 * salida obvia era copiar y pegar el cálculo, y con eso el riesgo de que
 * un cambio de margen o de fuente quede aplicado en un lado y no en el otro.
 */
export async function obtenerTablero(): Promise<Tablero> {
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

  // Guardamos la foto de esta hora para el gráfico histórico. Si esto falla
  // (ej. reglas de Firestore mal configuradas), no queremos que rompa la
  // respuesta del tablero — solo lo logueamos.
  registrarSnapshot({
    usdArs: blue.venta,
    usdBob: usdtBob.ask,
    margenPct,
    arsABob1000,
    bobAArs1000,
  }).catch((err) => console.error("No se pudo guardar el snapshot:", err));

  return {
    actualizado: new Date().toISOString(),
    margenPct,
    usdArs: { compra: blue.compra, venta: blue.venta },
    usdBob: { compra: usdtBob.bid, venta: usdtBob.ask },
    arsABob1000,
    bobAArs1000,
    usdtAArs,
    usdtABob,
  };
}
