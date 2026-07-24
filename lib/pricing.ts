// Lógica de precios del corredor USD -> ARS.
//
// Modelo: tomamos el dólar blue de venta como referencia de mercado, y le
// reconocemos al cliente un tipo de cambio levemente por debajo (el margen).
// Ese margen es la ganancia del operador. No hay "comisión" separada visible
// para el cliente: está incorporada en el tipo de cambio, igual que en las
// cuevas y en buena parte del mercado informal.
//
// Referencia calibrada (23/07): blue venta ~$1.560, margen recomendado 2%–3.5%
// para quedar bien por debajo de Western Union (5%–14% total) y ser competitivo
// sin regalar el margen frente al riesgo de contraparte.

export interface Cotizacion {
  ventaBlue: number;
  margenPct: number; // ej: 0.025 = 2.5%
  tipoCambioCliente: number; // lo que efectivamente le reconocés al cliente
  fechaActualizacion: string;
}

// Margen por defecto. Ajustable por variable de entorno para poder calibrarlo
// sin tocar código (útil mientras estás probando distintos niveles).
export const MARGEN_DEFAULT = Number(
  process.env.MARGEN_PORCENTAJE_DEFAULT ?? "0.025"
);

/**
 * Calcula el tipo de cambio que se le reconoce al cliente a partir del blue
 * de venta y el margen configurado.
 */
export function calcularTipoCambioCliente(
  ventaBlue: number,
  margenPct: number = MARGEN_DEFAULT
): number {
  if (ventaBlue <= 0) {
    throw new Error("ventaBlue debe ser mayor a 0");
  }
  if (margenPct < 0 || margenPct >= 1) {
    throw new Error("margenPct debe estar entre 0 y 1 (ej: 0.025 = 2.5%)");
  }

  return ventaBlue * (1 - margenPct);
}

/**
 * Dado un monto en USD que el cliente deposita, cuánto recibe el
 * destinatario en ARS.
 */
export function usdAArs(montoUsd: number, tipoCambioCliente: number): number {
  return montoUsd * tipoCambioCliente;
}

/**
 * Dado un monto en ARS que el destinatario necesita recibir, cuántos USD
 * tiene que depositar el cliente.
 */
export function arsAUsd(montoArs: number, tipoCambioCliente: number): number {
  return montoArs / tipoCambioCliente;
}

/**
 * Ganancia en ARS de una operación puntual: la diferencia entre lo que
 * hubieras obtenido vendiendo al blue de mercado y lo que le reconociste
 * al cliente.
 */
export function gananciaOperacion(
  montoUsd: number,
  ventaBlue: number,
  tipoCambioCliente: number
): number {
  return montoUsd * (ventaBlue - tipoCambioCliente);
}
