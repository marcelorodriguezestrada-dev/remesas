"use client";

import { useEffect } from "react";
import { registrarVistaArticulo } from "@/lib/vistas-articulos";

export default function TrackerVistaArticulo({ slug }: { slug: string }) {
  useEffect(() => {
    const clave = `vista_articulo:${slug}`;
    // Una vista por artículo por pestaña/sesión — recargar la página no
    // debería sumar de nuevo.
    if (sessionStorage.getItem(clave)) return;
    sessionStorage.setItem(clave, "1");

    registrarVistaArticulo(slug).catch((err) =>
      console.error("No se pudo registrar la vista del artículo:", err)
    );
  }, [slug]);

  return null;
}
