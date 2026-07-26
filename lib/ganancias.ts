import type { Operacion } from "@/lib/operaciones";
import type { Moneda } from "@/lib/pricing";

/**
 * Ganancia de una operación puntual, expresada en la moneda destino.
 *
 * No hace falta guardar la tasa de mercado "pura" en cada operación para
 * esto: como monto_destino = monto_origen * tasaMercado * (1 - margen),
 * despejando queda que la ganancia (monto_origen * tasaMercado * margen)
 * es exactamente monto_destino * margen / (1 - margen).
 */
export function gananciaDeOperacion(op: Operacion): number {
  const { monto_destino, margen_pct } = op;
  if (margen_pct <= 0 || margen_pct >= 1) return 0;
  return monto_destino * (margen_pct / (1 - margen_pct));
}

export interface ResumenGanancias {
  porMoneda: Partial<Record<Moneda, number>>;
  cantidadOperaciones: number;
}

/** Suma la ganancia de una lista de operaciones, agrupada por moneda destino. */
export function resumenGanancias(operaciones: Operacion[]): ResumenGanancias {
  const porMoneda: Partial<Record<Moneda, number>> = {};

  for (const op of operaciones) {
    const ganancia = gananciaDeOperacion(op);
    porMoneda[op.moneda_destino] = (porMoneda[op.moneda_destino] ?? 0) + ganancia;
  }

  return { porMoneda, cantidadOperaciones: operaciones.length };
}
