"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RegistroPublicacion {
  fechaHora: string;
  ok: boolean;
  origen?: "cron" | "manual";
  texto: string;
  postId?: string;
  error?: string;
}

function TarjetaStat({
  etiqueta,
  valor,
  tono = "neutral",
}: {
  etiqueta: string;
  valor: string;
  tono?: "neutral" | "bien" | "mal";
}) {
  const color =
    tono === "bien"
      ? "text-emerald-600"
      : tono === "mal"
      ? "text-red-500"
      : "text-zinc-900";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="text-xs text-zinc-400">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{valor}</p>
    </div>
  );
}

function BadgeOrigen({ origen }: { origen?: "cron" | "manual" }) {
  if (origen === "manual") {
    return (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
        🖐️ Manual
      </span>
    );
  }
  if (origen === "cron") {
    return (
      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
        🤖 Automático
      </span>
    );
  }
  // Registros viejos, guardados antes de que existiera este campo.
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
      — Sin dato
    </span>
  );
}

export default function HistorialMarketingPage() {
  const [registros, setRegistros] = useState<RegistroPublicacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/marketing/historial-facebook?cantidad=100", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setRegistros(Array.isArray(data) ? data : []))
      .catch(() => setError("No se pudo cargar el historial"));
  }, []);

  const cargando = registros === null && !error;

  const total = registros?.length ?? 0;
  const exitosas = registros?.filter((r) => r.ok).length ?? 0;
  const fallidas = total - exitosas;
  const automaticas = registros?.filter((r) => r.origen === "cron").length ?? 0;
  const ultima = registros?.[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Historial de publicaciones
          </h1>
          <p className="text-sm text-zinc-500">
            Registro de cada vez que la app publicó (sola o a mano) en Facebook.
          </p>
        </div>
        <Link
          href="/admin/marketing"
          className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          ← Volver al kit
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {cargando ? (
        <p className="text-sm text-zinc-500">Cargando historial…</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TarjetaStat etiqueta="Total registradas" valor={String(total)} />
            <TarjetaStat etiqueta="Exitosas" valor={String(exitosas)} tono="bien" />
            <TarjetaStat etiqueta="Fallidas" valor={String(fallidas)} tono={fallidas > 0 ? "mal" : "neutral"} />
            <TarjetaStat etiqueta="Automáticas (cron)" valor={String(automaticas)} />
          </div>

          {ultima && (
            <div
              className={`mb-6 rounded-2xl p-4 ring-1 ${
                ultima.ok
                  ? "bg-emerald-50 ring-emerald-100"
                  : "bg-red-50 ring-red-100"
              }`}
            >
              <p className="text-xs font-medium text-zinc-500">Última publicación</p>
              <p className="mt-1 text-sm text-zinc-800">
                {new Date(ultima.fechaHora).toLocaleString("es-AR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}{" "}
                — {ultima.ok ? "✅ se publicó correctamente" : `❌ falló: ${ultima.error}`}
              </p>
            </div>
          )}

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Todas las publicaciones ({total})
          </p>

          {total === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400 ring-1 ring-zinc-100">
              Todavía no se registró ninguna publicación. Probá el botón &quot;Publicar
              ahora&quot; en /admin/marketing, o esperá a que corra el cron diario.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros!.map((r) => (
                    <tr key={r.fechaHora} className="border-b border-zinc-50 last:border-0">
                      <td className="px-4 py-3 text-zinc-600">
                        {new Date(r.fechaHora).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeOrigen origen={r.origen} />
                      </td>
                      <td className="px-4 py-3">
                        {r.ok ? (
                          <span className="text-emerald-600">✅ Publicado</span>
                        ) : (
                          <span className="text-red-500" title={r.error}>
                            ❌ {r.error && r.error.length > 40 ? r.error.slice(0, 40) + "…" : r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-6 text-xs text-zinc-400">
            Este historial vive en Firestore, en la colección{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">publicaciones_marketing</code>.
            Para el registro de CADA corrida del cron (incluso si nunca llegó a publicar,
            por ejemplo si Render tardó en despertar), también podés revisar la pestaña{" "}
            <strong>Actions</strong> de tu repo en GitHub — ahí GitHub guarda gratis el
            historial completo de cada ejecución programada, con logs.
          </p>
        </>
      )}
    </div>
  );
}
