"use client";

import { useEffect, useState } from "react";
import {
  registrarObservacion,
  listarObservacionesRecientes,
  type ObservacionCompetencia,
} from "@/lib/competencia";
import type { Moneda, Cotizacion } from "@/lib/pricing";

const MONEDAS: Moneda[] = ["USD", "ARS", "BOB"];

export default function PanelCompetencia() {
  const [observaciones, setObservaciones] = useState<ObservacionCompetencia[]>(
    []
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [competidor, setCompetidor] = useState("");
  const [monedaOrigen, setMonedaOrigen] = useState<Moneda>("USD");
  const [monedaDestino, setMonedaDestino] = useState<Moneda>("ARS");
  const [tasaObservada, setTasaObservada] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cache de nuestra propia cotización por par, para no repetir el fetch
  // en cada fila de la tabla.
  const [propiaCotizacion, setPropiaCotizacion] = useState<
    Record<string, Cotizacion | null>
  >({});

  async function cargarObservaciones() {
    setCargando(true);
    setError(null);
    try {
      const datos = await listarObservacionesRecientes();
      setObservaciones(datos);

      // Traemos nuestra cotización actual para cada par distinto que
      // aparece en las observaciones cargadas.
      const paresUnicos = new Set(
        datos.map((o) => `${o.moneda_origen}-${o.moneda_destino}`)
      );
      const entradas = await Promise.all(
        Array.from(paresUnicos).map(async (par) => {
          const [desde, hacia] = par.split("-");
          try {
            const res = await fetch(
              `/api/cotizacion?desde=${desde}&hacia=${hacia}`,
              { cache: "no-store" }
            );
            const data = await res.json();
            return [par, res.ok ? (data as Cotizacion) : null] as const;
          } catch {
            return [par, null] as const;
          }
        })
      );
      setPropiaCotizacion(Object.fromEntries(entradas));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarObservaciones();
  }, []);

  async function handleGuardar() {
    const tasa = parseFloat(tasaObservada);
    if (!competidor.trim() || !tasa || monedaOrigen === monedaDestino) return;

    setGuardando(true);
    try {
      await registrarObservacion({
        competidor: competidor.trim(),
        moneda_origen: monedaOrigen,
        moneda_destino: monedaDestino,
        tasa_observada: tasa,
        notas: notas.trim() || undefined,
      });
      setCompetidor("");
      setTasaObservada("");
      setNotas("");
      await cargarObservaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="w-full max-w-2xl px-4 pb-16 pt-6">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">
        Precios de la competencia
      </h2>

      {/* Formulario para cargar una observación nueva */}
      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <p className="mb-4 text-sm font-medium text-zinc-700">
          Cargar precio observado
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Competidor (ej: JH Safe)"
            value={competidor}
            onChange={(e) => setCompetidor(e.target.value)}
            className="col-span-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
          <select
            value={monedaOrigen}
            onChange={(e) => setMonedaOrigen(e.target.value as Moneda)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={monedaDestino}
            onChange={(e) => setMonedaDestino(e.target.value as Moneda)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder={`Tasa (${monedaDestino} por 1 ${monedaOrigen})`}
            value={tasaObservada}
            onChange={(e) => setTasaObservada(e.target.value)}
            className="col-span-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
          <input
            type="text"
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="col-span-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleGuardar()}
          disabled={guardando || monedaOrigen === monedaDestino}
          className="mt-3 w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {guardando ? "Guardando…" : "Guardar observación"}
        </button>
        {monedaOrigen === monedaDestino && (
          <p className="mt-2 text-xs text-red-600">
            El origen y el destino no pueden ser la misma moneda.
          </p>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {cargando && (
        <p className="text-sm text-zinc-500">Cargando observaciones…</p>
      )}

      {!cargando && observaciones.length === 0 && (
        <p className="rounded-xl bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
          Todavía no cargaste precios de competencia.
        </p>
      )}

      <div className="space-y-3">
        {observaciones.map((obs) => {
          const par = `${obs.moneda_origen}-${obs.moneda_destino}`;
          const propia = propiaCotizacion[par];
          const diferenciaPct = propia
            ? ((propia.tipoCambioCliente - obs.tasa_observada) /
                obs.tasa_observada) *
              100
            : null;

          return (
            <div
              key={obs.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {obs.competidor}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {obs.moneda_origen} → {obs.moneda_destino} ·{" "}
                    {new Date(obs.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">Ellos ofrecen</p>
                  <p className="font-semibold text-zinc-800">
                    {obs.tasa_observada}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">Vos ofrecés</p>
                  <p className="font-semibold text-zinc-800">
                    {propia ? propia.tipoCambioCliente.toFixed(4) : "—"}
                  </p>
                </div>
              </div>

              {diferenciaPct !== null && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    diferenciaPct >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {diferenciaPct >= 0
                    ? `Sos ${diferenciaPct.toFixed(1)}% más competitivo`
                    : `Estás ${Math.abs(diferenciaPct).toFixed(1)}% por debajo de ellos`}
                </p>
              )}

              {obs.notas && (
                <p className="mt-2 text-xs text-zinc-500">{obs.notas}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
