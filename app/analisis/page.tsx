import type { Metadata } from "next";
import Link from "next/link";
import { listarArticulosPublicados } from "@/lib/articulos";

export const metadata: Metadata = {
  title: "Análisis del mercado del dólar — Argentina y Bolivia",
  description:
    "Notas sobre el dólar blue, el USDT y el cambio ARS/BOB, actualizadas con la cotización del día.",
};

export const revalidate = 1800; // 30 min — no hace falta recalcular en cada visita

export default async function AnalisisPage() {
  const articulos = await listarArticulosPublicados(30);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
        Análisis del mercado
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Notas sobre el dólar blue, el USDT y el cambio entre pesos argentinos y bolivianos.
      </p>

      {articulos.length === 0 ? (
        <p className="text-sm text-zinc-400">Todavía no hay análisis publicados.</p>
      ) : (
        <div className="space-y-4">
          {articulos.map((a) => (
            <Link
              key={a.slug}
              href={`/analisis/${a.slug}`}
              className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 transition hover:ring-zinc-300"
            >
              <p className="text-xs text-zinc-400">
                {new Date(a.fechaCreacion).toLocaleDateString("es-AR", { dateStyle: "long" })}
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{a.titulo}</p>
              <p className="mt-1 text-sm text-zinc-500">{a.resumen}</p>
            </Link>
          ))}
        </div>
      )}

      <Link href="/" className="mt-10 text-sm text-blue-600 hover:underline">
        ← Volver al cotizador
      </Link>
    </div>
  );
}
