"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Destino = "BOL" | "PER" | "CHL";

export interface DatosCotizacion {
  monto_ars: number;
  destino: Destino;
  monto_receptor: number;
  comision: number;
  tipo_cambio: number;
}

interface Precio {
  destino: Destino;
  tipo_cambio: number;
}

interface CotizadorProps {
  onCotizar: (datos: DatosCotizacion) => void;
}

const COMISION_TASA = 0.025;

const DESTINOS: { value: Destino; label: string; moneda: string }[] = [
  { value: "BOL", label: "Bolivia", moneda: "BOB" },
  { value: "PER", label: "Perú", moneda: "PEN" },
  { value: "CHL", label: "Chile", moneda: "CLP" },
];

function formatearMoneda(valor: number, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function Cotizador({ onCotizar }: CotizadorProps) {
  const [montoArs, setMontoArs] = useState("");
  const [destino, setDestino] = useState<Destino>("BOL");
  const [precios, setPrecios] = useState<Precio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPrecios() {
      setCargando(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("precios")
        .select("destino, tipo_cambio");

      if (supabaseError) {
        setError("No se pudieron cargar los precios. Intentá de nuevo.");
        setCargando(false);
        return;
      }

      setPrecios((data as Precio[]) ?? []);
      setCargando(false);
    }

    void cargarPrecios();
  }, []);

  const destinoInfo = DESTINOS.find((d) => d.value === destino)!;

  const { montoReceptor, comision, tipoCambio } = useMemo(() => {
    const monto = parseFloat(montoArs) || 0;
    const precio = precios.find((p) => p.destino === destino);
    const tc = precio?.tipo_cambio ?? 0;
    const com = monto * COMISION_TASA;
    const neto = monto - com;
    const receptor = neto * tc;

    return {
      montoReceptor: receptor,
      comision: com,
      tipoCambio: tc,
    };
  }, [montoArs, destino, precios]);

  const montoNumerico = parseFloat(montoArs) || 0;
  const puedeEnviar =
    !cargando && !error && montoNumerico > 0 && tipoCambio > 0;

  function handleCotizar() {
    if (!puedeEnviar) return;

    onCotizar({
      monto_ars: montoNumerico,
      destino,
      monto_receptor: montoReceptor,
      comision,
      tipo_cambio: tipoCambio,
    });
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">Cotizador</h2>

      {cargando && (
        <p className="mb-4 text-sm text-zinc-500">Cargando precios…</p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label
            htmlFor="monto_ars"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Monto en ARS
          </label>
          <input
            id="monto_ars"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={montoArs}
            onChange={(e) => setMontoArs(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-4 text-2xl font-medium text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="destino"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Destino
          </label>
          <select
            id="destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value as Destino)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-4 text-lg font-medium text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            {DESTINOS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} ({d.value})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl bg-green-50 px-5 py-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-green-700">Recibe el destinatario</span>
            <span className="text-3xl font-bold text-green-600">
              {formatearMoneda(montoReceptor, destinoInfo.moneda)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-green-700/80">
            <span>Comisión (2.5%)</span>
            <span>{formatearMoneda(comision, "ARS")}</span>
          </div>
          <div className="flex justify-between text-sm text-green-700/80">
            <span>Tipo de cambio</span>
            <span>
              1 ARS = {tipoCambio.toLocaleString("es-AR", { maximumFractionDigits: 6 })}{" "}
              {destinoInfo.moneda}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCotizar}
          disabled={!puedeEnviar}
          className="w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Quiero enviar
        </button>
      </div>
    </div>
  );
}
