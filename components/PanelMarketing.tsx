"use client";

import { useEffect, useState } from "react";
import {
  generarPlantillas,
  type PlantillaMarketing,
} from "@/lib/plantillas-marketing";

interface Tablero {
  arsABob1000: number;
  bobAArs1000: number;
  usdtAArs: number;
  usdtABob: number;
}

interface PublicacionHistorial {
  fechaHora: string;
  ok: boolean;
  error?: string;
}

const GRUPO_WHATSAPP =
  process.env.NEXT_PUBLIC_GRUPO_WHATSAPP ?? "(falta configurar el link del grupo)";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "(falta configurar NEXT_PUBLIC_SITE_URL)";

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

function PanelPublicacionAutomatica() {
  const [publicando, setPublicando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<
    { ok: boolean; mensaje: string } | null
  >(null);
  const [historial, setHistorial] = useState<PublicacionHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  async function cargarHistorial() {
    setCargandoHistorial(true);
    try {
      const res = await fetch("/api/marketing/historial-facebook", { cache: "no-store" });
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch {
      // Silencioso: el historial es informativo, no bloquea el resto del panel.
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    void cargarHistorial();
  }, []);

  async function publicarAhora() {
    setPublicando(true);
    setUltimoResultado(null);
    try {
      const res = await fetch("/api/marketing/publicar-facebook/manual", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setUltimoResultado({ ok: false, mensaje: data.error ?? "Error desconocido" });
      } else {
        setUltimoResultado({ ok: true, mensaje: "Publicado en Facebook ✅" });
      }
    } catch {
      setUltimoResultado({ ok: false, mensaje: "No se pudo conectar con el servidor" });
    } finally {
      setPublicando(false);
      void cargarHistorial();
    }
  }

  return (
    <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-zinc-900">Publicación automática en Facebook</p>
        <button
          type="button"
          onClick={() => void publicarAhora()}
          disabled={publicando}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {publicando ? "Publicando…" : "Publicar ahora"}
        </button>
      </div>
      <p className="mb-3 text-xs text-zinc-400">
        Todos los días a la hora configurada en el cron, la app publica sola el texto
        &quot;Estado de WhatsApp&quot; con la cotización del momento en tu página de Facebook.
        Este botón dispara la misma publicación al toque, para probarla o si un día
        querés forzarla.
      </p>

      {ultimoResultado && (
        <p
          className={`mb-3 rounded-lg px-3 py-2 text-xs ${
            ultimoResultado.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {ultimoResultado.mensaje}
        </p>
      )}

      <p className="mb-2 text-xs font-medium text-zinc-500">Últimas publicaciones</p>
      {cargandoHistorial ? (
        <p className="text-xs text-zinc-400">Cargando…</p>
      ) : historial.length === 0 ? (
        <p className="text-xs text-zinc-400">Todavía no se registró ninguna publicación.</p>
      ) : (
        <ul className="space-y-1">
          {historial.map((h) => (
            <li key={h.fechaHora} className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">
                {new Date(h.fechaHora).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              <span className={h.ok ? "text-emerald-600" : "text-red-500"}>
                {h.ok ? "✅ Publicado" : `❌ ${h.error ?? "Error"}`}
              </span>
            </li>
          ))}
        </ul>
      )}
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
    usdtAArs: tablero.usdtAArs,
    usdtABob: tablero.usdtABob,
    grupoWhatsapp: GRUPO_WHATSAPP,
    siteUrl: SITE_URL,
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

      <PanelPublicacionAutomatica />

      <div className="space-y-4">
        {plantillas.map((p) => (
          <TarjetaPlantilla key={p.id} plantilla={p} />
        ))}
      </div>
    </div>
  );
}
