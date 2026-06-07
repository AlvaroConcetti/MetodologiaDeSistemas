-- ============================================================
--  BASE DE DATOS COMPLETA - Body Paint MVP (Supabase / PostgreSQL)
--  Ejecutar en: Supabase -> SQL Editor -> New query -> Run
--  Es seguro re-ejecutarlo: crea lo que falta y no rompe lo existente.
-- ============================================================

-- 1) TABLAS (se crean solo si no existen)
create table if not exists clientes (
    id        bigint generated always as identity primary key,
    nombre    text not null,
    email     text not null unique,
    pais      text,
    provincia text,
    localidad text,
    calle     text,
    numero    integer,
    rol       text not null default 'cliente'
);

create table if not exists productos (
    id      bigint generated always as identity primary key,
    nombre  text not null,
    precio  numeric not null,
    stock   integer not null default 0,
    imagen  text
);

create table if not exists pedidos (
    id                  bigint generated always as identity primary key,
    cliente_id          bigint references clientes(id),
    total               numeric not null,
    metodo_pago         text,
    direccion_envio     text,
    estado              text default 'sin confirmar',
    items               jsonb,
    motivo_cancelacion  text,
    cupon_codigo        text,
    descuento           numeric default 0,
    creado_en           timestamptz default now()
);

create table if not exists cupones (
    id            bigint generated always as identity primary key,
    codigo        text not null unique,
    descuento     numeric not null,
    estado        text not null default 'disponible',
    valido_desde  date,
    valido_hasta  date
);

-- 2) COLUMNAS NUEVAS (por si las tablas ya existian de antes)
alter table clientes add column if not exists rol text not null default 'cliente';
alter table pedidos  add column if not exists items jsonb;
alter table pedidos  add column if not exists motivo_cancelacion text;
alter table pedidos  add column if not exists cupon_codigo text;
alter table pedidos  add column if not exists descuento numeric default 0;

-- 3) DATOS DE EJEMPLO
update clientes set rol = 'admin'    where email = 'admin@admin.com';
-- update clientes set rol = 'vendedor' where email = 'vendedor@bodypaint.com';

insert into cupones (codigo, descuento, estado, valido_desde, valido_hasta) values
    ('PROMO500',  500,  'disponible', '2025-01-01', '2026-12-31'),
    ('PROMO1000', 1000, 'disponible', '2025-01-01', '2026-12-31')
on conflict (codigo) do nothing;

-- 4) LECTURA PUBLICA (la app usa la anon key). Si una tabla devuelve vacio por RLS:
alter table clientes  disable row level security;
alter table productos disable row level security;
alter table pedidos   disable row level security;
alter table cupones   disable row level security;
