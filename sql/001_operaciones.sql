-- Corré esto en el SQL Editor de Supabase.
-- Guarda cada operación: quién paga, quién cobra, a qué tipo de cambio,
-- y en qué estado está. Es lo mínimo para poder auditar después "quién me
-- debe" y "a quién le debo" cuando el volumen crezca más allá de lo que
-- podés llevar de memoria por WhatsApp.

create table if not exists operaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- datos del cliente (quien deposita USD)
  cliente_nombre text not null,
  cliente_contacto text, -- teléfono / whatsapp

  -- datos del destinatario (quien recibe ARS)
  destinatario_nombre text not null,
  destinatario_cuenta text, -- alias/CBU/CVU

  -- montos y tipo de cambio aplicado en el momento de la operación
  monto_usd numeric(12, 2) not null check (monto_usd > 0),
  monto_ars numeric(14, 2) not null check (monto_ars > 0),
  venta_blue_referencia numeric(10, 2) not null,
  tipo_cambio_cliente numeric(10, 2) not null,
  margen_pct numeric(5, 4) not null,

  -- estado operativo: pending = cliente todavía no depositó,
  -- usd_recibido = ya acreditó en Takenos, pagado = ya le pagaste al destinatario,
  -- cancelado = no se concretó
  estado text not null default 'pending'
    check (estado in ('pending', 'usd_recibido', 'pagado', 'cancelado')),

  notas text
);

create index if not exists idx_operaciones_estado on operaciones (estado);
create index if not exists idx_operaciones_created_at on operaciones (created_at desc);
