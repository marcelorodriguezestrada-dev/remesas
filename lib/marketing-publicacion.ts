import { obtenerTablero } from "@/lib/tablero";
import { generarPlantillas } from "@/lib/plantillas-marketing";
import { publicarEnFacebook } from "@/lib/facebook";
import { registrarPublicacion } from "@/lib/publicaciones-marketing";

const GRUPO_WHATSAPP = process.env.NEXT_PUBLIC_GRUPO_WHATSAPP ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export interface ResultadoPublicacionCotizacion {
  ok: boolean;
  postId?: string;
  texto: string;
  error?: string;
}

/**
 * Arma el texto de la cotización del momento y lo publica en la página de
 * Facebook configurada. La usan dos caminos distintos que terminan
 * haciendo exactamente lo mismo:
 *  - el cron diario (app/api/marketing/publicar-facebook), protegido con
 *    CRON_SECRET porque lo llama un proceso externo sin sesión;
 *  - el botón "Publicar ahora" del admin (.../publicar-facebook/manual),
 *    protegido porque solo se renderiza detrás de AdminGuard.
 * Si esta lógica se hubiera copiado en los dos endpoints, un cambio futuro
 * en la plantilla o en cómo se arma el mensaje fácilmente quedaría
 * aplicado en uno y olvidado en el otro.
 */
export async function publicarCotizacionEnFacebook(
  origen: "cron" | "manual"
): Promise<ResultadoPublicacionCotizacion> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageId || !pageAccessToken) {
    return {
      ok: false,
      texto: "",
      error: "Faltan configurar FACEBOOK_PAGE_ID y/o FACEBOOK_PAGE_ACCESS_TOKEN",
    };
  }

  const tablero = await obtenerTablero();

  const plantillas = generarPlantillas({
    arsABob1000: tablero.arsABob1000,
    bobAArs1000: tablero.bobAArs1000,
    usdtAArs: tablero.usdtAArs,
    usdtABob: tablero.usdtABob,
    grupoWhatsapp: GRUPO_WHATSAPP,
    siteUrl: SITE_URL,
  });

  // La plantilla "estado_whatsapp" es la misma que ya usás a mano en
  // Facebook: corta, con la cotización del día y los dos links.
  const texto = plantillas.find((p) => p.id === "estado_whatsapp")!.texto;

  const resultado = await publicarEnFacebook(pageId, pageAccessToken, texto);

  await registrarPublicacion({
    fechaHora: new Date().toISOString(),
    canal: "facebook",
    origen,
    ok: resultado.ok,
    texto,
    postId: resultado.postId,
    error: resultado.error,
  }).catch((err) => console.error("No se pudo registrar la publicación:", err));

  return { ok: resultado.ok, postId: resultado.postId, texto, error: resultado.error };
}
