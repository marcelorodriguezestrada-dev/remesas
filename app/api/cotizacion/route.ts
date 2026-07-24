import { NextResponse } from "next/server";
import { getCotizacionBlue } from "@/lib/dolarapi";
import { getCotizacionUsdtBob } from "@/lib/criptoya";
import {
  calcularTipoCambioCliente,
  MARGEN_DEFAULT,
  type Cotizacion,
  type Moneda,
  type TasasMercado,
} from "@/lib/pricing";

const MONEDAS_VALIDAS: Moneda[] = ["USD", "ARS", "BOB"];

// GET /api/cotizacion?desde=USD&hacia=ARS&margen=0.03
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desde = (searchParams.get("desde") ?? "USD") as Moneda;
  const hacia = (searchParams.get("hacia") ?? "ARS") as Moneda;
  const margenParam = searchParams.get("margen");
  const margenPct = margenParam ? Number(margenParam) : MARGEN_DEFAULT;

  if (!MONEDAS_VALIDAS.includes(desde) || !MONEDAS_VALIDAS.includes(hacia)) {
    return NextResponse.json(
      { error: `'desde' y 'hacia' deben ser uno de: ${MONEDAS_VALIDAS.join(", ")}` },
      { status: 400 }
    );
  }
  if (desde === hacia) {
    return NextResponse.json(
      { error: "'desde' y 'hacia' no pueden ser la misma moneda" },
      { status: 400 }
    );
  }
  if (Number.isNaN(margenPct) || margenPct < 0 || margenPct >= 1) {
    return NextResponse.json(
      { error: "El parámetro 'margen' debe ser un número entre 0 y 1" },
      { status: 400 }
    );
  }

  try {
    // Pedimos las dos fuentes en paralelo, aunque el par consultado solo
    // necesite una — simplifica el código y ambas responden rápido.
    const [blue, usdtBob] = await Promise.all([
      getCotizacionBlue(),
      getCotizacionUsdtBob(),
    ]);

    const tasas: TasasMercado = {
      ARS: blue.venta,
      BOB: usdtBob.ask,
      fechaArs: blue.fechaActualizacion,
      fechaBob: usdtBob.time,
    };

    const tipoCambioCliente = calcularTipoCambioCliente(
      desde,
      hacia,
      tasas,
      margenPct
    );

    const cotizacion: Cotizacion = {
      desde,
      hacia,
      tasas,
      margenPct,
      tipoCambioCliente,
    };

    return NextResponse.json(cotizacion);
  } catch (err) {
    console.error("Error obteniendo cotización:", err);
    return NextResponse.json(
      { error: "No se pudo obtener alguna de las cotizaciones. Probá de nuevo." },
      { status: 502 }
    );
  }
}
