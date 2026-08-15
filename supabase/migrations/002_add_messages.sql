create table if not exists messages (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  group_id text not null references groups(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_event_id_idx on messages(event_id);
create index if not exists messages_group_id_idx on messages(group_id);

alter table messages enable row level security;

drop policy if exists "anon full access" on messages;
create policy "anon full access" on messages for all to anon using (true) with check (true);

alter publication supabase_realtime add table messages;
