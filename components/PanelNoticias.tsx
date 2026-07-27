"use client";

import { useEffect, useState } from "react";
import type { Titular } from "@/lib/noticias";

function ListaTitulares({ titulares }: { titulares: Titular[] }) {
  if (titulares.length === 0) {
    return <p className="text-sm text-zinc-500">Sin titulares por ahora.</p>;
  }
  return (
    <ul className="space-y-3">
      {titulares.map((t, i) => (
        <li key={i}>
          <a
            href={t.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-zinc-800 hover:text-green-600 hover:underline"
          >
            {t.titulo}
          </a>
          <p className="text-xs text-zinc-400">{t.fuente}</p>
        </li>
      ))}
    </ul>
  );
}

export default function PanelNoticias() {
  const [argentina, setArgentina] = useState<Titular[]>([]);
  const [bolivia, setBolivia] = useState<Titular[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/noticias", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setArgentina(data.argentina);
        setBolivia(data.bolivia);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar")
      )
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="text-sm text-zinc-500">Cargando noticias…</p>;
  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <p className="mb-3 text-sm font-semibold text-zinc-900">
          🇦🇷 Dólar en Argentina
        </p>
        <ListaTitulares titulares={argentina} />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <p className="mb-3 text-sm font-semibold text-zinc-900">
          🇧🇴 Dólar en Bolivia
        </p>
        <ListaTitulares titulares={bolivia} />
      </div>
    </div>
  );
}
