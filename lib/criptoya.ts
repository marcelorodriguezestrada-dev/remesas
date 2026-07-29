// CriptoYa (https://criptoya.com) — API pública, sin auth, sin costo.
// Precio de USDT contra distintas monedas fiat, vía plataformas P2P
// (Binance, Bybit, Bitget, etc.). Lo usamos para dos cosas:
//  - El paralelo boliviano (no hay una fuente de "dólar blue" tan directa
//    como DolarAPI para Argentina; el mercado se arma sobre USDT/BOB).
//  - El precio real que hay que ofrecer cuando el cliente deposita USDT
//    directamente (cripto), que NO es lo mismo que el blue en pesos —
//    son mercados distintos y pueden diferir.
//
// OJO: el endpoint de "cotización general" (el que usamos acá) NO devuelve
// {ask, bid} directo — devuelve un objeto con una entrada POR CADA exchange,
// cada una con su propio ask/bid. Promediamos entre todos para tener un
// precio de referencia más estable que depender de un solo exchange.

export interface CotizacionUsdt {
  ask: number; // promedio de la moneda fiat que hay que pagar para comprar 1 USDT
  bid: number; // promedio de la moneda fiat que se obtiene al vender 1 USDT
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

async function getCotizacionUsdt(fiat: string): Promise<CotizacionUsdt> {
  const url = `https://criptoya.com/api/USDT/${fiat}/1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "remesas-app/1.0 (+https://criptoya.com/api docs)",
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  const textoRespuesta = await res.text();

  if (!res.ok) {
    console.error(
      `CriptoYa respondió ${res.status} para USDT/${fiat}. Cuerpo: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error(`CriptoYa respondió ${res.status} al consultar USDT/${fiat}`);
  }

  let data: Record<string, CotizacionPorExchange>;
  try {
    data = JSON.parse(textoRespuesta) as Record<string, CotizacionPorExchange>;
  } catch {
    console.error(
      `CriptoYa devolvió una respuesta no-JSON para USDT/${fiat}: ${textoRespuesta.slice(0, 500)}`
    );
    throw new Error(`CriptoYa devolvió una respuesta inesperada para ${fiat}`);
  }

  const exchangesValidos = Object.values(data).filter(
    (c) => c && c.ask > 0 && c.bid > 0
  );

  if (exchangesValidos.length === 0) {
    console.error(
      `Ningún exchange tenía cotización válida para USDT/${fiat}. Respuesta completa: ${JSON.stringify(data)}`
    );
    throw new Error(`CriptoYa no tiene cotizaciones disponibles para ${fiat} ahora mismo`);
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

export function getCotizacionUsdtBob(): Promise<CotizacionUsdt> {
  return getCotizacionUsdt("BOB");
}

export function getCotizacionUsdtArs(): Promise<CotizacionUsdt> {
  return getCotizacionUsdt("ARS");
}
