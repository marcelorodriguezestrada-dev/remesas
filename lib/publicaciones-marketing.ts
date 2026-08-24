import { db } from "@/lib/firebase";
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const COLECCION = "publicaciones_marketing";

export interface RegistroPublicacion {
  fechaHora: string; // ISO
  canal: "facebook";
  ok: boolean;
  texto: string;
  postId?: string;
  error?: string;
}

export async function registrarPublicacion(datos: RegistroPublicacion): Promise<void> {
  const id = `${datos.canal}_${Date.now()}`;
  await setDoc(doc(db, COLECCION, id), datos);
}

/** Últimas `cantidad` publicaciones, más reciente primero (para mostrar en el admin). */
export async function listarPublicaciones(cantidad = 20): Promise<RegistroPublicacion[]> {
  const q = query(collection(db, COLECCION), orderBy("fechaHora", "desc"), limit(cantidad));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as RegistroPublicacion);
}
