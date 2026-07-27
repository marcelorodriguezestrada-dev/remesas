import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { Moneda } from "@/lib/pricing";

const COLECCION = "competencia";

export interface NuevaObservacionCompetencia {
  competidor: string; // nombre del competidor u origen del dato (ej: "JH Safe", "grupo de WhatsApp")
  moneda_origen: Moneda;
  moneda_destino: Moneda;
  tasa_observada: number; // unidades de moneda_destino por 1 unidad de moneda_origen
  notas?: string;
}

export interface ObservacionCompetencia extends NuevaObservacionCompetencia {
  id: string;
  created_at: string;
}

export async function registrarObservacion(
  datos: NuevaObservacionCompetencia
): Promise<void> {
  // Firestore rechaza el documento entero si algún campo llega en
  // `undefined` (a diferencia de otras bases, que simplemente lo
  // ignorarían) — filtramos esos campos antes de escribir.
  const datosLimpios = Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== undefined)
  );

  await addDoc(collection(db, COLECCION), {
    ...datosLimpios,
    created_at: serverTimestamp(),
  });
}

/** Últimas observaciones cargadas, más recientes primero. */
export async function listarObservacionesRecientes(
  cantidad = 20
): Promise<ObservacionCompetencia[]> {
  const q = query(
    collection(db, COLECCION),
    orderBy("created_at", "desc"),
    limit(cantidad)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.created_at as Timestamp | null;
    return {
      id: d.id,
      competidor: data.competidor,
      moneda_origen: data.moneda_origen,
      moneda_destino: data.moneda_destino,
      tasa_observada: data.tasa_observada,
      notas: data.notas,
      created_at: createdAt
        ? createdAt.toDate().toISOString()
        : new Date().toISOString(),
    } satisfies ObservacionCompetencia;
  });
}
