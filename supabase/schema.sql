create extension if not exists "pgcrypto";

create table if not exists public.startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notion_page_url text,
  website_url text,
  instagram_url text,
  linkedin_url text,
  eligibility_status text not null default 'pending',
  evaluation_status text not null default 'not_assigned',
  program_status text not null default 'applicant',
  notes text,
  cohort text,
  record_status text not null default 'active',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.people rename to profiles;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('male', 'female', 'diverse')),
  email text,
  linkedin_url text,
  website_url text,
  notes text,
  created_by_profile_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  profile_id uuid references public.profiles (id) on delete set null,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id)
);

create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (role_id, profile_id)
);

insert into public.roles (name, description)
values
  ('team_member', 'Internal team member supporting operations across the program.'),
  ('founder', 'Founder involved in building and leading a startup.'),
  ('evaluator', 'Evaluator reviewing startups and providing structured feedback.'),
  ('mentor', 'Mentor advising founders with experience and strategic guidance.'),
  ('coach', 'Coach supporting founders with hands-on development and accountability.')
on conflict (name) do nothing;

delete from public.profile_roles
where role_id in (
  select id from public.roles where name = 'admin'
);

delete from public.roles
where name = 'admin';

insert into public.users (id, email, is_admin)
select id, email, true
from auth.users
on conflict (id) do update
set email = excluded.email;

alter table if exists public.users add column if not exists profile_id uuid references public.profiles (id) on delete set null;
alter table if exists public.users drop constraint if exists users_profile_id_key;
alter table if exists public.users add constraint users_profile_id_key unique (profile_id);

alter table if exists public.startups add column if not exists notion_page_url text;
alter table if exists public.startups add column if not exists website_url text;
alter table if exists public.startups add column if not exists instagram_url text;
alter table if exists public.startups add column if not exists linkedin_url text;
alter table if exists public.startups add column if not exists eligibility_status text default 'pending';
alter table if exists public.startups add column if not exists evaluation_status text default 'not_assigned';
alter table if exists public.startups add column if not exists program_status text default 'applicant';
alter table if exists public.startups add column if not exists notes text;
alter table if exists public.startups add column if not exists cohort text;
alter table if exists public.startups add column if not exists record_status text default 'active';
alter table if exists public.startups add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.profiles add column if not exists linkedin_url text;
alter table if exists public.profiles add column if not exists first_name text;
alter table if exists public.profiles add column if not exists last_name text;
alter table if exists public.profiles add column if not exists gender text;
alter table if exists public.profiles add column if not exists website_url text;
alter table if exists public.profiles add column if not exists created_by_profile_id uuid;
alter table if exists public.profiles add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.profiles add column if not exists record_status text default 'active';
alter table if exists public.profiles drop column if exists role;
alter table if exists public.profiles drop column if exists title;
alter table if exists public.profiles drop constraint if exists profiles_gender_check;
alter table if exists public.profiles
  add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female', 'diverse'));

alter table if exists public.startup_people rename to startup_members;

create table if not exists public.startup_members (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  relationship_type text not null default 'founder',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

alter table if exists public.startup_members add column if not exists relationship_type text default 'founder';
alter table if exists public.startup_members add column if not exists notes text;
alter table if exists public.startup_members add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.startup_members add column if not exists record_status text default 'active';
alter table if exists public.startup_members alter column relationship_type set not null;
alter table if exists public.startup_members alter column record_status set not null;
alter table if exists public.startup_members drop constraint if exists startup_members_startup_id_profile_id_key;

alter table if exists public.evaluations rename to assignments;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assignment_type text not null default 'evaluation',
  status text not null default 'assigned',
  due_date timestamptz,
  submitted_at timestamptz,
  assigned_by_profile_id uuid references public.profiles (id),
  notes text,
  score numeric(3,1),
  recommendation text,
  form_url text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

alter table if exists public.assignments add column if not exists due_date timestamptz;
alter table if exists public.assignments add column if not exists submitted_at timestamptz;
alter table if exists public.assignments add column if not exists assigned_by_profile_id uuid references public.profiles (id);
alter table if exists public.assignments add column if not exists notes text;
alter table if exists public.assignments add column if not exists score numeric(3,1);
alter table if exists public.assignments add column if not exists recommendation text;
alter table if exists public.assignments add column if not exists form_url text;
alter table if exists public.assignments add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.assignments add column if not exists record_status text default 'active';
alter table if exists public.assignments alter column record_status set not null;

alter table public.startups enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.profile_roles enable row level security;
alter table public.startup_members enable row level security;
alter table public.assignments enable row level security;

drop policy if exists "Authenticated users can read startups" on public.startups;
create policy "Authenticated users can read startups"
on public.startups
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert startups" on public.startups;
create policy "Authenticated users can insert startups"
on public.startups
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update startups" on public.startups;
create policy "Authenticated users can update startups"
on public.startups
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete startups" on public.startups;
create policy "Authenticated users can delete startups"
on public.startups
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
on public.profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.is_admin = true
  )
);

drop policy if exists "Authenticated users can update profiles" on public.profiles;
create policy "Admins or linked users can update profiles"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and (users.is_admin = true or users.profile_id = profiles.id)
  )
)
with check (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and (users.is_admin = true or users.profile_id = profiles.id)
  )
);

drop policy if exists "Authenticated users can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles
for delete
to authenticated
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.is_admin = true
  )
);

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read own user record" on public.users;
create policy "Authenticated users can read own user record"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Authenticated users can create own user record" on public.users;
create policy "Authenticated users can create own user record"
on public.users
for insert
to authenticated
with check (auth.uid() = id and is_admin = false);

drop policy if exists "Authenticated users can insert roles" on public.roles;
create policy "Authenticated users can insert roles"
on public.roles
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update roles" on public.roles;
create policy "Authenticated users can update roles"
on public.roles
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete roles" on public.roles;
create policy "Authenticated users can delete roles"
on public.roles
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read profile roles" on public.profile_roles;
create policy "Authenticated users can read profile roles"
on public.profile_roles
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert profile roles" on public.profile_roles;
create policy "Authenticated users can insert profile roles"
on public.profile_roles
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete profile roles" on public.profile_roles;
create policy "Authenticated users can delete profile roles"
on public.profile_roles
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read startup members" on public.startup_members;
create policy "Authenticated users can read startup members"
on public.startup_members
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert startup members" on public.startup_members;
create policy "Authenticated users can insert startup members"
on public.startup_members
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update startup members" on public.startup_members;
create policy "Authenticated users can update startup members"
on public.startup_members
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete startup members" on public.startup_members;
create policy "Authenticated users can delete startup members"
on public.startup_members
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read assignments" on public.assignments;
create policy "Authenticated users can read assignments"
on public.assignments
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert assignments" on public.assignments;
create policy "Authenticated users can insert assignments"
on public.assignments
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update assignments" on public.assignments;
create policy "Authenticated users can update assignments"
on public.assignments
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete assignments" on public.assignments;
create policy "Authenticated users can delete assignments"
on public.assignments
for delete
to authenticated
using (true);
