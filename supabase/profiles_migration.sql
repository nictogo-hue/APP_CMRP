-- =====================================================
-- MIGRACIÓN IDEMPOTENTE: profiles + trigger on_auth_user_created
-- Generado: 2026-03-01
-- Estrategia: Detecta estado real y actúa solo si es necesario
-- =====================================================

-- ─────────────────────────────────────────────────────
-- PASO 1: Verificación de estado actual (diagnóstico)
-- ─────────────────────────────────────────────────────

-- Ver si la tabla profiles existe y qué columnas tiene
SELECT
  c.column_name,
  c.data_type,
  c.column_default,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name   = 'profiles'
ORDER BY c.ordinal_position;

-- Ver si RLS está activo en profiles
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename  = 'profiles';

-- Ver si el trigger on_auth_user_created existe
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Ver políticas RLS de profiles (si existen)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'profiles';

-- ─────────────────────────────────────────────────────
-- PASO 2: Creación de tabla (solo si NO existe)
-- ─────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  full_name  text,
  avatar_url text,
  role       text not null default 'client',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ─────────────────────────────────────────────────────
-- PASO 3: Agregar columna `role` si la tabla YA existía
--         pero le falta esa columna (ADD COLUMN IF NOT EXISTS)
-- ─────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists role text not null default 'client';

-- ─────────────────────────────────────────────────────
-- PASO 4: Habilitar RLS (idempotente por naturaleza)
-- ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- ─────────────────────────────────────────────────────
-- PASO 5: Políticas RLS
--         DROP + CREATE para garantizar estado correcto
-- ─────────────────────────────────────────────────────

drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────────────
-- PASO 6: Función handle_new_user (CREATE OR REPLACE)
-- ─────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────
-- PASO 7: Trigger on_auth_user_created
--         DROP IF EXISTS garantiza re-creación limpia
-- ─────────────────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────
-- PASO 8: Verificación de estado final
-- ─────────────────────────────────────────────────────

select
  'profiles existe'              as check,
  exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'profiles'
  ) as resultado

union all

select
  'columna role existe'          as check,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'role'
  ) as resultado

union all

select
  'RLS habilitado'               as check,
  (
    select rowsecurity
    from pg_tables
    where schemaname = 'public'
      and tablename  = 'profiles'
  ) as resultado

union all

select
  'trigger activo'               as check,
  exists (
    select 1
    from information_schema.triggers
    where trigger_name = 'on_auth_user_created'
  ) as resultado;
