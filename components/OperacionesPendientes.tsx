"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listarOperacionesPendientes,
  listarOperacionesPagadas,
  actualizarEstado,
  type Operacion,
  type EstadoOperacion,
} from "@/lib/operaciones";
import { resumenGanancias, type ResumenGanancias } from "@/lib/ganancias";

function formatearMonto(valor: number, moneda: string): string {
  const numero = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
  return `${numero} ${moneda}`;
}

const ETIQUETA_ESTADO: Record<EstadoOperacion, string> = {
  pending: "Esperando depósito",
  origen_recibido: "Depósito recibido",
  pagado: "Pagado",
  cancelado: "Cancelado",
};

const COLOR_ESTADO: Record<EstadoOperacion, string> = {
  pending: "bg-amber-50 text-amber-700",
  origen_recibido: "bg-blue-50 text-blue-700",
  pagado: "bg-green-50 text-green-700",
  cancelado: "bg-zinc-100 text-zinc-500",
};

const SIGUIENTE_ESTADO: Partial<
  Record<EstadoOperacion, { estado: EstadoOperacion; etiqueta: string }>
> = {
  pending: { estado: "origen_recibido", etiqueta: "Marcar depósito recibido" },
  origen_recibido: { estado: "pagado", etiqueta: "Marcar pagado" },
};

export default function OperacionesPendientes() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [ganancias, setGanancias] = useState<ResumenGanancias | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [pendientes, pagadas] = await Promise.all([
        listarOperacionesPendientes(),
        listarOperacionesPagadas(),
      ]);
      setOperaciones(pendientes);
      setGanancias(resumenGanancias(pagadas));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function cambiarEstado(id: string, estado: EstadoOperacion) {
    setActualizandoId(id);
    try {
      await actualizarEstado(id, estado);
      // Cambios de estado hacia pagado/cancelado también mueven la
      // ganancia acumulada, así que recargamos todo en vez de solo
      // parchear la lista local.
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="w-full max-w-2xl px-4 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">
          Operaciones pendientes
        </h2>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/competencia"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
          >
            Competencia
          </Link>
          <button
            type="button"
            onClick={() => void cargar()}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen de ganancia real, sobre operaciones ya pagadas */}
      {ganancias && ganancias.cantidadOperaciones > 0 && (
        <div className="mb-6 rounded-2xl bg-zinc-900 p-5 text-white">
          <p className="mb-2 text-xs text-zinc-400">
            Ganancia acumulada · {ganancias.cantidadOperaciones} operaciones
            pagadas
          </p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(ganancias.porMoneda).map(([moneda, monto]) => (
              <p key={moneda} className="text-2xl font-bold">
                {formatearMonto(monto as number, moneda)}
              </p>
            ))}
          </div>
        </div>
      )}

      {cargando && (
        <p className="text-sm text-zinc-500">Cargando operaciones…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!cargando && !error && operaciones.length === 0 && (
        <p className="rounded-xl bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
          No hay operaciones pendientes por ahora.
        </p>
      )}

      <div className="space-y-3">
        {operaciones.map((op) => {
          const siguiente = SIGUIENTE_ESTADO[op.estado];
          return (
            <div
              key={op.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {op.cliente_nombre} → {op.destinatario_nombre}
                  </p>
                  {op.destinatario_cuenta && (
                    <p className="text-sm text-zinc-500">
                      {op.destinatario_cuenta}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTADO[op.estado]}`}
                >
                  {ETIQUETA_ESTADO[op.estado]}
                </span>
              </div>

              <div className="mb-4 flex justify-between text-sm text-zinc-600">
                <span>
                  Deposita {formatearMonto(op.monto_origen, op.moneda_origen)}{" "}
                  → paga{" "}
                  {formatearMonto(op.monto_destino, op.moneda_destino)}
                </span>
                <span>{new Date(op.created_at).toLocaleString("es-AR")}</span>
              </div>

              <div className="flex gap-2">
                {siguiente && (
                  <button
                    type="button"
                    onClick={() => void cambiarEstado(op.id, siguiente.estado)}
                    disabled={actualizandoId === op.id}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {actualizandoId === op.id
                      ? "Actualizando…"
                      : siguiente.etiqueta}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void cambiarEstado(op.id, "cancelado")}
                  disabled={actualizandoId === op.id}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
