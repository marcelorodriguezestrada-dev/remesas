"use client";

import { useState } from "react";

export default function BotonesCompartir({
  url,
  titulo,
}: {
  url: string;
  titulo: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const textoWhatsapp = encodeURIComponent(`${titulo}\n${url}`);
  const urlWhatsapp = `https://wa.me/?text=${textoWhatsapp}`;
  const urlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-6">
      <span className="mr-1 text-xs text-zinc-400">Compartir:</span>
      <button
        type="button"
        onClick={() => void copiarLink()}
        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
      >
        {copiado ? "¡Copiado! ✓" : "🔗 Copiar link"}
      </button>
      <a
        href={urlWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        💬 WhatsApp
      </a>
      <a
        href={urlFacebook}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
      >
        📘 Facebook
      </a>
    </div>
  );
}
