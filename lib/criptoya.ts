// CriptoYa (https://criptoya.com) — API pública, sin auth, sin costo.
// No hay una fuente de "dólar blue boliviano" tan directa como DolarAPI para
// Argentina, pero el mercado paralelo en Bolivia se arma sobre USDT/BOB en
// plataformas P2P (Binance, Bitget, etc.), y CriptoYa agrega esos precios.

export interface CotizacionUsdtBob {
  ask: number; // BOB que hay que pagar para comprar 1 USDT (referencia de "comprar dólares")
  bid: number; // BOB que se obtiene al vender 1 USDT (referencia de "vender dólares")
  time: number; // timestamp unix
}

const CRIPTOYA_USDT_BOB_URL = "https://criptoya.com/api/USDT/BOB/1";

export async function getCotizacionUsdtBob(): Promise<CotizacionUsdtBob> {
  const res = await fetch(CRIPTOYA_USDT_BOB_URL, {
    headers: {
      // Algunos proveedores bloquean o responden distinto a pedidos sin
      // User-Agent (los tratan como bots). Nos identificamos como lo que
      // somos: un fetch de servidor, no un navegador.
      "User-Agent": "remesas-app/1.0 (+https://criptoya.com/api docs)",
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // 5 minutos, mismo criterio que el blue
  });

  const textoRespuesta = await res.text();

  if (!res.ok) {
    console.error(
      `CriptoYa respondió ${res.status} para USDT/BOB. Cuerpo: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error(`CriptoYa respondió ${res.status} al consultar USDT/BOB`);
  }

  let data: CotizacionUsdtBob;
  try {
    data = JSON.parse(textoRespuesta) as CotizacionUsdtBob;
  } catch {
    console.error(
      `CriptoYa devolvió una respuesta no-JSON para USDT/BOB: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error("CriptoYa devolvió una respuesta inesperada para BOB");
  }

  if (!data.ask || data.ask <= 0) {
    console.error(
      `CriptoYa devolvió ask inválido para USDT/BOB. Respuesta completa: ${JSON.stringify(data)}`
    );
    throw new Error("CriptoYa devolvió una cotización inválida para BOB");
  }

  return data;
}