# Deploy en Render

## 1. Crear el servicio

En el dashboard de Render: **New → Web Service** → conectá el repo `remesas`
de GitHub. Render va a detectar el `Dockerfile` automáticamente (elegí
"Docker" como Runtime si no lo detecta solo).

- **Plan**: Free
- **Region**: la más cercana (Oregon si no hay opción de Sudamérica)

## 2. Variables de entorno

Antes del primer deploy, en la pestaña **Environment** del servicio, cargá
las mismas 9 variables que ya tenías en Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_TAKENOS_ALIAS
NEXT_PUBLIC_WHATSAPP_NUMERO
MARGEN_PORCENTAJE_DEFAULT
```

Importante (distinto a Vercel): como esto corre en Docker, las variables
`NEXT_PUBLIC_*` tienen que llegar como **build args**, no solo como
variables de runtime. Render las pasa automáticamente al build de Docker
si están cargadas en Environment y el `Dockerfile` las declara con `ARG`
(ya lo dejé armado así en el `Dockerfile` — no hace falta que hagas nada
extra, solo cargar los valores en el dashboard).

## 3. Deploy

Con las variables cargadas, "Create Web Service" dispara el primer build.
Render te va a mostrar el log del `docker build` en vivo (va a tardar más
que Vercel la primera vez, 3-5 minutos, porque compila todo desde cero).

Al terminar te da una URL fija tipo `remesas.onrender.com` — esa no cambia
entre deploys, a diferencia de los hashes que veías en Vercel.

## 4. Si algo falla

- **Build falla con error de TypeScript**: mismo tipo de error que ya
  vimos antes, revisá que no haya quedado ningún archivo viejo con
  imports rotos.
- **La app levanta pero el cotizador no trae el blue**: revisá que las 6
  variables de Firebase estén bien cargadas — un error ahí no rompe el
  build, pero sí el login a Firestore en runtime.
- **Se queda "dormido"**: el plan free de Render duerme el servicio tras
  15 minutos sin tráfico, y el primer request después tarda ~30-50
  segundos en "despertar". Es esperable en el plan free, no es un bug.
