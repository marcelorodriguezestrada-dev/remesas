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

  // Solo pedimos cada fuente si el par consultado realmente la necesita,
  // así un problema con CriptoYa (BOB) no tira abajo también USD<->ARS.
  const necesitaArs = desde === "ARS" || hacia === "ARS";
  const necesitaBob = desde === "BOB" || hacia === "BOB";

  try {
    const [blue, usdtBob] = await Promise.all([
      necesitaArs ? getCotizacionBlue() : Promise.resolve(null),
      necesitaBob ? getCotizacionUsdtBob() : Promise.resolve(null),
    ]);

    const tasas: TasasMercado = {
      ARS: blue?.venta ?? 0,
      BOB: usdtBob?.ask ?? 0,
      fechaArs: blue?.fechaActualizacion ?? "",
      fechaBob: usdtBob?.time ?? 0,
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
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo obtener la cotización: ${mensaje}` },
      { status: 502 }
    );
  }
}
