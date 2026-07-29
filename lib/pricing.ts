// Lógica de precios, generalizada a cualquier par entre ARS, USD, BOB y USDT.
//
// Modelo: hay dos monedas "hub" (USD y USDT), cada una con su propia tabla
// de cuántos ARS/BOB vale. No son lo mismo: USD usa el blue (mercado en
// efectivo) para el lado ARS; USDT usa el precio real de USDT/ARS en el
// mercado cripto, que puede diferir del blue. Para BOB usamos la misma
// fuente (USDT/BOB de CriptoYa) para las dos, porque no existe una fuente
// de "dólar cash" boliviano distinta y confiable — en la práctica el
// paralelo boliviano YA se arma sobre USDT.
//
// Al cliente le reconocemos el cruce de mercado multiplicado por
// (1 - margen): siempre recibe un poco menos de lo que daría el cruce
// puro, ahí está la ganancia del operador.

export type Moneda = "USD" | "ARS" | "BOB" | "USDT";

export interface TasasMercado {
  ARS: number; // unidades de ARS por 1 USD (blue venta)
  BOB: number; // unidades de BOB por 1 USD/USDT (paralelo, vía USDT ask — misma fuente para las dos)
  ARS_USDT: number; // unidades de ARS por 1 USDT (mercado cripto, vía USDT ask)
  fechaArs: string;
  fechaBob: number; // timestamp unix de CriptoYa
  fechaArsUsdt: number; // timestamp unix de CriptoYa
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

type Hub = "USD" | "USDT";

/** Tabla de cuánto vale 1 unidad del hub (USD o USDT) en ARS y en BOB. */
function tablaHub(hub: Hub, tasas: TasasMercado): { ARS: number; BOB: number } {
  if (hub === "USD") return { ARS: tasas.ARS, BOB: tasas.BOB };
  return { ARS: tasas.ARS_USDT, BOB: tasas.BOB };
}

function esHub(moneda: Moneda): moneda is Hub {
  return moneda === "USD" || moneda === "USDT";
}

/**
 * Tipo de cambio "puro de mercado" (sin margen) entre dos monedas: cuántas
 * unidades de `hacia` equivalen a 1 unidad de `desde`.
 */
export function tasaMercado(
  desde: Moneda,
  hacia: Moneda,
  tasas: TasasMercado
): number {
  if (desde === hacia) return 1;

  // Los dos son "fiat" (ARS/BOB): pivoteamos por USD, que es el corredor
  // real del negocio (no tiene sentido pivotear una remesa ARS->BOB por
  // el precio cripto, ya que ninguna de las dos puntas es cripto).
  if (!esHub(desde) && !esHub(hacia)) {
    const tabla = tablaHub("USD", tasas);
    const usdPorDesde = 1 / tabla[desde as "ARS" | "BOB"];
    return usdPorDesde * tabla[hacia as "ARS" | "BOB"];
  }

  // Un hub (USD o USDT) contra un fiat (ARS/BOB): la tabla del hub
  // correspondiente ya tiene la respuesta directa.
  if (esHub(desde) && !esHub(hacia)) {
    return tablaHub(desde, tasas)[hacia as "ARS" | "BOB"];
  }
  if (!esHub(desde) && esHub(hacia)) {
    return 1 / tablaHub(hacia, tasas)[desde as "ARS" | "BOB"];
  }

  // USD <-> USDT: asumimos paridad 1:1 (USDT es una stablecoin dolarizada).
  // No mezclamos esto en las tablas de ARS/BOB porque el negocio real es
  // fiat<->fiat o fiat<->cripto, no cripto<->cripto.
  return 1;
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
