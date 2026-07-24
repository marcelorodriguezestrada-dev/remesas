import { NextResponse } from "next/server";
import { actualizarEstado, type EstadoOperacion } from "@/lib/operaciones";

const ESTADOS_VALIDOS: EstadoOperacion[] = [
  "pending",
  "origen_recibido",
  "pagado",
  "cancelado",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { estado?: EstadoOperacion };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.estado || !ESTADOS_VALIDOS.includes(body.estado)) {
    return NextResponse.json(
      {
        error: `'estado' debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    await actualizarEstado(id, body.estado);
    return NextResponse.json({ id, estado: body.estado });
  } catch (err) {
    console.error("Error actualizando operación:", err);
    const mensaje = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
