interface DatosPlantilla {
  arsABob1000: number;
  bobAArs1000: number;
  grupoWhatsapp: string;
}

function num(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export interface PlantillaMarketing {
  id: string;
  etiqueta: string;
  descripcion: string;
  texto: string;
}

export function generarPlantillas(datos: DatosPlantilla): PlantillaMarketing[] {
  const { arsABob1000, bobAArs1000, grupoWhatsapp } = datos;

  return [
    {
      id: "estado_whatsapp",
      etiqueta: "Estado de WhatsApp",
      descripcion: "Corto, para tu estado — la gente lo ve 24hs",
      texto:
        `💱 Cambio pesos ⇄ bolivianos\n` +
        `$1.000 ARS → ${num(arsABob1000)} Bs\n` +
        `1.000 Bs → $${num(bobAArs1000)} ARS\n` +
        `Consultas 👉 ${grupoWhatsapp}`,
    },
    {
      id: "grupo_whatsapp",
      etiqueta: "Mensaje para grupos de WhatsApp",
      descripcion: "Más completo, para reenviar en grupos de la comunidad",
      texto:
        `💱 *Cambio de pesos argentinos y bolivianos*\n\n` +
        `📈 Hoy:\n` +
        `• $1.000 ARS → ${num(arsABob1000)} Bs\n` +
        `• 1.000 Bs → $${num(bobAArs1000)} ARS\n\n` +
        `✅ Rápido y de confianza\n` +
        `📲 Sumate al grupo para cotizar tu monto y consultar dudas:\n` +
        `${grupoWhatsapp}`,
    },
    {
      id: "instagram",
      etiqueta: "Instagram (post o historia)",
      descripcion:
        "Sin link clickeable en el texto — Instagram no lo permite en el caption, poné el link en la bio y escribí \"link en bio\"",
      texto:
        `💱 Tipo de cambio de hoy\n` +
        `🇦🇷 $1.000 ARS = 🇧🇴 ${num(arsABob1000)} Bs\n` +
        `🇧🇴 1.000 Bs = 🇦🇷 $${num(bobAArs1000)} ARS\n\n` +
        `¿Necesitás cambiar? Sumate al grupo (link en bio) 👆\n\n` +
        `#dolar #cambio #argentina #bolivia #remesas`,
    },
    {
      id: "generico",
      etiqueta: "Genérico (Facebook / grupos varios)",
      descripcion: "Para publicar en cualquier otro lado",
      texto:
        `Cambio pesos argentinos y bolivianos, tipo de cambio actualizado todos los días.\n\n` +
        `Hoy: $1.000 ARS = ${num(arsABob1000)} Bs | 1.000 Bs = $${num(bobAArs1000)} ARS\n\n` +
        `Consultas y cotizaciones acá: ${grupoWhatsapp}`,
    },
  ];
}
