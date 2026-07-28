"use client";

import { useEffect, useState } from "react";
import {
  generarPlantillas,
  type PlantillaMarketing,
} from "@/lib/plantillas-marketing";

interface Tablero {
  arsABob1000: number;
  bobAArs1000: number;
}

const GRUPO_WHATSAPP =
  process.env.NEXT_PUBLIC_GRUPO_WHATSAPP ?? "(falta configurar el link del grupo)";

function TarjetaPlantilla({ plantilla }: { plantilla: PlantillaMarketing }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(plantilla.texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <p className="font-semibold text-zinc-900">{plantilla.etiqueta}</p>
      <p className="mb-3 text-xs text-zinc-400">{plantilla.descripcion}</p>
      <pre className="mb-3 whitespace-pre-wrap rounded-lg bg-zinc-50 px-4 py-3 font-sans text-sm text-zinc-700">
        {plantilla.texto}
      </pre>
      <button
        type="button"
        onClick={() => void copiar()}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        {copiado ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

export default function PanelMarketing() {
  const [tablero, setTablero] = useState<Tablero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tasas", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTablero(data as Tablero);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar")
      )
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-sm text-zinc-500">Cargando cotización…</p>;

  if (error || !tablero) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error ?? "No se pudo cargar la cotización"}
      </p>
    );
  }

  const plantillas = generarPlantillas({
    arsABob1000: tablero.arsABob1000,
    bobAArs1000: tablero.bobAArs1000,
    grupoWhatsapp: GRUPO_WHATSAPP,
  });

  return (
    <div className="w-full max-w-2xl px-4 pb-16 pt-6">
      <h2 className="mb-2 text-xl font-semibold text-zinc-900">
        Kit de marketing
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        Textos ya armados con la cotización de hoy y tu link de grupo —
        copiá y pegá donde quieras publicar.
      </p>

      <div className="space-y-4">
        {plantillas.map((p) => (
          <TarjetaPlantilla key={p.id} plantilla={p} />
        ))}
      </div>
    </div>
  );
}
