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

## Traer precios de competencia automáticamente (con límites)

En `/admin/competencia` sumé dos atajos:

- **Canales públicos de Telegram**: poniendo el `@usuario` del canal, lee
  el último mensaje público (vía `t.me/s/{canal}`, la misma vista sin
  login que se ve en el navegador) e intenta extraer un precio tipo
  "Compra: X | Venta: Y". Solo funciona con canales **públicos** — no hay
  forma de leer grupos privados sin ser miembro.
- **Pegado rápido de WhatsApp**: NO hay forma de conectarse automáticamente
  a un grupo de WhatsApp — no existe una API pública para eso, y las
  formas no oficiales (loguearse como si fuera tu WhatsApp Web desde un
  bot) violan los términos de uso de WhatsApp y pueden terminar en que te
  bloqueen el número. En cambio, dejé un campo para pegar el texto del
  mensaje tal cual lo copiaste del grupo, y el mismo parser que usa
  Telegram le saca el número — no hay que tipearlo a mano, pero sí hay que
  copiarlo y pegarlo vos.

En ambos casos el dato **no se guarda solo**: se precarga en el formulario
para que lo revises (o corrijas) antes de guardar. Es a propósito — un
scraper mal interpretado guardando datos falsos sin que nadie los mire es
peor que no tener el dato.

## Dashboard admin: noticias + histórico + gráfico

Nueva sección en `/admin/dashboard` (link en la barra de arriba del panel):

- **Noticias**: titulares recientes sobre el dólar en Argentina y Bolivia,
  vía RSS de búsqueda de Google News (`news.google.com/rss/search`), filtrado
  por país con los parámetros `hl`/`gl`/`ceid`. No es una fuente única —
  agrega de muchos medios reales, así que no depende de que un diario en
  particular no cambie su URL de RSS. Los links abren en el medio original.
- **Histórico propio**: desde ahora, cada vez que alguien consulta
  `/api/tasas` (lo pega el tablero público de `/tipo-cambio`), se guarda
  una foto de esa hora en Firestore (`historial_tasas`, un documento por
  hora, se pisa si hay varias consultas en la misma hora). No hay
  histórico de antes de hoy — no existe una fuente gratuita de eso — pero
  a partir de ahora se va acumulando solo.
- **Gráfico**: dos gráficos de líneas (con `recharts`, ya lo agregué a
  `package.json` — necesita `npm install` para bajar la dependencia). El
  primero compara el blue argentino contra el paralelo boliviano; el
  segundo muestra la evolución de tu propio tipo de cambio ofrecido
  ARS→BOB y BOB→ARS. Va a aparecer vacío/con el mensaje "todavía no hay
  histórico" hasta que pasen un par de horas y se acumulen algunas fotos.

## Marketing: fecha/hora + link del sitio

Los 4 textos de `/admin/marketing` ahora incluyen la fecha y hora de
generación, y el link a tu sitio (`NEXT_PUBLIC_SITE_URL`, agregala a tu
`.env.local` y a Render). Ojo: como son textos que se copian y pegan, la
fecha/hora queda "congelada" en el momento que copiaste — si publicás el
texto un rato después, va a decir la hora en que lo generaste, no la hora
real de publicación. Es lo esperable dado que son textos estáticos.

## Cotizador: Takenos pasa a ser sugerencia, no obligación

Antes la pantalla de confirmación asumía que el depósito iba sí o sí por
Takenos y que ya estaba hecho. Ahora:
- Si el origen es USD, se muestra el alias de Takenos marcado como
  **opcional**, con una aclaración de que si prefiere otro medio puede
  seguir por WhatsApp.
- Si el origen no es USD (ARS o BOB), directamente no se asume ningún
  medio — se indica que se coordina por WhatsApp.
- El mensaje de WhatsApp ya no da por hecho que el cliente depositó — ahora
  pregunta por qué medio puede depositar y dónde quiere ver el depósito
  reflejado, para que la conversación real defina eso, no la app.

## Funnel: visitas por UTM → cotizaron → pagaron

Nueva sección `/admin/funnel`. Cómo funciona:

- Cada visita a la página pública (`/`) se registra en Firestore
  (`visitas`), guardando `utm_source`/`utm_medium`/`utm_campaign` si el
  link tenía esos parámetros (ej.
  `tusitio.com/?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento`).
  Se cuenta **una visita por pestaña/sesión** (no una por cada recarga o
  cambio de moneda en el cotizador).
- El UTM de esa sesión queda guardado en `sessionStorage` del navegador, y
  si esa misma persona termina generando una operación, la operación queda
  etiquetada con el mismo UTM — así se puede cruzar "cuántos entraron por
  Instagram" vs. "cuántos de esos efectivamente cotizaron y pagaron".
- El panel muestra el embudo completo (visitas → cotizaron → pagaron, con
  el % de conversión en cada paso) y el mismo desglose por canal.

**Para usarlo**: cuando compartas el link en Instagram, WhatsApp, etc.,
agregale los parámetros UTM correspondientes. Si compartís el link pelado
(sin UTM), esas visitas van a agruparse como "(directo / sin UTM)" — no es
un error, es tráfico sin campaña identificada.

**Limitación real**: esto NO es Google Analytics — no distingue visitantes
únicos que vuelven en otra sesión/dispositivo, y si alguien borra el
`sessionStorage` o usa incógnito, cuenta como visita nueva. Para lo que
necesitás (medir de dónde viene la gente que efectivamente cotiza) alcanza,
pero no reemplaza una herramienta de analytics completa si más adelante
necesitás algo más fino.

## USDT (cripto) como moneda de depósito

Ahora `USDT` es una cuarta moneda en el cotizador, además de USD/ARS/BOB.

**Por qué el precio de USDT no es el mismo que el de USD**: para Bolivia
ya veníamos usando el precio de USDT/BOB (vía CriptoYa) como referencia
del "paralelo" — o sea que para BOB no cambia nada, USD y USDT comparten
la misma fuente. Para Argentina, en cambio, el USD normal usa el blue
(mercado en efectivo) y ahora agregué una fuente aparte para USDT/ARS
(también CriptoYa, mismo estilo que USDT/BOB) — porque el dólar cripto y
el blue son mercados distintos y pueden tener precios distintos. Todo
esto vive en `lib/pricing.ts`, en la función `tablaHub`.

**Variables de entorno nuevas** (agregalas a `.env.local` y a Render):
```
NEXT_PUBLIC_WALLET_USDT=tu-direccion-de-wallet
NEXT_PUBLIC_RED_USDT=TRC20
```

**Sobre la seguridad de esto — importante**: si un cliente deposita USDT
por una red distinta a la que configuraste (ej. tu wallet es TRC20 y te
mandan por ERC20), **el dinero se puede perder sin ninguna forma de
recuperarlo**. La pantalla de confirmación ya muestra un aviso en
naranja sobre esto, pero es tu responsabilidad:
- Confirmar que la wallet que pusiste en `NEXT_PUBLIC_WALLET_USDT`
  soporta la red que declaraste en `NEXT_PUBLIC_RED_USDT`
- Si tenés dudas sobre cómo verificar esto en tu wallet/exchange, es buen
  momento para chequearlo antes de recibir el primer depósito real, no
  después

## Lo que falta (a propósito)

- **Seguridad real**: las reglas de Firestore hoy son `allow read, write: if
  true` — cualquiera con tu config de Firebase (que queda visible en el
  navegador, es normal en apps web) puede leer y escribir operaciones. Para
  probar vos solo está bien. Antes de mandarle el link a un cliente,
  agregá Firebase Auth y restringí las reglas a un usuario autenticado.
- Pantalla para cambiar el estado de una operación (`pending` →
  `usd_recibido` → `pagado`) — el helper `actualizarEstado` en
  `lib/operaciones.ts` ya está, falta la vista.
