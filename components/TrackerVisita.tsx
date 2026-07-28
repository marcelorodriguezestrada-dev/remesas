"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { registrarVisita } from "@/lib/visitas";

const CLAVE_SESSION = "utm_datos";
const CLAVE_YA_REGISTRADA = "visita_registrada";

/** Guarda los UTM de esta sesión de navegador (si vinieron en la URL) para
 * poder atribuir después la operación que se genere a esa campaña. */
function guardarUtmEnSesion(params: URLSearchParams) {
  const utm = {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
  };
  if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
    sessionStorage.setItem(CLAVE_SESSION, JSON.stringify(utm));
  }
}

export function obtenerUtmDeSesion() {
  if (typeof window === "undefined") return {};
  const guardado = sessionStorage.getItem(CLAVE_SESSION);
  return guardado ? JSON.parse(guardado) : {};
}

export default function TrackerVisita() {
  const searchParams = useSearchParams();

  useEffect(() => {
    guardarUtmEnSesion(searchParams);

    // Solo registramos una visita por pestaña/sesión — recargar la
    // página o cambiar de moneda no debería contar como visitas nuevas.
    if (sessionStorage.getItem(CLAVE_YA_REGISTRADA)) return;
    sessionStorage.setItem(CLAVE_YA_REGISTRADA, "1");

    const utm = obtenerUtmDeSesion();
    registrarVisita(utm).catch((err) =>
      console.error("No se pudo registrar la visita:", err)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
