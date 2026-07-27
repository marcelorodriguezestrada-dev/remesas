import { db } from "@/lib/firebase";
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const COLECCION = "historial_tasas";

export interface SnapshotTasa {
  fechaHora: string; // ISO, truncado a la hora
  usdArs: number;
  usdBob: number;
  margenPct: number;
  arsABob1000: number;
  bobAArs1000: number;
}

function idDeHoraActual(): string {
  // Ej: "2026-07-26T14" — todas las escrituras dentro de la misma hora
  // pisan el mismo documento, así no se acumulan miles de filas.
  return new Date().toISOString().slice(0, 13);
}

/**
 * Guarda (o actualiza) la foto de esta hora. Se llama desde el endpoint
 * público /api/tasas cada vez que alguien lo consulta — no hace falta un
 * cron aparte, con el tráfico normal de la página alcanza para tener al
 * menos una foto por hora la mayoría de las horas.
 */
export async function registrarSnapshot(
  datos: Omit<SnapshotTasa, "fechaHora">
): Promise<void> {
  const id = idDeHoraActual();
  await setDoc(
    doc(db, COLECCION, id),
    { ...datos, fechaHora: new Date().toISOString() },
    { merge: true }
  );
}

/** Últimas `cantidad` fotos, más antigua primero (para graficar en orden). */
export async function listarHistorial(cantidad = 168): Promise<SnapshotTasa[]> {
  // 168 horas = 7 días con una foto por hora.
  const q = query(
    collection(db, COLECCION),
    orderBy("fechaHora", "desc"),
    limit(cantidad)
  );
  const snapshot = await getDocs(q);
  const datos = snapshot.docs.map((d) => d.data() as SnapshotTasa);
  return datos.reverse();
}
