import { getDesgloseUsdt, type CotizacionExchange } from "@/lib/criptoya";

export interface RutaOportunidad {
  exchangeCompra: string; // dónde conviene COMPRAR USDT (ask más bajo)
  precioCompra: number;
  exchangeVenta: string; // dónde conviene VENDER ese USDT (bid más alto)
  precioVenta: number;
  tasaResultante: number; // unidades de la moneda destino por 1 unidad de la moneda origen, operando por esta ruta
  tasaPromedio: number; // la misma cuenta pero con el promedio general (lo que ya se usa hoy)
  mejoraPct: number; // cuánto mejor es la ruta puntual vs. el promedio, en %
}

export interface Oportunidad {
  actualizado: string;
  arsHaciaBob: RutaOportunidad;
  bobHaciaArs: RutaOportunidad;
  desgloseArs: CotizacionExchange[];
  desgloseBob: CotizacionExchange[];
}

function mejorCompra(exchanges: CotizacionExchange[]) {
  return exchanges.reduce((mejor, e) => (e.ask < mejor.ask ? e : mejor));
}

function mejorVenta(exchanges: CotizacionExchange[]) {
  return exchanges.reduce((mejor, e) => (e.bid > mejor.bid ? e : mejor));
}

function promedio(exchanges: CotizacionExchange[], campo: "ask" | "bid") {
  return exchanges.reduce((suma, e) => suma + e[campo], 0) / exchanges.length;
}

/**
 * Arma la mejor ruta operativa: en qué exchange conviene COMPRAR USDT con
 * la moneda de origen, y en cuál conviene VENDERLO por la moneda de
 * destino — no necesariamente el mismo exchange de los dos lados.
 *
 * Ej: ARS → BOB significa comprar USDT pagando ARS (querés el ask de ARS
 * más BAJO) y después vender ese USDT por BOB (querés el bid de BOB más
 * ALTO). Son dos mercados independientes, así que la ruta óptima casi
 * nunca es "todo en el mismo exchange".
 */
function armarRuta(
  exchangesOrigen: CotizacionExchange[],
  exchangesDestino: CotizacionExchange[]
): RutaOportunidad {
  const compra = mejorCompra(exchangesOrigen); // más barato para comprar USDT con la moneda de origen
  const venta = mejorVenta(exchangesDestino); // más caro para vender ese USDT por la moneda de destino

  // 1 unidad de origen -> cuántos USDT compro -> cuánto destino obtengo
  const tasaResultante = (1 / compra.ask) * venta.bid;

  const askPromedioOrigen = promedio(exchangesOrigen, "ask");
  const bidPromedioDestino = promedio(exchangesDestino, "bid");
  const tasaPromedio = (1 / askPromedioOrigen) * bidPromedioDestino;

  const mejoraPct = ((tasaResultante - tasaPromedio) / tasaPromedio) * 100;

  return {
    exchangeCompra: compra.exchange,
    precioCompra: compra.ask,
    exchangeVenta: venta.exchange,
    precioVenta: venta.bid,
    tasaResultante,
    tasaPromedio,
    mejoraPct,
  };
}

export async function obtenerOportunidad(): Promise<Oportunidad> {
  const [desgloseArs, desgloseBob] = await Promise.all([
    getDesgloseUsdt("ARS"),
    getDesgloseUsdt("BOB"),
  ]);

  return {
    actualizado: new Date().toISOString(),
    arsHaciaBob: armarRuta(desgloseArs, desgloseBob),
    bobHaciaArs: armarRuta(desgloseBob, desgloseArs),
    desgloseArs: desgloseArs.sort((a, b) => a.ask - b.ask),
    desgloseBob: desgloseBob.sort((a, b) => a.ask - b.ask),
  };
}
