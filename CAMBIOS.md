# Cambios: modelo USD → ARS con blue en vivo (sobre Firebase/Firestore)

## Qué se agregó

- `lib/dolarapi.ts` — consulta el blue en tiempo real (DolarAPI, gratis, sin auth)
- `lib/pricing.ts` — calcula el tipo de cambio que le reconocés al cliente (blue - margen)
- `app/api/cotizacion/route.ts` — endpoint que expone esa cotización al frontend
- `lib/firebase.ts` — inicializa Firestore
- `lib/operaciones.ts` + `app/api/operaciones/route.ts` — registran cada operación en Firestore
- `firestore.rules` — reglas de seguridad (abiertas para esta etapa de prueba, ver nota adentro)
- `components/CotizadorUsdArs.tsx` — el cotizador USD → ARS
- `app/page.tsx` — renderiza el cotizador

Se sacó todo lo de Supabase (`lib/supabase.ts`, el `Cotizador.tsx` viejo de
ARS→BOB/PEN/CLP que dependía de él) para no dejar código muerto que rompa el
build por una dependencia que ya no vas a instalar.

## Pasos para probarlo

1. **Creá el proyecto en Firebase**: https://console.firebase.google.com →
   "Agregar proyecto" → nombre (ej. `remesas`) → podés desactivar Google
   Analytics, no lo necesitás para esto.
2. **Habilitá Firestore**: en el menú lateral, Firestore Database → "Crear
   base de datos" → modo producción → elegí la región más cercana
   (`southamerica-east1` es San Pablo, la más cercana a Argentina).
3. **Publicá las reglas**: pegá el contenido de `firestore.rules` en
   Firestore Database → Reglas, y publicá.
4. **Registrá una app web**: Project Settings (el engranaje) → "Tus apps" →
   ícono `</>` (web) → nombrala → copiá el objeto `firebaseConfig` que te
   muestra, esos son los valores que van en `.env.local`.
5. Copiá `.env.example` a `.env.local` y completá con esos valores.
6. `npm install` (ahora instala `firebase` en vez de `@supabase/supabase-js`)
7. `npm run dev` y probá en `http://localhost:3000`.

## Una cosa a tener en cuenta la primera vez

La consulta de `listarOperacionesPendientes` combina un filtro `where` con
un `orderBy` en un campo distinto — Firestore va a pedir un índice
compuesto la primera vez que se ejecute. Cuando eso pase, la consola del
navegador te va a tirar un error con un link directo para crearlo con un
clic; no es un bug, es esperable.

## El cotizador ahora es de cara al cliente

Antes el formulario solo registraba la operación y mostraba un texto. Ahora,
al confirmar, el cliente ve una pantalla con:
- El monto exacto en USD a depositar
- Tu alias de Takenos (`NEXT_PUBLIC_TAKENOS_ALIAS` en `.env.local`)
- Un botón directo a WhatsApp (`NEXT_PUBLIC_WHATSAPP_NUMERO`) con un mensaje
  pre-armado avisándote que ya depositó

Completá esas dos variables en `.env.local` antes de probarlo, si no están
vacías esas partes de la pantalla.

## Panel para vos: /admin

En `/admin` ves todas las operaciones en `pending` o `usd_recibido`, con
botones para avanzar el estado (`Marcar USD recibido` → `Marcar pagado`) o
cancelar. Al marcar `pagado` o `cancelado` la operación desaparece de esta
lista (pero el registro queda en Firestore para siempre, no se borra).

**Importante:** `/admin` hoy no tiene ningún tipo de login — es una URL
más de tu sitio, cualquiera que la adivine puede ver y modificar tus
operaciones (mismo problema que ya señalamos en `firestore.rules`). Sirve
para que vos lo uses mientras probás; antes de que esto sea un negocio real
con plata de terceros, esto necesita autenticación de verdad.

## Lo que falta (a propósito)

- **Seguridad real**: las reglas de Firestore hoy son `allow read, write: if
  true` — cualquiera con tu config de Firebase (que queda visible en el
  navegador, es normal en apps web) puede leer y escribir operaciones. Para
  probar vos solo está bien. Antes de mandarle el link a un cliente,
  agregá Firebase Auth y restringí las reglas a un usuario autenticado.
- Pantalla para cambiar el estado de una operación (`pending` →
  `usd_recibido` → `pagado`) — el helper `actualizarEstado` en
  `lib/operaciones.ts` ya está, falta la vista.
