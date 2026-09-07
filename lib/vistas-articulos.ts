import { db } from "@/lib/firebase";
import { doc, getDocs, setDoc, increment, collection } from "firebase/firestore";

const COLECCION = "vistas_articulos";

/**
 * Colección separada de "visitas" (la del funnel de UTM/conversión) a
 * propósito: acá solo importa "cuánta gente entró a cada análisis", no
 * de dónde vino ni si terminó operando. Mezclarlo con "visitas" hubiera
 * inflado el denominador de la conversión visita→operación del Funnel,
 * que hoy solo cuenta sesiones en la home.
 */

export async function registrarVistaArticulo(slug: string): Promise<void> {
  // setDoc + merge + increment funciona tanto si el documento ya existe
  // como si es la primera vista (Firestore trata el campo ausente como 0)
  // — así el visitante anónimo solo necesita permiso de ESCRITURA, sin
  // tener que leer el documento antes para saber si ya existe.
  await setDoc(doc(db, COLECCION, slug), { conteo: increment(1) }, { merge: true });
}

/** Devuelve un mapa slug -> cantidad de vistas, para mostrar en el admin. */
export async function obtenerVistasPorArticulo(): Promise<Record<string, number>> {
  const snap = await getDocs(collection(db, COLECCION));
  const conteo: Record<string, number> = {};
  snap.forEach((d) => {
    conteo[d.id] = (d.data().conteo as number) ?? 0;
  });
  return conteo;
}
