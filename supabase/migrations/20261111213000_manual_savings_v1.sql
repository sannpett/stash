create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  initials text not null default '',
  city text not null default '',
  bio text not null default '' check (length(bio) <= 280),
  avatar_path text,
  banner_path text,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  private_progress boolean not null default true,
  friend_activity boolean not null default true,
  challenge_alerts boolean not null default true,
  milestone_alerts boolean not null default true,
  reduced_motion boolean not null default false,
  theme text not null default 'dark' check (theme in ('light', 'dark')),
  xp integer not null default 0 check (xp >= 0),
  earned_badges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  target_amount_cents bigint not null check (target_amount_cents > 0),
  deadline date,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  color text not null default 'green',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index savings_goals_user_created_idx
  on public.savings_goals (user_id, created_at desc);

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  kind text not null check (kind in ('contribution', 'withdrawal')),
  category text not null default 'Other',
  description text not null default '',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id)
    references public.savings_goals (id, user_id)
    on delete cascade
);

create index savings_entries_user_date_idx
  on public.savings_entries (user_id, occurred_on desc, created_at desc);

create index savings_entries_goal_date_idx
  on public.savings_entries (goal_id, occurred_on desc);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index friendships_active_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
  where status in ('pending', 'accepted');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 80),
  description text not null default '' check (length(description) <= 280),
  type text not null
    check (type in ('fixed', 'no-spend', 'weekly', 'percentage', 'head-to-head', 'group')),
  target_amount_cents bigint not null default 0 check (target_amount_cents >= 0),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  visibility text not null default 'invite_only' check (visibility in ('public', 'invite_only')),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'declined', 'left')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index challenge_participants_user_idx
  on public.challenge_participants (user_id, joined_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  supplied_name text;
  supplied_username text;
begin
  supplied_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'New saver'
  );
  supplied_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', 'saver'),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  ));
  supplied_username := left(coalesce(nullif(supplied_username, ''), 'saver'), 9)
    || '_'
    || left(replace(new.id::text, '-', ''), 10);

  insert into public.profiles (id, username, display_name, initials)
  values (
    new.id,
    supplied_username,
    supplied_name,
    left(upper(supplied_name), 2)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_challenge_member(challenge_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = challenge_uuid
      and participant.user_id = auth.uid()
      and participant.status in ('invited', 'active')
  );
$$;

create or replace function public.is_challenge_creator(challenge_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.challenges challenge
    where challenge.id = challenge_uuid
      and challenge.creator_id = auth.uid()
  );
$$;

create or replace function public.search_profiles(search_term text)
returns table (
  id uuid,
  username text,
  display_name text,
  initials text,
  avatar_path text,
  bio text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.id, profile.username, profile.display_name, profile.initials, profile.avatar_path, profile.bio
  from public.profiles profile
  where auth.uid() is not null
    and length(trim(search_term)) between 3 and 32
    and profile.id <> auth.uid()
    and (
      profile.username ilike '%' || trim(search_term) || '%'
      or profile.display_name ilike '%' || trim(search_term) || '%'
    )
  order by profile.username
  limit 20;
$$;

alter table public.profiles enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_entries enable row level security;
alter table public.friendships enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

revoke all on public.profiles, public.savings_goals, public.savings_entries,
  public.friendships, public.challenges, public.challenge_participants from anon;
grant select, insert, update, delete on public.profiles, public.savings_goals,
  public.savings_entries, public.friendships, public.challenges,
  public.challenge_participants to authenticated;

create policy "Users read their own profiles and accepted friends"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.friendships friendship
      where friendship.status = 'accepted'
        and (
          (friendship.requester_id = auth.uid() and friendship.addressee_id = id)
          or (friendship.addressee_id = auth.uid() and friendship.requester_id = id)
        )
    )
  );

create policy "Users update their own profiles"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users manage their own savings goals"
  on public.savings_goals for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their own savings entries"
  on public.savings_entries for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users read friend requests involving them"
  on public.friendships for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users send friend requests"
  on public.friendships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

create policy "Recipients accept or decline friend requests"
  on public.friendships for update to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

create policy "Requesters cancel friend requests"
  on public.friendships for update to authenticated
  using (requester_id = auth.uid() and status = 'pending')
  with check (requester_id = auth.uid() and status = 'cancelled');

create policy "Users remove friendships involving them"
  on public.friendships for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "Users read public, owned, or joined challenges"
  on public.challenges for select to authenticated
  using (
    visibility = 'public'
    or creator_id = auth.uid()
    or public.is_challenge_member(id)
  );

create policy "Users create challenges as themselves"
  on public.challenges for insert to authenticated
  with check (creator_id = auth.uid());

create policy "Creators update their challenges"
  on public.challenges for update to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "Creators delete their challenges"
  on public.challenges for delete to authenticated
  using (creator_id = auth.uid());

create policy "Users read progress for their challenges"
  on public.challenge_participants for select to authenticated
  using (user_id = auth.uid() or public.is_challenge_member(challenge_id));

create policy "Creators invite challenge participants"
  on public.challenge_participants for insert to authenticated
  with check (public.is_challenge_creator(challenge_id));

create policy "Users join public challenges"
  on public.challenge_participants for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.challenges challenge
      where challenge.id = challenge_id
        and challenge.visibility = 'public'
    )
  );

create policy "Users update their challenge progress"
  on public.challenge_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users leave challenges"
  on public.challenge_participants for delete to authenticated
  using (user_id = auth.uid() or public.is_challenge_creator(challenge_id));

revoke all on function public.handle_new_user() from public;
revoke all on function public.is_challenge_member(uuid) from public;
revoke all on function public.is_challenge_creator(uuid) from public;
revoke all on function public.search_profiles(text) from public;
grant execute on function public.is_challenge_member(uuid) to authenticated;
grant execute on function public.is_challenge_creator(uuid) to authenticated;
grant execute on function public.search_profiles(text) to authenticated;
