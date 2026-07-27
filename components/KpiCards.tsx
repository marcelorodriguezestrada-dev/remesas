"use client";

import type { Kpi } from "@/lib/kpis";

function formatearNumero(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function TarjetaKpi({ kpi }: { kpi: Kpi }) {
  const sube = kpi.variacionPct !== null && kpi.variacionPct > 0;
  const baja = kpi.variacionPct !== null && kpi.variacionPct < 0;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-1 text-xs text-zinc-500">{kpi.etiqueta}</p>
      <p className="text-xl font-bold text-zinc-900">
        {formatearNumero(kpi.valorActual)}
      </p>
      {kpi.variacionPct !== null ? (
        <p
          className={`mt-1 text-xs font-medium ${
            sube ? "text-green-600" : baja ? "text-red-600" : "text-zinc-400"
          }`}
        >
          {sube ? "▲" : baja ? "▼" : "—"} {Math.abs(kpi.variacionPct).toFixed(2)}%
          vs. ayer
        </p>
      ) : (
        <p className="mt-1 text-xs text-zinc-400">Sin dato de hace 24hs aún</p>
      )}
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpi[] }) {
  if (kpis.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <TarjetaKpi key={kpi.etiqueta} kpi={kpi} />
      ))}
    </div>
  );
}
