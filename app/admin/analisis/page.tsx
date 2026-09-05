"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listarTodosLosArticulos,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  type Articulo,
} from "@/lib/articulos";

const VACIO = { titulo: "", resumen: "", contenido: "", tags: "" };

export default function AnalisisAdminPage() {
  const [articulos, setArticulos] = useState<Articulo[] | null>(null);
  const [editando, setEditando] = useState<string | null>(null); // slug, o "nuevo"
  const [form, setForm] = useState(VACIO);
  const [tema, setTema] = useState("");
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    try {
      const data = await listarTodosLosArticulos(50);
      setArticulos(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de artículos.");
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  function abrirNuevo() {
    setForm(VACIO);
    setTema("");
    setError(null);
    setEditando("nuevo");
  }

  function abrirEdicion(a: Articulo) {
    setForm({
      titulo: a.titulo,
      resumen: a.resumen,
      contenido: a.contenido,
      tags: a.tags.join(", "),
    });
    setError(null);
    setEditando(a.slug);
  }

  async function generarConIA() {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articulos/generar-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: tema || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando el borrador");
      setForm((f) => ({
        ...f,
        titulo: data.titulo,
        resumen: data.resumen,
        contenido: data.contenido,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerando(false);
    }
  }

  async function guardar(publicar: boolean) {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("Completá al menos el título y el contenido.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (editando === "nuevo") {
        await crearArticulo({
          titulo: form.titulo,
          resumen: form.resumen || form.titulo,
          contenido: form.contenido,
          tags,
          publicado: publicar,
          autor: tema ? "ia" : "manual",
        });
      } else if (editando) {
        await actualizarArticulo(editando, {
          titulo: form.titulo,
          resumen: form.resumen || form.titulo,
          contenido: form.contenido,
          tags,
          publicado: publicar,
        });
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function despublicar(a: Articulo) {
    await actualizarArticulo(a.slug, { publicado: false });
    await cargar();
  }

  async function publicar(a: Articulo) {
    await actualizarArticulo(a.slug, { publicado: true });
    await cargar();
  }

  async function borrar(a: Articulo) {
    if (!confirm(`¿Borrar "${a.titulo}"? No se puede deshacer.`)) return;
    await eliminarArticulo(a.slug);
    await cargar();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Análisis de mercado</h1>
          <p className="text-sm text-zinc-500">
            Artículos públicos sobre el dólar y el cambio ARS/BOB — pensados para atraer
            visitas por Google.
          </p>
        </div>
        {editando === null && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            + Nuevo análisis
          </button>
        )}
      </div>

      {editando !== null ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="mb-4 font-semibold text-zinc-900">
            {editando === "nuevo" ? "Nuevo análisis" : `Editando: ${editando}`}
          </p>

          <div className="mb-4 rounded-xl bg-violet-50 p-4">
            <label className="mb-1 block text-xs font-medium text-violet-700">
              Generar borrador con IA (opcional — después lo podés editar todo)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder='Ej: "por qué sube el blue" (vacío = análisis general)'
                className="flex-1 rounded-lg border border-violet-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void generarConIA()}
                disabled={generando}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {generando ? "Generando…" : "✨ Generar"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-violet-500">
              Usa siempre los números reales del tablero de hoy — no inventa cifras. Igual
              revisalo antes de publicar.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Título</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Resumen (para la lista y para SEO)
              </label>
              <input
                type="text"
                value={form.resumen}
                onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Contenido (párrafos separados por línea en blanco)
              </label>
              <textarea
                value={form.contenido}
                onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                rows={12}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Tags (separados por coma)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="dólar blue, bolivianos, USDT"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void guardar(true)}
              disabled={guardando}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar y publicar"}
            </button>
            <button
              type="button"
              onClick={() => void guardar(false)}
              disabled={guardando}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              Guardar como borrador
            </button>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {articulos === null ? (
            <p className="text-sm text-zinc-500">Cargando…</p>
          ) : articulos.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-400 ring-1 ring-zinc-100">
              Todavía no escribiste ningún análisis. Arrancá con &quot;+ Nuevo análisis&quot;.
            </p>
          ) : (
            articulos.map((a) => (
              <div
                key={a.slug}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900">{a.titulo}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{a.resumen}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-400">
                      <span
                        className={
                          a.publicado
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600"
                            : "rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500"
                        }
                      >
                        {a.publicado ? "Publicado" : "Borrador"}
                      </span>
                      <span>{a.autor === "ia" ? "✨ IA" : "✍️ Manual"}</span>
                      <span>
                        {new Date(a.fechaCreacion).toLocaleDateString("es-AR", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    {a.publicado ? (
                      <Link
                        href={`/analisis/${a.slug}`}
                        target="_blank"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Ver publicado ↗
                      </Link>
                    ) : (
                      <button
                        onClick={() => void publicar(a)}
                        className="text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Publicar
                      </button>
                    )}
                    <button
                      onClick={() => abrirEdicion(a)}
                      className="text-xs font-medium text-zinc-500 hover:underline"
                    >
                      Editar
                    </button>
                    {a.publicado && (
                      <button
                        onClick={() => void despublicar(a)}
                        className="text-xs font-medium text-zinc-400 hover:underline"
                      >
                        Despublicar
                      </button>
                    )}
                    <button
                      onClick={() => void borrar(a)}
                      className="text-xs font-medium text-red-400 hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
