const GRAPH_API_VERSION = "v21.0";

export interface ResultadoPublicacionFacebook {
  ok: boolean;
  postId?: string;
  error?: string;
}

/**
 * Publica un texto en el feed de la página de Facebook indicada, usando
 * un Page Access Token de larga duración (no el token de usuario que
 * caduca en un par de horas).
 *
 * El "id" acá es el ID de la PÁGINA de Facebook (no de tu perfil personal),
 * y el "token" tiene que ser un Page Access Token con el permiso
 * pages_manage_posts habilitado. Se consiguen desde Meta for Developers >
 * tu app > Graph API Explorer, generando primero un User Token con esos
 * permisos y después canjeándolo por el Page Access Token de la página.
 */
export async function publicarEnFacebook(
  pageId: string,
  pageAccessToken: string,
  mensaje: string
): Promise<ResultadoPublicacionFacebook> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed`;

  const body = new URLSearchParams({
    message: mensaje,
    access_token: pageAccessToken,
  });

  try {
    const res = await fetch(url, { method: "POST", body });
    const data = await res.json();

    if (!res.ok || data.error) {
      const mensajeError =
        data?.error?.message ?? `Facebook respondió ${res.status} sin detalle`;
      return { ok: false, error: mensajeError };
    }

    return { ok: true, postId: data.id as string };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red desconocido",
    };
  }
}
