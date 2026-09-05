import type { Metadata } from "next";
import Link from "next/link";
import { listarArticulosPublicados, type Articulo } from "@/lib/articulos";

export const metadata: Metadata = {
  title: "Análisis del mercado del dólar — Argentina y Bolivia",
  description:
    "Notas sobre el dólar blue, el USDT y el cambio ARS/BOB, actualizadas con la cotización del día.",
};

// Esta página depende de Firestore en cada visita (lista de artículos
// publicados). Si la dejamos como estática/ISR, Next.js intenta
// resolverla en el momento del BUILD — y si en ese instante Firestore
// está caído, mal configurado, o las reglas no están publicadas todavía,
// se cae el build de TODO el sitio, no solo esta página. force-dynamic
// evita eso: se renderiza en cada visita, en el servidor, como una página
// normal (sigue siendo indexable por Google igual).
export const dynamic = "force-dynamic";

export default async function AnalisisPage() {
  let articulos: Articulo[] = [];
  let error: string | null = null;

  try {
    articulos = await listarArticulosPublicados(30);
  } catch (err) {
    // Nunca dejamos que un problema de Firestore rompa la página entera
    // para un visitante real — en el peor caso, se ve vacía con un aviso.
    console.error("Error listando artículos publicados:", err);
    error = "No se pudieron cargar los análisis en este momento.";
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
        Análisis del mercado
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Notas sobre el dólar blue, el USDT y el cambio entre pesos argentinos y bolivianos.
      </p>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!error && articulos.length === 0 ? (
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
