-- Kookavond datamodel. Geen accounts: toegang is gebaseerd op het kennen van
-- de groeps-uitnodigingscode, dus RLS staat open voor de anon-rol op alle
-- tabellen. IDs zijn client-gegenereerde tekst-ids (geen uuid's), zodat de
-- app-code niet hoeft te veranderen t.o.v. de lokale AsyncStorage-versie.
-- group_id staat gedenormaliseerd op poll_options/votes/course_assignments
-- zodat realtime-filters en queries per groep zonder joins kunnen.

drop table if exists course_assignments cascade;
drop table if exists votes cascade;
drop table if exists poll_options cascade;
drop table if exists events cascade;
drop table if exists members cascade;
drop table if exists groups cascade;

create table groups (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  group_type text not null default 'random',
  organizer_member_id text not null,
  created_at timestamptz not null default now()
);

create table members (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index members_group_id_idx on members(group_id);

create table events (
  id text primary key,
  group_id text not null references groups(id) on delete cascade,
  status text not null,
  title text,
  confirmed_date date,
  theme text,
  created_by_member_id text not null,
  created_at timestamptz not null default now()
);
create index events_group_id_idx on events(group_id);

create table poll_options (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  date date not null
);
create index poll_options_group_id_idx on poll_options(group_id);
create index poll_options_event_id_idx on poll_options(event_id);

create table votes (
  id text primary key,
  poll_option_id text not null references poll_options(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  response text not null,
  unique (poll_option_id, member_id)
);
create index votes_group_id_idx on votes(group_id);

create table course_assignments (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  course text not null,
  unique (event_id, member_id)
);
create index course_assignments_group_id_idx on course_assignments(group_id);

-- Chat per kookavond, alleen bedoeld voor leden die "ja" hebben gestemd
-- (afgedwongen in de app-laag, niet in RLS — zelfde vertrouwensmodel als de rest).
create table messages (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index messages_event_id_idx on messages(event_id);
create index messages_group_id_idx on messages(group_id);

alter table groups enable row level security;
alter table members enable row level security;
alter table events enable row level security;
alter table poll_options enable row level security;
alter table votes enable row level security;
alter table course_assignments enable row level security;
alter table messages enable row level security;

create policy "anon full access" on groups for all to anon using (true) with check (true);
create policy "anon full access" on members for all to anon using (true) with check (true);
create policy "anon full access" on events for all to anon using (true) with check (true);
create policy "anon full access" on poll_options for all to anon using (true) with check (true);
create policy "anon full access" on votes for all to anon using (true) with check (true);
create policy "anon full access" on course_assignments for all to anon using (true) with check (true);
create policy "anon full access" on messages for all to anon using (true) with check (true);

alter publication supabase_realtime add table groups, members, events, poll_options, votes, course_assignments, messages;
