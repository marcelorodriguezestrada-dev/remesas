import type { SnapshotTasa } from "@/lib/historial-tasas";

export interface Kpi {
  etiqueta: string;
  valorActual: number;
  valorHace24h: number | null;
  variacionPct: number | null;
}

const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

/** Busca, dentro del historial, el snapshot más cercano a "hace 24hs desde el más reciente". */
function snapshotHace24h(historial: SnapshotTasa[]): SnapshotTasa | null {
  if (historial.length === 0) return null;
  const masReciente = historial[historial.length - 1];
  const objetivo =
    new Date(masReciente.fechaHora).getTime() - VEINTICUATRO_HORAS_MS;

  // Si el snapshot más viejo que tenemos es más nuevo que el objetivo,
  // todavía no pasaron 24hs de histórico — no hay con qué comparar.
  const masViejo = historial[0];
  if (new Date(masViejo.fechaHora).getTime() > objetivo) return null;

  return historial.reduce((mejor, actual) => {
    const dMejor = Math.abs(new Date(mejor.fechaHora).getTime() - objetivo);
    const dActual = Math.abs(new Date(actual.fechaHora).getTime() - objetivo);
    return dActual < dMejor ? actual : mejor;
  }, historial[0]);
}

function armarKpi(
  etiqueta: string,
  historial: SnapshotTasa[],
  campo: keyof SnapshotTasa
): Kpi {
  const actual = historial[historial.length - 1];
  const hace24h = snapshotHace24h(historial);

  const valorActual = actual[campo] as number;
  const valorHace24h = hace24h ? (hace24h[campo] as number) : null;
  const variacionPct =
    valorHace24h && valorHace24h !== 0
      ? ((valorActual - valorHace24h) / valorHace24h) * 100
      : null;

  return { etiqueta, valorActual, valorHace24h, variacionPct };
}

export function calcularKpis(historial: SnapshotTasa[]): Kpi[] {
  if (historial.length === 0) return [];

  return [
    armarKpi("Blue ARS/USD", historial, "usdArs"),
    armarKpi("Paralelo BOB/USD", historial, "usdBob"),
    armarKpi("Tu tasa ARS→BOB (x1000)", historial, "arsABob1000"),
    armarKpi("Tu tasa BOB→ARS (x1000)", historial, "bobAArs1000"),
  ];
}
