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

## Multi-moneda: ARS ⇄ USD ⇄ BOB

El cotizador ya no es fijo USD→ARS. Ahora el cliente elige "Deposita en" y
"Recibe en" entre USD, ARS y BOB, en cualquier combinación (incluyendo
ARS↔BOB directo). El cálculo pivotea siempre por USD: se convierte el
monto de origen a un "equivalente en dólares" usando el blue (ARS) o el
paralelo vía USDT (BOB, fuente: CriptoYa), y de ahí a la moneda destino.
El margen se aplica una sola vez sobre el cruce final, no dos veces.

Cambios de nombres a tener en cuenta si tocás el código:
- `lib/criptoya.ts` — nueva fuente para el paralelo de Bolivia
- `lib/pricing.ts` — ahora trabaja con `Moneda = "USD" | "ARS" | "BOB"` en
  vez de campos fijos `ventaBlue`/`usdAArs`
- En Firestore, los campos de cada operación pasaron de
  `monto_usd`/`monto_ars`/`venta_blue_referencia` a
  `monto_origen`/`monto_destino`/`moneda_origen`/`moneda_destino` — las
  operaciones viejas que ya hayas cargado con el esquema anterior van a
  quedar con el formato viejo, no se migran automáticamente
- El estado `usd_recibido` pasó a llamarse `origen_recibido` (más genérico)

## Login de admin + competencia + ganancias

`/admin` ahora requiere estar logueado. Pasos para habilitarlo:

1. **Firebase Console → Authentication → Sign-in method** → activá el
   proveedor **"Email/Password"**.
2. **Authentication → Users → Add user** → creá tu usuario admin (tu email
   y una contraseña). Este es el único login que va a existir — no hay
   registro público, el usuario se crea a mano en la consola.
3. **Firestore Database → Reglas** → reemplazá el contenido por el de
   `firestore.rules` (cambió: ahora separa permisos de creación pública
   vs. lectura/edición solo autenticada) → Publicar.
4. Entrá a `/login` con ese email y contraseña, te redirige a `/admin`.

**Cambio de arquitectura importante:** el panel de `/admin` ahora habla
directo con Firestore desde el navegador (usando la sesión del usuario
logueado), en vez de pasar por `/api/operaciones`. Es necesario para que
las reglas de seguridad por autenticación funcionen — un endpoint de
Next.js corriendo en el servidor no tiene forma de "heredar" tu sesión de
Firebase Auth del navegador. El único endpoint público que sigue
existiendo es el `POST /api/operaciones` que usa el cotizador para crear
solicitudes (eso sí necesita ser público, lo usa cualquier cliente sin
loguearse).

**Competencia** (`/admin/competencia`): cargás a mano el precio que viste
ofrecer a un competidor (nombre, par de monedas, tasa), y el panel lo
compara automáticamente contra tu tasa actual para ese par, mostrando el
% de diferencia. No hay forma de traer esto automático — no existe una
API pública de precios de casas de cambio informales, así que por ahora es
carga manual cada vez que veas un precio en algún grupo o canal.

**Ganancia real**: arriba de la lista de pendientes en `/admin` aparece un
resumen de la ganancia acumulada de las operaciones ya marcadas como
`pagado`, agrupada por moneda de destino. Se calcula a partir del margen
guardado en cada operación, no hace falta ninguna tabla extra.

## Lo que falta (a propósito)

- **Seguridad real**: las reglas de Firestore hoy son `allow read, write: if
  true` — cualquiera con tu config de Firebase (que queda visible en el
  navegador, es normal en apps web) puede leer y escribir operaciones. Para
  probar vos solo está bien. Antes de mandarle el link a un cliente,
  agregá Firebase Auth y restringí las reglas a un usuario autenticado.
- Pantalla para cambiar el estado de una operación (`pending` →
  `usd_recibido` → `pagado`) — el helper `actualizarEstado` en
  `lib/operaciones.ts` ya está, falta la vista.
