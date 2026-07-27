"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { listarHistorial, type SnapshotTasa } from "@/lib/historial-tasas";

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
  });
}

export default function GraficoEvolucion() {
  const [datos, setDatos] = useState<SnapshotTasa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarHistorial()
      .then(setDatos)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar")
      )
      .finally(() => setCargando(false));
  }, []);

  const datosGrafico = datos.map((d) => ({
    hora: formatearHora(d.fechaHora),
    "Blue ARS/USD": d.usdArs,
    "Paralelo BOB/USD": d.usdBob,
  }));

  const datosPropios = datos.map((d) => ({
    hora: formatearHora(d.fechaHora),
    "Tu tasa ARS→BOB (x1000)": d.arsABob1000,
    "Tu tasa BOB→ARS (x1000)": d.bobAArs1000,
  }));

  if (cargando) {
    return <p className="text-sm text-zinc-500">Cargando histórico…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (datos.length < 2) {
    return (
      <p className="rounded-xl bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
        Todavía no hay suficiente histórico — se va guardando una foto por
        hora a partir de ahora, volvé en un rato.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">
          Dólar de referencia — Argentina y Bolivia
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={datosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="ars" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="bob"
              orientation="right"
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="ars"
              type="monotone"
              dataKey="Blue ARS/USD"
              stroke="#16a34a"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="bob"
              type="monotone"
              dataKey="Paralelo BOB/USD"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">
          Tu tipo de cambio ofrecido (por cada 1.000 unidades)
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={datosPropios}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="Tu tasa ARS→BOB (x1000)"
              stroke="#16a34a"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Tu tasa BOB→ARS (x1000)"
              stroke="#2563eb"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
