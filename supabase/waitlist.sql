-- Fuelstate — waitlist table
-- Run this once against the Fuelstate Supabase project (bghekdandbybblhwjjgc).
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE semantics.

create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text,
  user_agent text,
  referrer   text,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so "Foo@x.com" and "foo@x.com" collapse.
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- Drop any prior copies so this file is idempotent.
drop policy if exists "waitlist_anon_insert" on public.waitlist;
drop policy if exists "waitlist_no_select"   on public.waitlist;

-- Anyone (anon or authenticated) can insert. No read access from the client.
create policy "waitlist_anon_insert"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
    and length(email) <= 254
    and (source is null or length(source) <= 64)
    and (user_agent is null or length(user_agent) <= 300)
    and (referrer is null or length(referrer) <= 300)
  );

-- Explicit: no SELECT policy means the anon key cannot read the list.
-- Export via the Supabase dashboard (service_role) or a future admin view.
