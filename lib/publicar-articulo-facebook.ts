import { publicarEnFacebook } from "@/lib/facebook";
import { registrarPublicacion } from "@/lib/publicaciones-marketing";
import type { Articulo } from "@/lib/articulos";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://remesas-4bgn.onrender.com";

export interface ResultadoPublicacionArticulo {
  ok: boolean;
  postId?: string;
  texto: string;
  error?: string;
}

function armarTextoArticulo(articulo: Articulo): string {
  const url = `${SITE_URL}/analisis/${articulo.slug}`;
  return `📊 ${articulo.titulo}\n\n${articulo.resumen}\n\nLeé el análisis completo acá 👉 ${url}`;
}

export async function publicarArticuloEnFacebook(
  articulo: Articulo
): Promise<ResultadoPublicacionArticulo> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageAccessToken) {
    return {
      ok: false,
      texto: "",
      error: "Faltan configurar FACEBOOK_PAGE_ID y/o FACEBOOK_PAGE_ACCESS_TOKEN",
    };
  }

  const texto = armarTextoArticulo(articulo);
  const resultado = await publicarEnFacebook(pageId, pageAccessToken, texto);

  await registrarPublicacion({
    fechaHora: new Date().toISOString(),
    canal: "facebook",
    origen: "manual",
    ok: resultado.ok,
    texto,
    postId: resultado.postId,
    error: resultado.error,
  }).catch((err) => console.error("No se pudo registrar la publicación:", err));

  return { ok: resultado.ok, postId: resultado.postId, texto, error: resultado.error };
}
