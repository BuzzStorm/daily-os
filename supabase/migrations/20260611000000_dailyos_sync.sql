-- Daily OS cloud sync schema.
-- State is stored as a single jsonb blob per sync key. Direct table access is
-- denied (RLS with no policies); all reads/writes go through the two
-- security-definer RPCs below, which require knowledge of the sync key.

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
revoke all on table public.app_state from anon, authenticated;

create or replace function public.dailyos_pull(sync_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if sync_key is null or length(sync_key) < 32 then
    raise exception 'invalid sync key';
  end if;
  select data, updated_at into rec from app_state where id = sync_key;
  if not found then
    return null;
  end if;
  return jsonb_build_object('data', rec.data, 'updated_at', to_jsonb(rec.updated_at));
end;
$$;

create or replace function public.dailyos_push(sync_key text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
begin
  if sync_key is null or length(sync_key) < 32 then
    raise exception 'invalid sync key';
  end if;
  if payload is null or pg_column_size(payload) > 2097152 then
    raise exception 'invalid payload';
  end if;
  insert into app_state (id, data, updated_at)
  values (sync_key, payload, now())
  on conflict (id) do update set data = excluded.data, updated_at = now()
  returning updated_at into ts;
  return jsonb_build_object('updated_at', to_jsonb(ts));
end;
$$;

grant execute on function public.dailyos_pull(text) to anon;
grant execute on function public.dailyos_push(text, jsonb) to anon;
