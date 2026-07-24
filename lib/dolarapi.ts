// Cliente para DolarAPI (https://dolarapi.com) — API pública, sin auth, sin costo.
// Devuelve la cotización del dólar blue (compra/venta) publicada en Argentina.

export interface CotizacionBlue {
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion: string;
}

const DOLARAPI_BLUE_URL = "https://dolarapi.com/v1/dolares/blue";

/**
 * Consulta la cotización del dólar blue.
 * Usa el cache de Next.js con revalidación cada 5 minutos: el blue no
 * necesita actualizarse en tiempo real segundo a segundo para este caso de uso,
 * y evita golpear la API en cada carga de página.
 */
export async function getCotizacionBlue(): Promise<CotizacionBlue> {
  const res = await fetch(DOLARAPI_BLUE_URL, {
    next: { revalidate: 300 }, // 5 minutos
  });

  if (!res.ok) {
    throw new Error(
      `DolarAPI respondió ${res.status} al consultar el dólar blue`
    );
  }

  const data = (await res.json()) as CotizacionBlue;

  if (!data.venta || data.venta <= 0) {
    throw new Error("DolarAPI devolvió una cotización inválida");
  }

  return data;
}
