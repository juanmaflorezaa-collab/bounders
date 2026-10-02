-- Ejecuta esto en Supabase: Dashboard → SQL Editor → New query → pega y "Run".

create table if not exists public.memories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  facts jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seguridad a nivel de fila: cada usuario solo puede leer/escribir su propia memoria.
alter table public.memories enable row level security;

create policy "usuarios ven su propia memoria"
  on public.memories for select
  using (auth.uid() = user_id);

create policy "usuarios actualizan su propia memoria"
  on public.memories for insert
  with check (auth.uid() = user_id);

create policy "usuarios modifican su propia memoria"
  on public.memories for update
  using (auth.uid() = user_id);
