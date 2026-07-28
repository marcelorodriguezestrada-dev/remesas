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

const COLECCION = "visitas";

export interface DatosUtm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface Visita extends DatosUtm {
  id: string;
  created_at: string;
}

export async function registrarVisita(datos: DatosUtm): Promise<void> {
  const datosLimpios = Object.fromEntries(
    Object.entries(datos).filter(([, valor]) => valor !== undefined)
  );
  await addDoc(collection(db, COLECCION), {
    ...datosLimpios,
    created_at: serverTimestamp(),
  });
}

export async function listarVisitas(cantidad = 2000): Promise<Visita[]> {
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
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      created_at: createdAt
        ? createdAt.toDate().toISOString()
        : new Date().toISOString(),
    } satisfies Visita;
  });
}
