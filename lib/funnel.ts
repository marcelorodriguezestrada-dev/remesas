import type { Visita } from "@/lib/visitas";
import type { Operacion } from "@/lib/operaciones";

const SIN_ORIGEN = "(directo / sin UTM)";

export interface FilaFunnel {
  fuente: string;
  visitas: number;
  operaciones: number;
  pagadas: number;
  conversionVisitaOperacion: number | null; // %
  conversionOperacionPago: number | null; // %
}

export interface ResumenFunnel {
  total: FilaFunnel;
  porFuente: FilaFunnel[];
}

function calcularFila(
  fuente: string,
  visitas: number,
  operaciones: number,
  pagadas: number
): FilaFunnel {
  return {
    fuente,
    visitas,
    operaciones,
    pagadas,
    conversionVisitaOperacion:
      visitas > 0 ? (operaciones / visitas) * 100 : null,
    conversionOperacionPago:
      operaciones > 0 ? (pagadas / operaciones) * 100 : null,
  };
}

export function calcularFunnel(
  visitas: Visita[],
  operaciones: Operacion[]
): ResumenFunnel {
  const fuentes = new Set<string>();
  visitas.forEach((v) => fuentes.add(v.utm_source ?? SIN_ORIGEN));
  operaciones.forEach((o) => fuentes.add(o.utm_source ?? SIN_ORIGEN));

  const porFuente = Array.from(fuentes)
    .map((fuente) => {
      const visitasFuente = visitas.filter(
        (v) => (v.utm_source ?? SIN_ORIGEN) === fuente
      ).length;
      const operacionesFuente = operaciones.filter(
        (o) => (o.utm_source ?? SIN_ORIGEN) === fuente
      );
      const pagadasFuente = operacionesFuente.filter(
        (o) => o.estado === "pagado"
      ).length;

      return calcularFila(
        fuente,
        visitasFuente,
        operacionesFuente.length,
        pagadasFuente
      );
    })
    .sort((a, b) => b.visitas - a.visitas);

  const total = calcularFila(
    "Total",
    visitas.length,
    operaciones.length,
    operaciones.filter((o) => o.estado === "pagado").length
  );

  return { total, porFuente };
}
