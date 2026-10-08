-- Schema RSVP untuk Supabase PostgreSQL, terpisah dari migrasi SQLite Sites.
create table public.rsvps (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  attendance text not null check (attendance in ('yes', 'no')),
  guests smallint not null,
  message text not null default '' check (char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  constraint rsvps_guest_count check (
    (attendance = 'yes' and guests between 1 and 3)
    or (attendance = 'no' and guests = 0)
  ),
  constraint rsvps_submission_id check (
    id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  )
);

alter table public.rsvps enable row level security;
revoke all on table public.rsvps from public, anon, authenticated;
grant insert (id, name, attendance, guests, message) on public.rsvps to anon;
grant all on public.rsvps to service_role;

-- Tamu hanya dapat mengirim; tidak ada policy atau grant untuk membaca/mengubah.
create policy rsvps_submit on public.rsvps for insert to anon with check (
  char_length(btrim(name)) between 1 and 100
  and char_length(message) <= 1000
  and ((attendance = 'yes' and guests between 1 and 3) or (attendance = 'no' and guests = 0))
);
