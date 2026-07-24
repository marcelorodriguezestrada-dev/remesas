"use client";

import { useEffect, useState } from "react";
import type { Cotizacion } from "@/lib/pricing";

function formatearARS(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatearUSD(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function CotizadorUsdArs() {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cargandoCotizacion, setCargandoCotizacion] = useState(true);
  const [errorCotizacion, setErrorCotizacion] = useState<string | null>(null);

  const [montoUsd, setMontoUsd] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [destinatarioNombre, setDestinatarioNombre] = useState("");
  const [destinatarioCuenta, setDestinatarioCuenta] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);
  const [operacionConfirmada, setOperacionConfirmada] = useState<{
    montoUsd: number;
    montoArs: number;
    destinatarioNombre: string;
  } | null>(null);

  const takenosAlias = process.env.NEXT_PUBLIC_TAKENOS_ALIAS;
  const whatsappNumero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO;

  async function cargarCotizacion() {
    setCargandoCotizacion(true);
    setErrorCotizacion(null);
    try {
      const res = await fetch("/api/cotizacion", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setCotizacion(data as Cotizacion);
    } catch (err) {
      setErrorCotizacion(
        err instanceof Error ? err.message : "No se pudo cargar la cotización"
      );
    } finally {
      setCargandoCotizacion(false);
    }
  }

  useEffect(() => {
    void cargarCotizacion();
  }, []);

  const montoUsdNumerico = parseFloat(montoUsd) || 0;
  const montoArs =
    cotizacion && montoUsdNumerico > 0
      ? montoUsdNumerico * cotizacion.tipoCambioCliente
      : 0;

  const puedeEnviar =
    !cargandoCotizacion &&
    !errorCotizacion &&
    !!cotizacion &&
    montoUsdNumerico > 0 &&
    clienteNombre.trim().length > 0 &&
    destinatarioNombre.trim().length > 0;

  async function handleRegistrarOperacion() {
    if (!puedeEnviar || !cotizacion) return;

    setEnviando(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/operaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: clienteNombre,
          destinatario_nombre: destinatarioNombre,
          destinatario_cuenta: destinatarioCuenta || undefined,
          monto_usd: montoUsdNumerico,
          monto_ars: montoArs,
          venta_blue_referencia: cotizacion.ventaBlue,
          tipo_cambio_cliente: cotizacion.tipoCambioCliente,
          margen_pct: cotizacion.margenPct,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");

      setOperacionConfirmada({
        montoUsd: montoUsdNumerico,
        montoArs,
        destinatarioNombre,
      });
      setMontoUsd("");
      setClienteNombre("");
      setDestinatarioNombre("");
      setDestinatarioCuenta("");
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err instanceof Error ? err.message : "No se pudo registrar",
      });
    } finally {
      setEnviando(false);
    }
  }

  if (operacionConfirmada) {
    const mensajeWhatsapp = encodeURIComponent(
      `Hola! Ya deposité ${formatearUSD(
        operacionConfirmada.montoUsd
      )} en Takenos para que le transfieras ${formatearARS(
        operacionConfirmada.montoArs
      )} a ${operacionConfirmada.destinatarioNombre}.`
    );

    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900">
          Un último paso
        </h2>

        <div className="mb-5 rounded-xl bg-green-50 px-5 py-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-green-700">Depositá</span>
            <span className="text-3xl font-bold text-green-600">
              {formatearUSD(operacionConfirmada.montoUsd)}
            </span>
          </div>
          <p className="text-sm text-green-700/80">
            en Takenos, a este alias:
          </p>
          <p className="rounded-lg bg-white px-4 py-3 text-center text-lg font-semibold text-zinc-900 ring-1 ring-green-200">
            {takenosAlias ?? "(falta configurar el alias de Takenos)"}
          </p>
        </div>

        <p className="mb-5 text-sm text-zinc-600">
          Apenas veamos el depósito, le transferimos{" "}
          <strong>{formatearARS(operacionConfirmada.montoArs)}</strong> a{" "}
          {operacionConfirmada.destinatarioNombre}. Para que sea más rápido,
          avisanos por WhatsApp cuando ya hayas depositado.
        </p>

        {whatsappNumero ? (
          <a
            href={`https://wa.me/${whatsappNumero}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 block w-full rounded-xl bg-green-600 px-4 py-4 text-center text-lg font-semibold text-white transition hover:bg-green-700"
          >
            Avisar por WhatsApp
          </a>
        ) : (
          <p className="mb-3 text-sm text-red-600">
            Falta configurar NEXT_PUBLIC_WHATSAPP_NUMERO para mostrar este
            botón.
          </p>
        )}

        <button
          type="button"
          onClick={() => setOperacionConfirmada(null)}
          className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          Hacer otra operación
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">
          Cotizador USD → ARS
        </h2>
        <button
          type="button"
          onClick={() => void cargarCotizacion()}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Actualizar
        </button>
      </div>

      {cargandoCotizacion && (
        <p className="mb-4 text-sm text-zinc-500">Consultando el blue…</p>
      )}

      {errorCotizacion && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorCotizacion}
        </p>
      )}

      {cotizacion && !cargandoCotizacion && (
        <p className="mb-4 text-xs text-zinc-400">
          Blue venta: {formatearARS(cotizacion.ventaBlue)} · margen{" "}
          {(cotizacion.margenPct * 100).toFixed(1)}% · actualizado{" "}
          {new Date(cotizacion.fechaActualizacion).toLocaleString("es-AR")}
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label
            htmlFor="monto_usd"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            El cliente deposita (USD)
          </label>
          <input
            id="monto_usd"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={montoUsd}
            onChange={(e) => setMontoUsd(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-4 text-2xl font-medium text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div className="rounded-xl bg-green-50 px-5 py-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-green-700">
              Recibe el destinatario
            </span>
            <span className="text-3xl font-bold text-green-600">
              {formatearARS(montoArs)}
            </span>
          </div>
          {cotizacion && (
            <div className="flex justify-between text-sm text-green-700/80">
              <span>Tipo de cambio</span>
              <span>
                1 USD = {formatearARS(cotizacion.tipoCambioCliente)}
              </span>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="cliente_nombre"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Nombre del cliente (quien deposita)
          </label>
          <input
            id="cliente_nombre"
            type="text"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="destinatario_nombre"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Nombre del destinatario (quien recibe ARS)
          </label>
          <input
            id="destinatario_nombre"
            type="text"
            value={destinatarioNombre}
            onChange={(e) => setDestinatarioNombre(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="destinatario_cuenta"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Alias / CBU del destinatario (opcional)
          </label>
          <input
            id="destinatario_cuenta"
            type="text"
            value={destinatarioCuenta}
            onChange={(e) => setDestinatarioCuenta(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        {mensaje && (
          <p
            className={`rounded-lg px-4 py-3 text-sm ${
              mensaje.tipo === "ok"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleRegistrarOperacion()}
          disabled={!puedeEnviar || enviando}
          className="w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {enviando ? "Confirmando…" : "Confirmar y ver dónde depositar"}
        </button>
      </div>
    </div>
  );
}
