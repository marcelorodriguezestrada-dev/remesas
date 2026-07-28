"use client";

import { useEffect, useState } from "react";
import type { Cotizacion, Moneda } from "@/lib/pricing";

const MONEDAS: { valor: Moneda; etiqueta: string; simbolo: string }[] = [
  { valor: "USD", etiqueta: "Dólares (USD)", simbolo: "US$" },
  { valor: "ARS", etiqueta: "Pesos argentinos (ARS)", simbolo: "$" },
  { valor: "BOB", etiqueta: "Bolivianos (BOB)", simbolo: "Bs" },
];

function simboloDe(moneda: Moneda): string {
  return MONEDAS.find((m) => m.valor === moneda)?.simbolo ?? "";
}

function formatearMonto(valor: number, moneda: Moneda): string {
  const numero = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
  return `${simboloDe(moneda)} ${numero}`;
}

export default function CotizadorMultiMoneda() {
  const [monedaOrigen, setMonedaOrigen] = useState<Moneda>("USD");
  const [monedaDestino, setMonedaDestino] = useState<Moneda>("ARS");

  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [cargandoCotizacion, setCargandoCotizacion] = useState(true);
  const [errorCotizacion, setErrorCotizacion] = useState<string | null>(null);

  const [montoOrigen, setMontoOrigen] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [destinatarioNombre, setDestinatarioNombre] = useState("");
  const [destinatarioCuenta, setDestinatarioCuenta] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);
  const [operacionConfirmada, setOperacionConfirmada] = useState<{
    montoOrigen: number;
    monedaOrigen: Moneda;
    montoDestino: number;
    monedaDestino: Moneda;
    destinatarioNombre: string;
  } | null>(null);

  const takenosAlias = process.env.NEXT_PUBLIC_TAKENOS_ALIAS;
  const whatsappNumero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO;

  async function cargarCotizacion() {
    setCargandoCotizacion(true);
    setErrorCotizacion(null);
    try {
      const res = await fetch(
        `/api/cotizacion?desde=${monedaOrigen}&hacia=${monedaDestino}`,
        { cache: "no-store" }
      );
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

  // Recarga la cotización cada vez que cambia el par de monedas.
  useEffect(() => {
    void cargarCotizacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monedaOrigen, monedaDestino]);

  function intercambiarMonedas() {
    setMonedaOrigen(monedaDestino);
    setMonedaDestino(monedaOrigen);
  }

  function handleCambiarOrigen(nueva: Moneda) {
    if (nueva === monedaDestino) {
      // Evitamos que quede el mismo par de los dos lados: si elegís la
      // misma moneda que ya estaba del otro lado, las intercambiamos.
      setMonedaDestino(monedaOrigen);
    }
    setMonedaOrigen(nueva);
  }

  function handleCambiarDestino(nueva: Moneda) {
    if (nueva === monedaOrigen) {
      setMonedaOrigen(monedaDestino);
    }
    setMonedaDestino(nueva);
  }

  const montoOrigenNumerico = parseFloat(montoOrigen) || 0;
  const montoDestino =
    cotizacion && montoOrigenNumerico > 0
      ? montoOrigenNumerico * cotizacion.tipoCambioCliente
      : 0;

  const puedeEnviar =
    !cargandoCotizacion &&
    !errorCotizacion &&
    !!cotizacion &&
    montoOrigenNumerico > 0 &&
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
          moneda_origen: monedaOrigen,
          moneda_destino: monedaDestino,
          monto_origen: montoOrigenNumerico,
          monto_destino: montoDestino,
          tipo_cambio_cliente: cotizacion.tipoCambioCliente,
          margen_pct: cotizacion.margenPct,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");

      setOperacionConfirmada({
        montoOrigen: montoOrigenNumerico,
        monedaOrigen,
        montoDestino,
        monedaDestino,
        destinatarioNombre,
      });
      setMontoOrigen("");
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
      `Hola! Quiero enviar ${formatearMonto(
        operacionConfirmada.montoOrigen,
        operacionConfirmada.monedaOrigen
      )} para que le transfieras ${formatearMonto(
        operacionConfirmada.montoDestino,
        operacionConfirmada.monedaDestino
      )} a ${operacionConfirmada.destinatarioNombre}. ¿Por qué medio puedo depositar y dónde querés que vea reflejado el depósito?`
    );

    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-zinc-100">
        <h2 className="mb-6 text-xl font-semibold text-zinc-900">
          Un último paso
        </h2>

        {operacionConfirmada.monedaOrigen === "USD" ? (
          <div className="mb-5 rounded-xl bg-green-50 px-5 py-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-green-700">
                Podés depositar
              </span>
              <span className="text-3xl font-bold text-green-600">
                {formatearMonto(
                  operacionConfirmada.montoOrigen,
                  operacionConfirmada.monedaOrigen
                )}
              </span>
            </div>
            <p className="text-sm text-green-700/80">
              por Takenos (opcional), a este alias:
            </p>
            <p className="rounded-lg bg-white px-4 py-3 text-center text-lg font-semibold text-zinc-900 ring-1 ring-green-200">
              {takenosAlias ?? "(falta configurar el alias de depósito)"}
            </p>
            <p className="text-xs text-green-700/70">
              ¿Preferís otro medio para depositar? No hay problema, seguí
              por WhatsApp abajo y lo coordinamos.
            </p>
          </div>
        ) : (
          <div className="mb-5 rounded-xl bg-zinc-50 px-5 py-4">
            <p className="text-sm text-zinc-600">
              Para depositar en{" "}
              <strong>{operacionConfirmada.monedaOrigen}</strong>, coordinamos
              el medio y la cuenta por WhatsApp — cada caso puede variar.
            </p>
          </div>
        )}

        <p className="mb-5 text-sm text-zinc-600">
          Apenas se confirme el depósito, le transferimos{" "}
          <strong>
            {formatearMonto(
              operacionConfirmada.montoDestino,
              operacionConfirmada.monedaDestino
            )}
          </strong>{" "}
          a {operacionConfirmada.destinatarioNombre}. Escribinos para
          confirmar por qué medio vas a depositar y dónde querés ver el
          depósito reflejado.
        </p>

        {whatsappNumero ? (
          <a
            href={`https://wa.me/${whatsappNumero}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 block w-full rounded-xl bg-green-600 px-4 py-4 text-center text-lg font-semibold text-white transition hover:bg-green-700"
          >
            Continuar por WhatsApp
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
        <h2 className="text-xl font-semibold text-zinc-900">Cotizador</h2>
        <button
          type="button"
          onClick={() => void cargarCotizacion()}
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-5 flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Deposita en
          </label>
          <select
            value={monedaOrigen}
            onChange={(e) => handleCambiarOrigen(e.target.value as Moneda)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            {MONEDAS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={intercambiarMonedas}
          title="Invertir monedas"
          className="mb-1 rounded-xl border border-zinc-200 px-3 py-3 text-lg text-zinc-500 transition hover:bg-zinc-50"
        >
          ⇄
        </button>

        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Recibe en
          </label>
          <select
            value={monedaDestino}
            onChange={(e) => handleCambiarDestino(e.target.value as Moneda)}
            className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          >
            {MONEDAS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargandoCotizacion && (
        <p className="mb-4 text-sm text-zinc-500">Consultando cotización…</p>
      )}

      {errorCotizacion && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorCotizacion}
        </p>
      )}

      {cotizacion && !cargandoCotizacion && (
        <p className="mb-4 text-xs text-zinc-400">
          margen {(cotizacion.margenPct * 100).toFixed(1)}% · blue{" "}
          {new Intl.NumberFormat("es-AR").format(cotizacion.tasas.ARS)} ARS/USD
          · paralelo{" "}
          {new Intl.NumberFormat("es-AR").format(cotizacion.tasas.BOB)}{" "}
          BOB/USD
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label
            htmlFor="monto_origen"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            El cliente deposita ({monedaOrigen})
          </label>
          <input
            id="monto_origen"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={montoOrigen}
            onChange={(e) => setMontoOrigen(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-4 text-2xl font-medium text-zinc-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        <div className="rounded-xl bg-green-50 px-5 py-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-green-700">
              Recibe el destinatario
            </span>
            <span className="text-3xl font-bold text-green-600">
              {formatearMonto(montoDestino, monedaDestino)}
            </span>
          </div>
          {cotizacion && (
            <div className="flex justify-between text-sm text-green-700/80">
              <span>Tipo de cambio</span>
              <span>
                1 {monedaOrigen} ={" "}
                {formatearMonto(cotizacion.tipoCambioCliente, monedaDestino)}
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
            Nombre del destinatario (quien recibe {monedaDestino})
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
            Alias / cuenta del destinatario (opcional)
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
