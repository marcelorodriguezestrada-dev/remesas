// Google News RSS — feed público, sin auth, sin costo. No hay una sola
// fuente "oficial" de noticias de cada país, así que usamos la búsqueda
// de Google News acotada por país/idioma (parámetros hl/gl/ceid), que
// agrega titulares de muchos medios reales (Ámbito, El Deber, etc.) sin
// tener que mantener una lista de RSS de diarios puntuales que puede
// romperse si cambian de plataforma.

export interface Titular {
  titulo: string;
  link: string;
  fuente: string;
  fecha: string;
}

interface ConfigPais {
  gl: string; // country code
  ceid: string; // edition id, formato "PAIS:idioma"
}

const CONFIG_PAIS: Record<"AR" | "BO", ConfigPais> = {
  AR: { gl: "AR", ceid: "AR:es-419" },
  BO: { gl: "BO", ceid: "BO:es-419" },
};

function extraerEtiqueta(bloque: string, etiqueta: string): string {
  const regex = new RegExp(`<${etiqueta}>([\\s\\S]*?)<\\/${etiqueta}>`, "i");
  const match = bloque.match(regex);
  if (!match) return "";
  return match[1]
    .replace("<![CDATA[", "")
    .replace("]]>", "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export async function getTitulares(
  pais: "AR" | "BO",
  consulta: string,
  cantidad = 6
): Promise<Titular[]> {
  const { gl, ceid } = CONFIG_PAIS[pais];
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=es-419&gl=${gl}&ceid=${ceid}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; remesas-app/1.0)" },
    next: { revalidate: 900 }, // 15 minutos, las noticias no cambian tan rápido como el dólar
  });

  if (!res.ok) {
    throw new Error(`Google News respondió ${res.status} para ${pais}`);
  }

  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(
    0,
    cantidad
  );

  return items.map((m) => {
    const bloque = m[1];
    const tituloCompleto = extraerEtiqueta(bloque, "title");
    // Google News suele poner "Título - Fuente" en el title; separamos.
    const partido = tituloCompleto.split(" - ");
    const fuente =
      partido.length > 1 ? partido[partido.length - 1] : "Google News";
    const titulo =
      partido.length > 1
        ? partido.slice(0, -1).join(" - ")
        : tituloCompleto;

    return {
      titulo,
      link: extraerEtiqueta(bloque, "link"),
      fuente,
      fecha: extraerEtiqueta(bloque, "pubDate"),
    };
  });
}
