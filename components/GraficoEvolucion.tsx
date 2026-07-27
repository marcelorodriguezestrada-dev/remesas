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
  ReferenceDot,
} from "recharts";
import { listarHistorial, type SnapshotTasa } from "@/lib/historial-tasas";
import {
  listarObservacionesRecientes,
  type ObservacionCompetencia,
} from "@/lib/competencia";

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
  });
}

/** Busca, para una fecha dada, el snapshot más cercano en el tiempo — así
 * podemos ubicar la observación de competencia en el eje X categórico
 * del gráfico (que usa las mismas horas que el histórico propio). */
function snapshotMasCercano(
  fecha: string,
  historial: SnapshotTasa[]
): SnapshotTasa | null {
  if (historial.length === 0) return null;
  const objetivo = new Date(fecha).getTime();
  return historial.reduce((mejor, actual) => {
    const dMejor = Math.abs(new Date(mejor.fechaHora).getTime() - objetivo);
    const dActual = Math.abs(new Date(actual.fechaHora).getTime() - objetivo);
    return dActual < dMejor ? actual : mejor;
  }, historial[0]);
}

export default function GraficoEvolucion() {
  const [datos, setDatos] = useState<SnapshotTasa[]>([]);
  const [observaciones, setObservaciones] = useState<ObservacionCompetencia[]>(
    []
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarHistorial(), listarObservacionesRecientes(50)])
      .then(([historial, obs]) => {
        setDatos(historial);
        setObservaciones(obs);
      })
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

  // Solo nos sirven las observaciones del par ARS↔BOB, que es lo que
  // muestra este gráfico. Las convertimos a "por 1.000" para que queden
  // en la misma escala que nuestras propias líneas.
  const marcasCompetencia = observaciones
    .filter(
      (o) =>
        (o.moneda_origen === "ARS" && o.moneda_destino === "BOB") ||
        (o.moneda_origen === "BOB" && o.moneda_destino === "ARS")
    )
    .map((o) => {
      const cercano = snapshotMasCercano(o.created_at, datos);
      if (!cercano) return null;
      return {
        hora: formatearHora(cercano.fechaHora),
        valor: o.tasa_observada * 1000,
        esArsABob: o.moneda_origen === "ARS",
        competidor: o.competidor,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

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
            {marcasCompetencia.map((m, i) => (
              <ReferenceDot
                key={i}
                x={m.hora}
                y={m.valor}
                r={5}
                fill={m.esArsABob ? "#16a34a" : "#2563eb"}
                stroke="#fff"
                strokeWidth={1.5}
                label={{
                  value: m.competidor,
                  position: "top",
                  fontSize: 10,
                  fill: "#71717a",
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {marcasCompetencia.length > 0 && (
        <p className="text-xs text-zinc-400">
          Los puntos marcados en el gráfico de arriba son precios de
          competencia que cargaste — comparalos contra tu línea del mismo
          color en ese momento.
        </p>
      )}
    </div>
  );
}