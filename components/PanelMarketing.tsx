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
  origen?: "cron" | "manual";
  error?: string;
}

interface RutaOportunidad {
  exchangeCompra: string;
  precioCompra: number;
  exchangeVenta: string;
  precioVenta: number;
  tasaResultante: number;
  tasaPromedio: number;
  mejoraPct: number;
}

interface Oportunidad {
  actualizado: string;
  arsHaciaBob: RutaOportunidad;
  bobHaciaArs: RutaOportunidad;
  desgloseArs: { exchange: string; ask: number; bid: number }[];
  desgloseBob: { exchange: string; ask: number; bid: number }[];
}

const GRUPO_WHATSAPP =
  process.env.NEXT_PUBLIC_GRUPO_WHATSAPP ?? "(falta configurar el link del grupo)";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "(falta configurar NEXT_PUBLIC_SITE_URL)";
const FACEBOOK_PAGE_URL =
  process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ??
  "https://www.facebook.com/profile.php?id=61593971301921";

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

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">Últimas publicaciones</p>
        <a href="/admin/marketing/historial" className="text-xs font-medium text-blue-600 hover:underline">
          Ver dashboard completo →
        </a>
      </div>
      {cargandoHistorial ? (
        <p className="text-xs text-zinc-400">Cargando…</p>
      ) : historial.length === 0 ? (
        <p className="text-xs text-zinc-400">Todavía no se registró ninguna publicación.</p>
      ) : (
        <ul className="space-y-1">
          {historial.map((h) => (
            <li key={h.fechaHora} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-zinc-500">
                {new Date(h.fechaHora).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
                <span className="text-[10px] text-zinc-400">
                  {h.origen === "manual" ? "🖐️ manual" : h.origen === "cron" ? "🤖 auto" : ""}
                </span>
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

function PanelCanales() {
  return (
    <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-3 font-semibold text-zinc-900">Canales</p>
      <div className="space-y-2">
        <a
          href={FACEBOOK_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          <span className="flex items-center gap-2">
            <span>📘</span> Página de Facebook (Remesas)
          </span>
          <span className="text-zinc-400">↗</span>
        </a>
        <a
          href={GRUPO_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          <span className="flex items-center gap-2">
            <span>💬</span> Grupo de WhatsApp
          </span>
          <span className="text-zinc-400">↗</span>
        </a>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          <span className="flex items-center gap-2">
            <span>🌐</span> Sitio / cotizador
          </span>
          <span className="text-zinc-400">↗</span>
        </a>
      </div>
      <p className="mt-3 text-[11px] text-zinc-400">
        La publicación automática en Facebook usa el Page ID configurado por variable de
        entorno en el servidor (puede ser distinto al de este link, que es solo para que lo
        abras vos con un click).
      </p>
    </div>
  );
}

function TarjetaRuta({
  titulo,
  monedaOrigen,
  monedaDestino,
  ruta,
}: {
  titulo: string;
  monedaOrigen: string;
  monedaDestino: string;
  ruta: RutaOportunidad;
}) {
  const mejora = ruta.mejoraPct;
  const tonoMejora =
    mejora > 0.3 ? "text-emerald-600" : mejora < -0.3 ? "text-red-500" : "text-zinc-500";

  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="mb-2 text-sm font-semibold text-zinc-800">{titulo}</p>
      <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white p-2.5 ring-1 ring-zinc-100">
          <p className="text-zinc-400">1. Comprás USDT con {monedaOrigen} en</p>
          <p className="font-semibold text-zinc-800">{ruta.exchangeCompra}</p>
          <p className="text-zinc-500">a {ruta.precioCompra.toLocaleString("es-AR", { maximumFractionDigits: 4 })}</p>
        </div>
        <div className="rounded-lg bg-white p-2.5 ring-1 ring-zinc-100">
          <p className="text-zinc-400">2. Vendés USDT por {monedaDestino} en</p>
          <p className="font-semibold text-zinc-800">{ruta.exchangeVenta}</p>
          <p className="text-zinc-500">a {ruta.precioVenta.toLocaleString("es-AR", { maximumFractionDigits: 4 })}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Rinde{" "}
        <span className="font-semibold text-zinc-800">
          {ruta.tasaResultante.toLocaleString("es-AR", { maximumFractionDigits: 5 })}
        </span>{" "}
        {monedaDestino} por {monedaOrigen}, contra{" "}
        {ruta.tasaPromedio.toLocaleString("es-AR", { maximumFractionDigits: 5 })} operando al
        promedio de todos los exchanges —{" "}
        <span className={`font-semibold ${tonoMejora}`}>
          {mejora >= 0 ? "+" : ""}
          {mejora.toFixed(2)}%
        </span>
      </p>
    </div>
  );
}

function PanelOportunidad() {
  const [datos, setDatos] = useState<Oportunidad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarDesglose, setMostrarDesglose] = useState(false);

  useEffect(() => {
    fetch("/api/oportunidad", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDatos(data as Oportunidad);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar"));
  }, []);

  return (
    <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <p className="font-semibold text-zinc-900">💡 Oportunidad entre exchanges</p>
      <p className="mb-4 text-xs text-zinc-400">
        Comparamos cada exchange que agrega CriptoYa (Binance P2P, Buenbit, etc.) para
        encontrar dónde te conviene comprar y dónde te conviene vender USDT en este momento
        — en vez de operar siempre al precio promedio, como hace el tablero público.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {!datos && !error && <p className="text-xs text-zinc-400">Calculando…</p>}

      {datos && (
        <>
          <div className="space-y-3">
            <TarjetaRuta
              titulo="Ruta ARS → BOB"
              monedaOrigen="ARS"
              monedaDestino="BOB"
              ruta={datos.arsHaciaBob}
            />
            <TarjetaRuta
              titulo="Ruta BOB → ARS"
              monedaOrigen="BOB"
              monedaDestino="ARS"
              ruta={datos.bobHaciaArs}
            />
          </div>

          <button
            type="button"
            onClick={() => setMostrarDesglose((v) => !v)}
            className="mt-3 text-xs font-medium text-blue-600 hover:underline"
          >
            {mostrarDesglose ? "Ocultar" : "Ver"} desglose completo por exchange
          </button>

          {mostrarDesglose && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { titulo: "USDT / ARS", filas: datos.desgloseArs },
                { titulo: "USDT / BOB", filas: datos.desgloseBob },
              ].map(({ titulo, filas }) => (
                <div key={titulo} className="overflow-hidden rounded-xl ring-1 ring-zinc-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2 font-medium">{titulo}</th>
                        <th className="px-3 py-2 font-medium">Compra</th>
                        <th className="px-3 py-2 font-medium">Venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f) => (
                        <tr key={f.exchange} className="border-t border-zinc-50">
                          <td className="px-3 py-1.5 text-zinc-600">{f.exchange}</td>
                          <td className="px-3 py-1.5 text-zinc-800">
                            {f.ask.toLocaleString("es-AR", { maximumFractionDigits: 3 })}
                          </td>
                          <td className="px-3 py-1.5 text-zinc-800">
                            {f.bid.toLocaleString("es-AR", { maximumFractionDigits: 3 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-zinc-400">
            &quot;Compra&quot; es lo que pagás por 1 USDT, &quot;Venta&quot; es lo que te dan
            por 1 USDT — no incluye la comisión propia de cada exchange por operar
            (retiro/red, etc.), que varía y no la publica CriptoYa.
          </p>
        </>
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
      <PanelCanales />
      <PanelOportunidad />

      <div className="space-y-4">
        {plantillas.map((p) => (
          <TarjetaPlantilla key={p.id} plantilla={p} />
        ))}
      </div>
    </div>
  );
}
