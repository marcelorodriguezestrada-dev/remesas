interface DatosPlantilla {
  arsABob1000: number;
  bobAArs1000: number;
  usdtAArs: number;
  usdtABob: number;
  grupoWhatsapp: string;
  siteUrl: string;
}

function num(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function fechaHoraActual(): string {
  return new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export interface PlantillaMarketing {
  id: string;
  etiqueta: string;
  descripcion: string;
  texto: string;
}

export function generarPlantillas(datos: DatosPlantilla): PlantillaMarketing[] {
  const { arsABob1000, bobAArs1000, usdtAArs, usdtABob, grupoWhatsapp, siteUrl } =
    datos;
  const fechaHora = fechaHoraActual();

  return [
    {
      id: "estado_whatsapp",
      etiqueta: "Estado de WhatsApp",
      descripcion: "Corto, para tu estado — la gente lo ve 24hs",
      texto:
        `💱 Cambio pesos ⇄ bolivianos — ${fechaHora}\n` +
        `$1.000 ARS → ${num(arsABob1000)} Bs\n` +
        `1.000 Bs → $${num(bobAArs1000)} ARS\n` +
        `🪙 También en USDT (cripto)\n` +
        `Cotizá tu monto: ${siteUrl}\n` +
        `Consultas 👉 ${grupoWhatsapp}`,
    },
    {
      id: "grupo_whatsapp",
      etiqueta: "Mensaje para grupos de WhatsApp",
      descripcion: "Más completo, para reenviar en grupos de la comunidad",
      texto:
        `💱 *Cambio de pesos argentinos y bolivianos*\n` +
        `🕐 Actualizado: ${fechaHora}\n\n` +
        `📈 Hoy:\n` +
        `• $1.000 ARS → ${num(arsABob1000)} Bs\n` +
        `• 1.000 Bs → $${num(bobAArs1000)} ARS\n\n` +
        `🪙 También aceptamos depósitos en USDT (cripto)\n\n` +
        `✅ Rápido y de confianza\n` +
        `🌐 Cotizá tu monto exacto acá: ${siteUrl}\n` +
        `📲 Sumate al grupo para consultar dudas:\n` +
        `${grupoWhatsapp}`,
    },
    {
      id: "instagram",
      etiqueta: "Instagram (post o historia)",
      descripcion:
        "Sin link clickeable en el texto — Instagram no lo permite en el caption, poné el link en la bio y escribí \"link en bio\"",
      texto:
        `💱 Tipo de cambio de hoy — ${fechaHora}\n` +
        `🇦🇷 $1.000 ARS = 🇧🇴 ${num(arsABob1000)} Bs\n` +
        `🇧🇴 1.000 Bs = 🇦🇷 $${num(bobAArs1000)} ARS\n` +
        `🪙 También en USDT\n\n` +
        `¿Necesitás cambiar? Cotizá tu monto y sumate al grupo (link en bio) 👆\n\n` +
        `#dolar #cambio #argentina #bolivia #remesas #usdt #cripto`,
    },
    {
      id: "generico",
      etiqueta: "Genérico (Facebook / grupos varios)",
      descripcion: "Para publicar en cualquier otro lado",
      texto:
        `Cambio pesos argentinos y bolivianos, tipo de cambio actualizado todos los días.\n` +
        `También aceptamos depósitos en USDT (cripto).\n` +
        `Actualizado: ${fechaHora}\n\n` +
        `Hoy: $1.000 ARS = ${num(arsABob1000)} Bs | 1.000 Bs = $${num(bobAArs1000)} ARS\n\n` +
        `Cotizá tu monto acá: ${siteUrl}\n` +
        `Consultas: ${grupoWhatsapp}`,
    },
    {
      id: "cripto_usdt",
      etiqueta: "Grupos de cripto (USDT)",
      descripcion: "Para comunidades cripto/Telegram — el foco es USDT, no efectivo",
      texto:
        `🪙 *Cambio USDT ⇄ ARS / BOB*\n` +
        `🕐 Actualizado: ${fechaHora}\n\n` +
        `• 1 USDT = $${num(usdtAArs)} ARS\n` +
        `• 1 USDT = ${num(usdtABob)} Bs\n\n` +
        `✅ Depósito directo a wallet, sin intermediarios\n` +
        `🌐 Cotizá tu monto: ${siteUrl}\n` +
        `📲 Consultas: ${grupoWhatsapp}`,
    },
  ];
}
