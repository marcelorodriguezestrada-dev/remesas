import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit as limitTo,
} from "firebase/firestore";

const COLECCION = "articulos_mercado";

export interface Articulo {
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string; // markdown simple: párrafos separados por líneas en blanco
  tags: string[];
  publicado: boolean;
  autor: "manual" | "ia";
  fechaCreacion: string; // ISO
  fechaActualizacion: string; // ISO
}

/** "Análisis USD Argentina vs Bolivia — Agosto 2026" -> "analisis-usd-argentina-vs-bolivia-agosto-2026" */
export function generarSlug(titulo: string): string {
  const base = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  // Le suma un sufijo corto de fecha para que dos títulos parecidos no choquen.
  const sufijo = new Date().toISOString().slice(0, 10);
  return `${base}-${sufijo}`;
}

export async function crearArticulo(
  datos: Omit<Articulo, "slug" | "fechaCreacion" | "fechaActualizacion"> & { slug?: string }
): Promise<string> {
  const slug = datos.slug || generarSlug(datos.titulo);
  const ahora = new Date().toISOString();

  const articulo: Articulo = {
    ...datos,
    slug,
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };

  await setDoc(doc(db, COLECCION, slug), articulo);
  return slug;
}

export async function actualizarArticulo(
  slug: string,
  cambios: Partial<Omit<Articulo, "slug" | "fechaCreacion">>
): Promise<void> {
  await updateDoc(doc(db, COLECCION, slug), {
    ...cambios,
    fechaActualizacion: new Date().toISOString(),
  });
}

export async function eliminarArticulo(slug: string): Promise<void> {
  await deleteDoc(doc(db, COLECCION, slug));
}

export async function obtenerArticulo(slug: string): Promise<Articulo | null> {
  const snap = await getDoc(doc(db, COLECCION, slug));
  return snap.exists() ? (snap.data() as Articulo) : null;
}

/**
 * Para el admin (ve todo, publicado o no). Se tiene que llamar SIEMPRE
 * desde un componente de cliente ya logueado — la regla de Firestore para
 * ver los borradores exige sesión de admin.
 */
export async function listarTodosLosArticulos(cantidad = 50): Promise<Articulo[]> {
  const q = query(collection(db, COLECCION), orderBy("fechaCreacion", "desc"), limitTo(cantidad));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Articulo);
}

/** Para las páginas públicas — solo trae los publicados, sin necesitar sesión. */
export async function listarArticulosPublicados(cantidad = 20): Promise<Articulo[]> {
  const q = query(
    collection(db, COLECCION),
    where("publicado", "==", true),
    orderBy("fechaCreacion", "desc"),
    limitTo(cantidad)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Articulo);
}
