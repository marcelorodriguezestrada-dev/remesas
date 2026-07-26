import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { Moneda } from "@/lib/pricing";

const COLECCION = "operaciones";

export type EstadoOperacion =
  | "pending"
  | "origen_recibido"
  | "pagado"
  | "cancelado";

export interface NuevaOperacion {
  cliente_nombre: string;
  cliente_contacto?: string;
  destinatario_nombre: string;
  destinatario_cuenta?: string;
  moneda_origen: Moneda;
  moneda_destino: Moneda;
  monto_origen: number;
  monto_destino: number;
  tipo_cambio_cliente: number;
  margen_pct: number;
  notas?: string;
}

export interface Operacion extends NuevaOperacion {
  id: string;
  created_at: string; // ISO string, ya convertido para el frontend
  estado: EstadoOperacion;
}

export async function crearOperacion(
  datos: NuevaOperacion
): Promise<Operacion> {
  const datosLimpios = Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== undefined)
  );

  const ref = await addDoc(collection(db, COLECCION), {
    ...datosLimpios,
    estado: "pending" as EstadoOperacion,
    created_at: serverTimestamp(),
  });

  // serverTimestamp() no resuelve el valor hasta que Firestore confirma la
  // escritura, así que devolvemos la hora local como aproximación inmediata
  // para la UI; el valor real queda guardado en el documento.
  return {
    id: ref.id,
    ...datos,
    estado: "pending",
    created_at: new Date().toISOString(),
  };
}

export async function actualizarEstado(
  id: string,
  estado: EstadoOperacion
): Promise<void> {
  await updateDoc(doc(db, COLECCION, id), { estado });
}

export async function listarOperacionesPorEstado(
  estados: EstadoOperacion[]
): Promise<Operacion[]> {
  const q = query(
    collection(db, COLECCION),
    where("estado", "in", estados),
    orderBy("created_at", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.created_at as Timestamp | null;
    return {
      id: d.id,
      cliente_nombre: data.cliente_nombre,
      cliente_contacto: data.cliente_contacto,
      destinatario_nombre: data.destinatario_nombre,
      destinatario_cuenta: data.destinatario_cuenta,
      moneda_origen: data.moneda_origen,
      moneda_destino: data.moneda_destino,
      monto_origen: data.monto_origen,
      monto_destino: data.monto_destino,
      tipo_cambio_cliente: data.tipo_cambio_cliente,
      margen_pct: data.margen_pct,
      notas: data.notas,
      estado: data.estado,
      created_at: createdAt
        ? createdAt.toDate().toISOString()
        : new Date().toISOString(),
    } satisfies Operacion;
  });
}

export async function listarOperacionesPendientes(): Promise<Operacion[]> {
  return listarOperacionesPorEstado(["pending", "origen_recibido"]);
}

export async function listarOperacionesPagadas(): Promise<Operacion[]> {
  return listarOperacionesPorEstado(["pagado"]);
}
