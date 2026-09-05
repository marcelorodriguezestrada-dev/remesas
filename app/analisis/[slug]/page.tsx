import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerArticulo } from "@/lib/articulos";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 1800; // 30 min

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articulo = await obtenerArticulo(slug);

  if (!articulo || !articulo.publicado) {
    return { title: "Análisis no encontrado" };
  }

  return {
    title: articulo.titulo,
    description: articulo.resumen,
    openGraph: {
      title: articulo.titulo,
      description: articulo.resumen,
      type: "article",
      publishedTime: articulo.fechaCreacion,
    },
  };
}

export default async function ArticuloPage({ params }: Props) {
  const { slug } = await params;
  const articulo = await obtenerArticulo(slug);

  if (!articulo || !articulo.publicado) {
    notFound();
  }

  const parrafos = articulo.contenido.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-12">
      <Link href="/analisis" className="mb-6 text-sm text-blue-600 hover:underline">
        ← Todos los análisis
      </Link>

      <p className="text-xs text-zinc-400">
        {new Date(articulo.fechaCreacion).toLocaleDateString("es-AR", { dateStyle: "long" })}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{articulo.titulo}</h1>

      {articulo.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {articulo.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        {parrafos.map((p, i) => (
          <p key={i} className="mb-4 text-[15px] leading-relaxed text-zinc-700">
            {p}
          </p>
        ))}
      </div>

      <Link
        href="/"
        className="mt-10 inline-block rounded-xl bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Cotizá tu monto →
      </Link>
    </div>
  );
}
