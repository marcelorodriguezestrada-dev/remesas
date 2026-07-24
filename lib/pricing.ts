// Lógica de precios, generalizada a cualquier par entre ARS, USD y BOB.
//
// Modelo: convertimos siempre pivoteando por USD. Cada moneda tiene un
// "valor de mercado en USD" (1 para USD, el blue venta para ARS, el USDT/BOB
// ask para BOB). El tipo de cambio "de mercado" entre dos monedas cualquiera
// sale de comparar esos dos valores. Al cliente le reconocemos ese cruce
// multiplicado por (1 - margen): siempre recibe un poco menos de lo que
// daría el cruce puro de mercado, ahí está la ganancia del operador.
//
// Es la misma idea que ya usábamos para USD->ARS, generalizada.

export type Moneda = "USD" | "ARS" | "BOB";

export interface TasasMercado {
  ARS: number; // unidades de ARS por 1 USD (blue venta)
  BOB: number; // unidades de BOB por 1 USD (paralelo, vía USDT ask)
  fechaArs: string;
  fechaBob: number; // timestamp unix de CriptoYa
}

export interface Cotizacion {
  desde: Moneda;
  hacia: Moneda;
  tasas: TasasMercado;
  margenPct: number;
  tipoCambioCliente: number; // unidades de `hacia` que recibe el destinatario por 1 unidad de `desde`
}

export const MARGEN_DEFAULT = Number(
  process.env.MARGEN_PORCENTAJE_DEFAULT ?? "0.025"
);

/** Cuántas unidades de `moneda` equivalen a 1 USD, según las tasas de mercado dadas. */
function unidadesPorUsd(moneda: Moneda, tasas: TasasMercado): number {
  if (moneda === "USD") return 1;
  return tasas[moneda];
}

/**
 * Tipo de cambio "puro de mercado" (sin margen) entre dos monedas: cuántas
 * unidades de `hacia` equivalen a 1 unidad de `desde`, pivoteando por USD.
 */
export function tasaMercado(
  desde: Moneda,
  hacia: Moneda,
  tasas: TasasMercado
): number {
  if (desde === hacia) return 1;
  const usdPorDesde = 1 / unidadesPorUsd(desde, tasas);
  const haciaPorUsd = unidadesPorUsd(hacia, tasas);
  return usdPorDesde * haciaPorUsd;
}

/**
 * Tipo de cambio que se le reconoce al cliente: el de mercado, con el
 * margen ya descontado.
 */
export function calcularTipoCambioCliente(
  desde: Moneda,
  hacia: Moneda,
  tasas: TasasMercado,
  margenPct: number = MARGEN_DEFAULT
): number {
  if (margenPct < 0 || margenPct >= 1) {
    throw new Error("margenPct debe estar entre 0 y 1 (ej: 0.025 = 2.5%)");
  }
  if (desde === hacia) {
    throw new Error("'desde' y 'hacia' no pueden ser la misma moneda");
  }
  return tasaMercado(desde, hacia, tasas) * (1 - margenPct);
}

/** Dado un monto en la moneda de origen, cuánto recibe el destinatario. */
export function convertir(monto: number, tipoCambioCliente: number): number {
  return monto * tipoCambioCliente;
}

/** Ganancia de una operación puntual, expresada en la moneda `hacia`. */
export function gananciaOperacion(
  monto: number,
  desde: Moneda,
  hacia: Moneda,
  tasas: TasasMercado,
  tipoCambioCliente: number
): number {
  const tasaPura = tasaMercado(desde, hacia, tasas);
  return monto * (tasaPura - tipoCambioCliente);
}
