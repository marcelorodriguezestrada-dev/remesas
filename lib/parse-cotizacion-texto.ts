// Extrae un par Compra/Venta de un texto libre, sea que venga de un
// mensaje de WhatsApp pegado a mano o de un canal de Telegram scrapeado.
// Formatos que reconoce (los más comunes que usan casas de cambio):
//   "Compra: 11.66 | Venta: 11.86"
//   "Compra 11,66 Venta 11,86"
//   "Pesos a Bs 8,93" (un solo número, sin par compra/venta)

export interface CompraVentaExtraido {
  compra: number | null;
  venta: number | null;
}

function aNumero(texto: string): number {
  // Soporta tanto "11.66" como "11,66" (coma decimal).
  return parseFloat(texto.replace(",", "."));
}

export function extraerCompraVenta(texto: string): CompraVentaExtraido {
  const regexParCompleto =
    /compra[:\s]*([\d]+[.,]?[\d]*)[\s|]*venta[:\s]*([\d]+[.,]?[\d]*)/i;
  const matchPar = texto.match(regexParCompleto);
  if (matchPar) {
    return {
      compra: aNumero(matchPar[1]),
      venta: aNumero(matchPar[2]),
    };
  }

  // Si no hay un par "compra/venta", buscamos un solo número suelto
  // (ej. "Pesos a Bs 8,93") — lo usamos como venta, ya que normalmente
  // ese es el precio al que te ofrecen vender.
  const regexNumeroSuelto = /(\d+[.,]\d+)/;
  const matchSuelto = texto.match(regexNumeroSuelto);
  if (matchSuelto) {
    return { compra: null, venta: aNumero(matchSuelto[1]) };
  }

  return { compra: null, venta: null };
}
