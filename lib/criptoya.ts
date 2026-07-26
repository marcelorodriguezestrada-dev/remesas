// CriptoYa (https://criptoya.com) — API pública, sin auth, sin costo.
// No hay una fuente de "dólar blue boliviano" tan directa como DolarAPI para
// Argentina, pero el mercado paralelo en Bolivia se arma sobre USDT/BOB en
// plataformas P2P (Binance, Bitget, etc.), y CriptoYa agrega esos precios.
//
// OJO: el endpoint de "cotización general" (el que usamos acá) NO devuelve
// {ask, bid} directo — devuelve un objeto con una entrada POR CADA exchange
// (binancep2p, bybitp2p, bitgetp2p, etc.), cada una con su propio ask/bid.
// Promediamos entre todos para tener un precio de referencia más estable
// que depender de un solo exchange puntual.

export interface CotizacionUsdtBob {
  ask: number; // promedio de BOB que hay que pagar para comprar 1 USDT
  bid: number; // promedio de BOB que se obtiene al vender 1 USDT
  time: number; // timestamp unix más reciente entre los exchanges usados
  fuentes: number; // cuántos exchanges se promediaron, por transparencia
}

interface CotizacionPorExchange {
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
  time: number;
}

const CRIPTOYA_USDT_BOB_URL = "https://criptoya.com/api/USDT/BOB/1";

export async function getCotizacionUsdtBob(): Promise<CotizacionUsdtBob> {
  const res = await fetch(CRIPTOYA_USDT_BOB_URL, {
    headers: {
      "User-Agent": "remesas-app/1.0 (+https://criptoya.com/api docs)",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  const textoRespuesta = await res.text();

  if (!res.ok) {
    console.error(
      `CriptoYa respondió ${res.status} para USDT/BOB. Cuerpo: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error(`CriptoYa respondió ${res.status} al consultar USDT/BOB`);
  }

  let data: Record<string, CotizacionPorExchange>;
  try {
    data = JSON.parse(textoRespuesta) as Record<string, CotizacionPorExchange>;
  } catch {
    console.error(
      `CriptoYa devolvió una respuesta no-JSON para USDT/BOB: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error("CriptoYa devolvió una respuesta inesperada para BOB");
  }

  const exchangesValidos = Object.values(data).filter(
    (c) => c && c.ask > 0 && c.bid > 0
  );

  if (exchangesValidos.length === 0) {
    console.error(
      `Ningún exchange tenía cotización válida para USDT/BOB. Respuesta completa: ${JSON.stringify(data)}`
    );
    throw new Error("CriptoYa no tiene cotizaciones disponibles para BOB ahora mismo");
  }

  const promedio = (valores: number[]) =>
    valores.reduce((suma, v) => suma + v, 0) / valores.length;

  return {
    ask: promedio(exchangesValidos.map((c) => c.ask)),
    bid: promedio(exchangesValidos.map((c) => c.bid)),
    time: Math.max(...exchangesValidos.map((c) => c.time)),
    fuentes: exchangesValidos.length,
  };
}
