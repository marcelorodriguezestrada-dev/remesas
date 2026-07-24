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
    next: { revalidate: 300 }, // 5 minutos, mismo criterio que el blue
  });

  if (!res.ok) {
    throw new Error(`CriptoYa respondió ${res.status} al consultar USDT/BOB`);
  }

  const data = (await res.json()) as CotizacionUsdtBob;

  if (!data.ask || data.ask <= 0) {
    throw new Error("CriptoYa devolvió una cotización inválida para BOB");
  }

  return data;
}
