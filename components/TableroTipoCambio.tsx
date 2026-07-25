"use client";

import { useEffect, useState } from "react";

interface Tablero {
  actualizado: string;
  margenPct: number;
  usdArs: { compra: number; venta: number };
  usdBob: { compra: number; venta: number };
  arsABob1000: number;
  bobAArs1000: number;
}

function num(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export default function TableroTipoCambio() {
  const [tablero, setTablero] = useState<Tablero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/tasas", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setTablero(data as Tablero);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
    // Se refresca solo cada 5 minutos, igual que la validez que le
    // poníamos antes a los mensajes de WhatsApp a mano.
    const intervalo = setInterval(() => void cargar(), 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  function textoParaWhatsapp(t: Tablero): string {
    const hora = new Date(t.actualizado).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    return (
      `💱 Tipo de cambio — ${hora}\n\n` +
      `Pesos ARS → Bs: ${num(t.arsABob1000, 2)} Bs por cada 1.000 ARS\n` +
      `Bolivianos → ARS: ${num(t.bobAArs1000, 2)} ARS por cada 1.000 Bs\n\n` +
      `Válido por 5 minutos o hasta nueva actualización.`
    );
  }

  async function copiar() {
    if (!tablero) return;
    await navigator.clipboard.writeText(textoParaWhatsapp(tablero));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">
          Tipo de cambio
        </h2>
        <button
          type="button"
          onClick={() => void cargar()}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Actualizar
        </button>
      </div>

      {tablero && !cargando && (
        <p className="mb-5 text-xs text-zinc-400">
          Actualizado{" "}
          {new Date(tablero.actualizado).toLocaleString("es-AR")} · válido
          por 5 minutos o hasta nueva actualización
        </p>
      )}

      {cargando && (
        <p className="mb-4 text-sm text-zinc-500">Consultando tasas…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {tablero && (
        <div className="space-y-3">
          <div className="rounded-xl bg-green-50 px-5 py-4">
            <p className="mb-1 text-sm text-green-700">
              Pesos argentinos → Bolivianos
            </p>
            <p className="text-2xl font-bold text-green-600">
              {num(tablero.arsABob1000)} Bs{" "}
              <span className="text-base font-normal text-green-700/70">
                por cada 1.000 ARS
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 px-5 py-4">
            <p className="mb-1 text-sm text-blue-700">
              Bolivianos → Pesos argentinos
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {num(tablero.bobAArs1000)} ARS{" "}
              <span className="text-base font-normal text-blue-700/70">
                por cada 1.000 Bs
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">Blue USD/ARS</p>
              <p className="text-sm font-semibold text-zinc-800">
                {num(tablero.usdArs.compra)} / {num(tablero.usdArs.venta)}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">Paralelo USD/BOB</p>
              <p className="text-sm font-semibold text-zinc-800">
                {num(tablero.usdBob.compra)} / {num(tablero.usdBob.venta)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void copiar()}
            className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {copiado ? "¡Copiado!" : "Copiar para WhatsApp"}
          </button>
        </div>
      )}
    </div>
  );
}
