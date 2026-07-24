import { NextResponse } from "next/server";
import {
  crearOperacion,
  listarOperacionesPendientes,
  type NuevaOperacion,
} from "@/lib/operaciones";

export async function GET() {
  try {
    const operaciones = await listarOperacionesPendientes();
    return NextResponse.json(operaciones);
  } catch (err) {
    console.error("Error listando operaciones:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: NuevaOperacion;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const camposRequeridos: (keyof NuevaOperacion)[] = [
    "cliente_nombre",
    "destinatario_nombre",
    "moneda_origen",
    "moneda_destino",
    "monto_origen",
    "monto_destino",
    "tipo_cambio_cliente",
    "margen_pct",
  ];

  const faltante = camposRequeridos.find((campo) => body[campo] === undefined);
  if (faltante) {
    return NextResponse.json(
      { error: `Falta el campo requerido: ${faltante}` },
      { status: 400 }
    );
  }

  try {
    const operacion = await crearOperacion(body);
    return NextResponse.json(operacion, { status: 201 });
  } catch (err) {
    console.error("Error creando operación:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
