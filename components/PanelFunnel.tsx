"use client";

import { useEffect, useState } from "react";
import { listarVisitas } from "@/lib/visitas";
import { listarTodasLasOperaciones } from "@/lib/operaciones";
import { calcularFunnel, type ResumenFunnel } from "@/lib/funnel";

function pct(valor: number | null): string {
  return valor === null ? "—" : `${valor.toFixed(1)}%`;
}

export default function PanelFunnel() {
  const [resumen, setResumen] = useState<ResumenFunnel | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarVisitas(), listarTodasLasOperaciones()])
      .then(([visitas, operaciones]) =>
        setResumen(calcularFunnel(visitas, operaciones))
      )
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar")
      )
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-sm text-zinc-500">Cargando funnel…</p>;
  if (error || !resumen)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error ?? "No se pudo cargar"}
      </p>
    );

  return (
    <div className="w-full max-w-2xl px-4 pb-16 pt-6">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">
        Funnel de conversión
      </h2>

      {/* Números totales, grandes */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="text-2xl font-bold text-zinc-900">
            {resumen.total.visitas}
          </p>
          <p className="text-xs text-zinc-500">Visitas</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="text-2xl font-bold text-zinc-900">
            {resumen.total.operaciones}
          </p>
          <p className="text-xs text-zinc-500">
            Cotizaron ({pct(resumen.total.conversionVisitaOperacion)})
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="text-2xl font-bold text-green-600">
            {resumen.total.pagadas}
          </p>
          <p className="text-xs text-zinc-500">
            Pagaron ({pct(resumen.total.conversionOperacionPago)})
          </p>
        </div>
      </div>

      {/* Desglose por fuente UTM */}
      <p className="mb-3 text-sm font-medium text-zinc-700">Por canal (UTM)</p>
      <div className="space-y-2">
        {resumen.porFuente.map((fila) => (
          <div
            key={fila.fuente}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100"
          >
            <p className="mb-2 font-semibold text-zinc-900">{fila.fuente}</p>
            <div className="grid grid-cols-3 gap-2 text-sm text-zinc-600">
              <span>{fila.visitas} visitas</span>
              <span>
                {fila.operaciones} cotiz. ({pct(fila.conversionVisitaOperacion)})
              </span>
              <span>
                {fila.pagadas} pagas ({pct(fila.conversionOperacionPago)})
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Para que un canal aparezca acá con su nombre (no "directo / sin
        UTM"), compartí el link con parámetros, ej:{" "}
        <code className="rounded bg-zinc-100 px-1">
          ?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento
        </code>
      </p>
    </div>
  );
}
