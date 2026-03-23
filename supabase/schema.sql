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

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  number integer,
  name text not null,
  program_name text,
  description text,
  start_date date,
  end_date date,
  workshop_budget_hours numeric(10,2),
  one_to_one_budget_hours numeric(10,2),
  other_budget_hours numeric(10,2),
  workshop_budget_amount numeric(12,2),
  one_to_one_budget_amount numeric(12,2),
  other_budget_amount numeric(12,2),
  status text not null default 'planned',
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.coaching_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.module_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  module_type text,
  default_notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.cohort_modules (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  module_template_id uuid not null references public.module_templates (id) on delete restrict,
  status text not null default 'planned',
  sequence_number integer,
  start_date date,
  end_date date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.parent_coachings (
  id uuid primary key default gen_random_uuid(),
  cohort_module_id uuid not null references public.cohort_modules (id) on delete cascade,
  coach_profile_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  status text not null default 'planned',
  planned_budget_hours numeric(8,2),
  hourly_rate numeric(10,2),
  hours_allocated numeric(8,2),
  hours_executed numeric(8,2),
  payment_type text,
  expected_net_amount numeric(10,2),
  actual_net_amount numeric(10,2),
  agreement_status_snapshot text,
  agreement_end_date_snapshot date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.parent_coaching_task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_required boolean not null default true,
  sequence_number integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.parent_coaching_tasks (
  id uuid primary key default gen_random_uuid(),
  parent_coaching_id uuid not null references public.parent_coachings (id) on delete cascade,
  task_template_id uuid references public.parent_coaching_task_templates (id) on delete set null,
  title text not null,
  description text,
  is_required boolean not null default true,
  status text not null default 'todo',
  sequence_number integer,
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.cohort_coachings (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  cohort_module_id uuid references public.cohort_modules (id) on delete set null,
  module_template_id uuid references public.module_templates (id) on delete set null,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  support_role text not null default 'coach',
  internal_code text,
  name text not null,
  tag text,
  tags text[] not null default '{}'::text[],
  session_types text[] not null default '{}'::text[],
  status text not null default 'planned',
  onboarding_status text not null default 'in_progress',
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  planned_budget_hours numeric(8,2),
  hourly_rate numeric(10,2),
  planned_budget_amount numeric(10,2),
  hours_allocated numeric(8,2),
  hours_executed numeric(8,2),
  payment_type text,
  payment_notes text,
  actual_amount numeric(10,2),
  agreement_status_snapshot text,
  agreement_end_date_snapshot date,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.cohort_coaching_task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  support_role text not null default 'both',
  is_required boolean not null default true,
  sequence_number integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.cohort_coaching_tasks (
  id uuid primary key default gen_random_uuid(),
  cohort_coaching_id uuid not null references public.cohort_coachings (id) on delete cascade,
  task_template_id uuid references public.cohort_coaching_task_templates (id) on delete set null,
  title text not null,
  description text,
  is_required boolean not null default true,
  status text not null default 'todo',
  responsible_person text,
  sequence_number integer,
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.cohort_coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_coaching_id uuid not null references public.cohort_coachings (id) on delete cascade,
  session_type text not null default 'one_to_one',
  title text not null,
  startup_id uuid references public.startups (id) on delete set null,
  hourly_rate numeric(10,2),
  planned_date date,
  planned_duration_hours numeric(8,2),
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active'
);

create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (role_id, profile_id)
);

create table if not exists public.profile_details (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  profile_status text,
  internal_code text,
  drive_url text,
  agreement_status text,
  agreement_end_date date,
  website_status text,
  publication_status text,
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  record_status text not null default 'active',
  unique (profile_id)
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

alter table if exists public.profile_details add column if not exists profile_status text;
alter table if exists public.profile_details add column if not exists internal_code text;
alter table if exists public.profile_details add column if not exists drive_url text;
alter table if exists public.profile_details add column if not exists agreement_status text;
alter table if exists public.profile_details add column if not exists agreement_end_date date;
alter table if exists public.profile_details add column if not exists website_status text;
alter table if exists public.profile_details add column if not exists publication_status text;
alter table if exists public.profile_details add column if not exists admin_notes text;
alter table if exists public.profile_details add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.profile_details add column if not exists record_status text default 'active';
alter table if exists public.profile_details alter column record_status set not null;

create index if not exists profile_details_record_status_idx on public.profile_details (record_status);
create unique index if not exists profile_details_internal_code_active_idx
on public.profile_details (internal_code)
where record_status = 'active' and internal_code is not null;
create unique index if not exists coaching_tags_name_active_idx
on public.coaching_tags (name)
where record_status = 'active';
create unique index if not exists profiles_email_active_idx
on public.profiles (lower(email))
where record_status = 'active' and email is not null;

alter table if exists public.cohorts add column if not exists program_name text;
alter table if exists public.cohorts add column if not exists number integer;
alter table if exists public.cohorts add column if not exists description text;
alter table if exists public.cohorts add column if not exists start_date date;
alter table if exists public.cohorts add column if not exists end_date date;
alter table if exists public.cohorts add column if not exists workshop_budget_hours numeric(10,2);
alter table if exists public.cohorts add column if not exists one_to_one_budget_hours numeric(10,2);
alter table if exists public.cohorts add column if not exists other_budget_hours numeric(10,2);
alter table if exists public.cohorts add column if not exists workshop_budget_amount numeric(12,2);
alter table if exists public.cohorts add column if not exists one_to_one_budget_amount numeric(12,2);
alter table if exists public.cohorts add column if not exists other_budget_amount numeric(12,2);
alter table if exists public.cohorts add column if not exists status text default 'planned';
alter table if exists public.cohorts add column if not exists notes text;
alter table if exists public.cohorts add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table if exists public.cohorts add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohorts add column if not exists record_status text default 'active';
alter table if exists public.cohorts alter column status set not null;
alter table if exists public.cohorts alter column record_status set not null;

update public.cohorts
set
  workshop_budget_hours = coalesce(workshop_budget_hours, coaching_budget_hours),
  workshop_budget_amount = coalesce(workshop_budget_amount, coaching_budget_amount)
where record_status = 'active';

alter table if exists public.coaching_tags add column if not exists description text;
alter table if exists public.coaching_tags add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.coaching_tags add column if not exists record_status text default 'active';
alter table if exists public.coaching_tags alter column record_status set not null;

alter table if exists public.module_templates add column if not exists description text;
alter table if exists public.module_templates add column if not exists module_type text;
alter table if exists public.module_templates add column if not exists default_notes text;
alter table if exists public.module_templates add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table if exists public.module_templates add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.module_templates add column if not exists record_status text default 'active';
alter table if exists public.module_templates alter column record_status set not null;

alter table if exists public.cohort_modules add column if not exists status text default 'planned';
alter table if exists public.cohort_modules add column if not exists sequence_number integer;
alter table if exists public.cohort_modules add column if not exists start_date date;
alter table if exists public.cohort_modules add column if not exists end_date date;
alter table if exists public.cohort_modules add column if not exists notes text;
alter table if exists public.cohort_modules add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table if exists public.cohort_modules add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohort_modules add column if not exists record_status text default 'active';
alter table if exists public.cohort_modules alter column status set not null;
alter table if exists public.cohort_modules alter column record_status set not null;

alter table if exists public.parent_coachings add column if not exists status text default 'planned';
alter table if exists public.parent_coachings add column if not exists planned_budget_hours numeric(8,2);
alter table if exists public.parent_coachings add column if not exists hourly_rate numeric(10,2);
alter table if exists public.parent_coachings add column if not exists hours_allocated numeric(8,2);
alter table if exists public.parent_coachings add column if not exists hours_executed numeric(8,2);
alter table if exists public.parent_coachings add column if not exists payment_type text;
alter table if exists public.parent_coachings add column if not exists expected_net_amount numeric(10,2);
alter table if exists public.parent_coachings add column if not exists actual_net_amount numeric(10,2);
alter table if exists public.parent_coachings add column if not exists agreement_status_snapshot text;
alter table if exists public.parent_coachings add column if not exists agreement_end_date_snapshot date;
alter table if exists public.parent_coachings add column if not exists notes text;
alter table if exists public.parent_coachings add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table if exists public.parent_coachings add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.parent_coachings add column if not exists record_status text default 'active';
alter table if exists public.parent_coachings alter column status set not null;
alter table if exists public.parent_coachings alter column record_status set not null;

alter table if exists public.parent_coaching_task_templates add column if not exists description text;
alter table if exists public.parent_coaching_task_templates add column if not exists is_required boolean default true;
alter table if exists public.parent_coaching_task_templates add column if not exists sequence_number integer;
alter table if exists public.parent_coaching_task_templates add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.parent_coaching_task_templates add column if not exists record_status text default 'active';
alter table if exists public.parent_coaching_task_templates alter column is_required set not null;
alter table if exists public.parent_coaching_task_templates alter column record_status set not null;

alter table if exists public.parent_coaching_tasks add column if not exists task_template_id uuid references public.parent_coaching_task_templates (id) on delete set null;
alter table if exists public.parent_coaching_tasks add column if not exists title text;
alter table if exists public.parent_coaching_tasks add column if not exists description text;
alter table if exists public.parent_coaching_tasks add column if not exists is_required boolean default true;
alter table if exists public.parent_coaching_tasks add column if not exists status text default 'todo';
alter table if exists public.parent_coaching_tasks add column if not exists sequence_number integer;
alter table if exists public.parent_coaching_tasks add column if not exists due_date date;
alter table if exists public.parent_coaching_tasks add column if not exists completed_at timestamptz;
alter table if exists public.parent_coaching_tasks add column if not exists notes text;
alter table if exists public.parent_coaching_tasks add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.parent_coaching_tasks add column if not exists record_status text default 'active';
alter table if exists public.parent_coaching_tasks alter column title set not null;
alter table if exists public.parent_coaching_tasks alter column is_required set not null;
alter table if exists public.parent_coaching_tasks alter column status set not null;
alter table if exists public.parent_coaching_tasks alter column record_status set not null;

alter table if exists public.cohort_coachings add column if not exists cohort_module_id uuid references public.cohort_modules (id) on delete set null;
alter table if exists public.cohort_coachings add column if not exists module_template_id uuid references public.module_templates (id) on delete set null;
alter table if exists public.cohort_coachings add column if not exists support_role text default 'coach';
alter table if exists public.cohort_coachings add column if not exists internal_code text;
alter table if exists public.cohort_coachings add column if not exists tag text;
alter table if exists public.cohort_coachings add column if not exists tags text[] default '{}'::text[];
alter table if exists public.cohort_coachings add column if not exists session_types text[] default '{}'::text[];
alter table if exists public.cohort_coachings add column if not exists status text default 'planned';
alter table if exists public.cohort_coachings add column if not exists onboarding_status text default 'in_progress';
alter table if exists public.cohort_coachings add column if not exists planned_start_date date;
alter table if exists public.cohort_coachings add column if not exists planned_end_date date;
alter table if exists public.cohort_coachings add column if not exists actual_start_date date;
alter table if exists public.cohort_coachings add column if not exists actual_end_date date;
alter table if exists public.cohort_coachings add column if not exists planned_budget_hours numeric(8,2);
alter table if exists public.cohort_coachings add column if not exists hourly_rate numeric(10,2);
alter table if exists public.cohort_coachings add column if not exists planned_budget_amount numeric(10,2);
alter table if exists public.cohort_coachings add column if not exists hours_allocated numeric(8,2);
alter table if exists public.cohort_coachings add column if not exists hours_executed numeric(8,2);
alter table if exists public.cohort_coachings add column if not exists payment_type text;
alter table if exists public.cohort_coachings add column if not exists payment_notes text;
alter table if exists public.cohort_coachings add column if not exists actual_amount numeric(10,2);
alter table if exists public.cohort_coachings add column if not exists agreement_status_snapshot text;
alter table if exists public.cohort_coachings add column if not exists agreement_end_date_snapshot date;
alter table if exists public.cohort_coachings add column if not exists notes text;
alter table if exists public.cohort_coachings add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table if exists public.cohort_coachings add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohort_coachings add column if not exists record_status text default 'active';
alter table if exists public.cohort_coachings alter column support_role set not null;
alter table if exists public.cohort_coachings alter column tags set not null;
alter table if exists public.cohort_coachings alter column session_types set not null;
alter table if exists public.cohort_coachings alter column status set not null;
alter table if exists public.cohort_coachings alter column onboarding_status set not null;
alter table if exists public.cohort_coachings alter column record_status set not null;

alter table if exists public.cohort_coaching_task_templates add column if not exists description text;
alter table if exists public.cohort_coaching_task_templates add column if not exists support_role text default 'both';
alter table if exists public.cohort_coaching_task_templates add column if not exists is_required boolean default true;
alter table if exists public.cohort_coaching_task_templates add column if not exists sequence_number integer;
alter table if exists public.cohort_coaching_task_templates add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohort_coaching_task_templates add column if not exists record_status text default 'active';
alter table if exists public.cohort_coaching_task_templates alter column support_role set not null;
alter table if exists public.cohort_coaching_task_templates alter column is_required set not null;
alter table if exists public.cohort_coaching_task_templates alter column record_status set not null;

alter table if exists public.cohort_coaching_tasks add column if not exists task_template_id uuid references public.cohort_coaching_task_templates (id) on delete set null;
alter table if exists public.cohort_coaching_tasks add column if not exists title text;
alter table if exists public.cohort_coaching_tasks add column if not exists description text;
alter table if exists public.cohort_coaching_tasks add column if not exists is_required boolean default true;
alter table if exists public.cohort_coaching_tasks add column if not exists status text default 'todo';
alter table if exists public.cohort_coaching_tasks add column if not exists responsible_person text;
alter table if exists public.cohort_coaching_tasks add column if not exists sequence_number integer;
alter table if exists public.cohort_coaching_tasks add column if not exists due_date date;
alter table if exists public.cohort_coaching_tasks add column if not exists completed_at timestamptz;
alter table if exists public.cohort_coaching_tasks add column if not exists notes text;
alter table if exists public.cohort_coaching_tasks add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohort_coaching_tasks add column if not exists record_status text default 'active';
alter table if exists public.cohort_coaching_tasks alter column title set not null;
alter table if exists public.cohort_coaching_tasks alter column is_required set not null;
alter table if exists public.cohort_coaching_tasks alter column status set not null;
alter table if exists public.cohort_coaching_tasks alter column record_status set not null;

alter table if exists public.cohort_coaching_sessions add column if not exists startup_id uuid references public.startups (id) on delete set null;
alter table if exists public.cohort_coaching_sessions add column if not exists hourly_rate numeric(10,2);
alter table if exists public.cohort_coaching_sessions add column if not exists planned_date date;
alter table if exists public.cohort_coaching_sessions add column if not exists planned_duration_hours numeric(8,2);
alter table if exists public.cohort_coaching_sessions add column if not exists status text default 'planned';
alter table if exists public.cohort_coaching_sessions add column if not exists notes text;
alter table if exists public.cohort_coaching_sessions add column if not exists updated_at timestamptz default timezone('utc', now());
alter table if exists public.cohort_coaching_sessions add column if not exists record_status text default 'active';
alter table if exists public.cohort_coaching_sessions alter column session_type set not null;
alter table if exists public.cohort_coaching_sessions alter column title set not null;
alter table if exists public.cohort_coaching_sessions alter column status set not null;
alter table if exists public.cohort_coaching_sessions alter column record_status set not null;

create index if not exists cohorts_status_idx on public.cohorts (status);
create index if not exists cohorts_number_idx on public.cohorts (number);
create index if not exists cohorts_record_status_idx on public.cohorts (record_status);
create index if not exists module_templates_type_idx on public.module_templates (module_type);
create index if not exists module_templates_record_status_idx on public.module_templates (record_status);
create index if not exists cohort_modules_cohort_id_idx on public.cohort_modules (cohort_id);
create index if not exists cohort_modules_module_template_id_idx on public.cohort_modules (module_template_id);
create index if not exists cohort_modules_status_idx on public.cohort_modules (status);
create index if not exists cohort_modules_record_status_idx on public.cohort_modules (record_status);
create index if not exists parent_coachings_cohort_module_id_idx on public.parent_coachings (cohort_module_id);
create index if not exists parent_coachings_coach_profile_id_idx on public.parent_coachings (coach_profile_id);
create index if not exists parent_coachings_status_idx on public.parent_coachings (status);
create index if not exists parent_coachings_record_status_idx on public.parent_coachings (record_status);
create unique index if not exists parent_coaching_task_templates_name_active_idx
on public.parent_coaching_task_templates (name, record_status);
create index if not exists parent_coaching_tasks_parent_coaching_id_idx on public.parent_coaching_tasks (parent_coaching_id);
create index if not exists parent_coaching_tasks_status_idx on public.parent_coaching_tasks (status);
create index if not exists parent_coaching_tasks_record_status_idx on public.parent_coaching_tasks (record_status);
create index if not exists cohort_coachings_cohort_id_idx on public.cohort_coachings (cohort_id);
create index if not exists cohort_coachings_profile_id_idx on public.cohort_coachings (profile_id);
create index if not exists cohort_coachings_cohort_module_id_idx on public.cohort_coachings (cohort_module_id);
create index if not exists cohort_coachings_module_template_id_idx on public.cohort_coachings (module_template_id);
create index if not exists cohort_coachings_status_idx on public.cohort_coachings (status);
create index if not exists cohort_coachings_onboarding_status_idx on public.cohort_coachings (onboarding_status);
create index if not exists cohort_coachings_record_status_idx on public.cohort_coachings (record_status);
create index if not exists cohort_coaching_tasks_cohort_coaching_id_idx on public.cohort_coaching_tasks (cohort_coaching_id);
create index if not exists cohort_coaching_tasks_status_idx on public.cohort_coaching_tasks (status);
create index if not exists cohort_coaching_tasks_record_status_idx on public.cohort_coaching_tasks (record_status);
create index if not exists cohort_coaching_sessions_cohort_coaching_id_idx on public.cohort_coaching_sessions (cohort_coaching_id);
create index if not exists cohort_coaching_sessions_status_idx on public.cohort_coaching_sessions (status);
create index if not exists cohort_coaching_sessions_record_status_idx on public.cohort_coaching_sessions (record_status);
create unique index if not exists cohort_coaching_task_templates_name_role_active_idx
on public.cohort_coaching_task_templates (name, support_role, record_status);
create unique index if not exists cohort_modules_unique_active_idx
on public.cohort_modules (cohort_id, module_template_id, record_status);

insert into public.cohort_coaching_task_templates (name, description, support_role, is_required, sequence_number)
values
  ('Collect coach onboarding details', 'Complete the basic profile onboarding and make sure the required information is in the system.', 'coach', true, 1),
  ('Collect mentor onboarding details', 'Complete the basic profile onboarding and make sure the required information is in the system.', 'mentor', true, 1),
  ('Link drive folder and documents', 'Attach the Google Drive folder, CV, certificates, and other required documentation.', 'both', true, 2),
  ('Confirm scope, rate, and budget', 'Agree on the planned support, rate, and budget before delivery starts.', 'both', true, 3),
  ('Prepare and sign contract', 'Create the agreement and ensure it is signed before the planned start date.', 'both', true, 4),
  ('Operational onboarding complete', 'Confirm the coach or mentor is fully ready to deliver inside the cohort.', 'both', true, 5),
  ('Collect invoicing follow-up', 'Complete post-delivery invoice or payment follow-up.', 'both', false, 6)
on conflict do nothing;

insert into public.cohort_coachings (
  cohort_id,
  cohort_module_id,
  module_template_id,
  profile_id,
  support_role,
  internal_code,
  name,
  status,
  onboarding_status,
  planned_budget_hours,
  hourly_rate,
  hours_allocated,
  hours_executed,
  payment_type,
  planned_budget_amount,
  actual_amount,
  agreement_status_snapshot,
  agreement_end_date_snapshot,
  notes,
  created_by,
  created_at,
  updated_at,
  record_status
)
select
  cm.cohort_id,
  pc.cohort_module_id,
  cm.module_template_id,
  pc.coach_profile_id,
  'coach',
  coalesce(pd.internal_code, 'VHP-C-' || upper(replace(p.first_name, ' ', '-')) || '-' || upper(replace(p.last_name, ' ', '-')) || '-' || extract(year from coalesce(pc.created_at, now()))::text),
  pc.name,
  pc.status,
  case
    when pc.agreement_status_snapshot = 'signed' then 'ready'
    when pc.agreement_status_snapshot = 'expired' then 'blocked'
    else 'in_progress'
  end,
  pc.planned_budget_hours,
  pc.hourly_rate,
  pc.hours_allocated,
  pc.hours_executed,
  pc.payment_type,
  pc.expected_net_amount,
  pc.actual_net_amount,
  pc.agreement_status_snapshot,
  pc.agreement_end_date_snapshot,
  pc.notes,
  pc.created_by,
  pc.created_at,
  pc.updated_at,
  pc.record_status
from public.parent_coachings pc
join public.cohort_modules cm on cm.id = pc.cohort_module_id
join public.profiles p on p.id = pc.coach_profile_id
left join public.profile_details pd on pd.profile_id = pc.coach_profile_id and pd.record_status = 'active'
where not exists (
  select 1
  from public.cohort_coachings cc
  where cc.name = pc.name
    and cc.profile_id = pc.coach_profile_id
    and cc.cohort_id = cm.cohort_id
    and cc.record_status = pc.record_status
);

insert into public.cohort_coaching_tasks (
  cohort_coaching_id,
  task_template_id,
  title,
  description,
  is_required,
  status,
  sequence_number,
  due_date,
  completed_at,
  notes,
  created_at,
  updated_at,
  record_status
)
select
  cc.id,
  cctt.id,
  pct.title,
  pct.description,
  pct.is_required,
  pct.status,
  pct.sequence_number,
  pct.due_date,
  pct.completed_at,
  pct.notes,
  pct.created_at,
  pct.updated_at,
  pct.record_status
from public.parent_coaching_tasks pct
join public.parent_coachings pc on pc.id = pct.parent_coaching_id
join public.cohort_modules cm on cm.id = pc.cohort_module_id
join public.cohort_coachings cc
  on cc.name = pc.name
 and cc.profile_id = pc.coach_profile_id
 and cc.cohort_id = cm.cohort_id
left join public.cohort_coaching_task_templates cctt on cctt.name = pct.title and cctt.record_status = 'active'
where not exists (
  select 1
  from public.cohort_coaching_tasks cct
  where cct.cohort_coaching_id = cc.id
    and cct.title = pct.title
    and cct.record_status = pct.record_status
);

insert into public.parent_coaching_task_templates (name, description, is_required, sequence_number)
values
  ('Check coach agreement', 'Confirm the selected coach agreement is valid for delivery.', true, 1),
  ('Confirm budget and rate', 'Review planned hours, rate, and payment setup.', true, 2),
  ('Prepare onboarding', 'Share operational context and required delivery information with the coach.', true, 3),
  ('Share delivery materials', 'Send slides, briefs, startup list, or module resources.', false, 4),
  ('Track delivery completion', 'Confirm the coaching package was fully delivered.', true, 5),
  ('Collect invoicing or payment follow-up', 'Complete any post-delivery payment or invoicing step.', false, 6)
on conflict do nothing;

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
alter table public.cohorts enable row level security;
alter table public.module_templates enable row level security;
alter table public.cohort_modules enable row level security;
alter table public.parent_coachings enable row level security;
alter table public.parent_coaching_task_templates enable row level security;
alter table public.parent_coaching_tasks enable row level security;
alter table public.cohort_coachings enable row level security;
alter table public.cohort_coaching_task_templates enable row level security;
alter table public.cohort_coaching_tasks enable row level security;
alter table public.cohort_coaching_sessions enable row level security;
alter table public.profile_details enable row level security;
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
drop policy if exists "Admins can insert profiles" on public.profiles;
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
drop policy if exists "Admins or linked users can update profiles" on public.profiles;
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
drop policy if exists "Admins can delete profiles" on public.profiles;
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

drop policy if exists "Authenticated users can read cohorts" on public.cohorts;
create policy "Authenticated users can read cohorts"
on public.cohorts
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohorts" on public.cohorts;
create policy "Authenticated users can insert cohorts"
on public.cohorts
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohorts" on public.cohorts;
create policy "Authenticated users can update cohorts"
on public.cohorts
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohorts" on public.cohorts;
create policy "Authenticated users can delete cohorts"
on public.cohorts
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read module templates" on public.module_templates;
create policy "Authenticated users can read module templates"
on public.module_templates
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert module templates" on public.module_templates;
create policy "Authenticated users can insert module templates"
on public.module_templates
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update module templates" on public.module_templates;
create policy "Authenticated users can update module templates"
on public.module_templates
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete module templates" on public.module_templates;
create policy "Authenticated users can delete module templates"
on public.module_templates
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read cohort modules" on public.cohort_modules;
create policy "Authenticated users can read cohort modules"
on public.cohort_modules
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohort modules" on public.cohort_modules;
create policy "Authenticated users can insert cohort modules"
on public.cohort_modules
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohort modules" on public.cohort_modules;
create policy "Authenticated users can update cohort modules"
on public.cohort_modules
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohort modules" on public.cohort_modules;
create policy "Authenticated users can delete cohort modules"
on public.cohort_modules
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read parent coachings" on public.parent_coachings;
create policy "Authenticated users can read parent coachings"
on public.parent_coachings
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert parent coachings" on public.parent_coachings;
create policy "Authenticated users can insert parent coachings"
on public.parent_coachings
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update parent coachings" on public.parent_coachings;
create policy "Authenticated users can update parent coachings"
on public.parent_coachings
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete parent coachings" on public.parent_coachings;
create policy "Authenticated users can delete parent coachings"
on public.parent_coachings
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read parent coaching task templates" on public.parent_coaching_task_templates;
create policy "Authenticated users can read parent coaching task templates"
on public.parent_coaching_task_templates
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert parent coaching task templates" on public.parent_coaching_task_templates;
create policy "Authenticated users can insert parent coaching task templates"
on public.parent_coaching_task_templates
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update parent coaching task templates" on public.parent_coaching_task_templates;
create policy "Authenticated users can update parent coaching task templates"
on public.parent_coaching_task_templates
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete parent coaching task templates" on public.parent_coaching_task_templates;
create policy "Authenticated users can delete parent coaching task templates"
on public.parent_coaching_task_templates
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read parent coaching tasks" on public.parent_coaching_tasks;
create policy "Authenticated users can read parent coaching tasks"
on public.parent_coaching_tasks
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert parent coaching tasks" on public.parent_coaching_tasks;
create policy "Authenticated users can insert parent coaching tasks"
on public.parent_coaching_tasks
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update parent coaching tasks" on public.parent_coaching_tasks;
create policy "Authenticated users can update parent coaching tasks"
on public.parent_coaching_tasks
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete parent coaching tasks" on public.parent_coaching_tasks;
create policy "Authenticated users can delete parent coaching tasks"
on public.parent_coaching_tasks
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read cohort coachings" on public.cohort_coachings;
create policy "Authenticated users can read cohort coachings"
on public.cohort_coachings
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohort coachings" on public.cohort_coachings;
create policy "Authenticated users can insert cohort coachings"
on public.cohort_coachings
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohort coachings" on public.cohort_coachings;
create policy "Authenticated users can update cohort coachings"
on public.cohort_coachings
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohort coachings" on public.cohort_coachings;
create policy "Authenticated users can delete cohort coachings"
on public.cohort_coachings
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read cohort coaching task templates" on public.cohort_coaching_task_templates;
create policy "Authenticated users can read cohort coaching task templates"
on public.cohort_coaching_task_templates
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohort coaching task templates" on public.cohort_coaching_task_templates;
create policy "Authenticated users can insert cohort coaching task templates"
on public.cohort_coaching_task_templates
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohort coaching task templates" on public.cohort_coaching_task_templates;
create policy "Authenticated users can update cohort coaching task templates"
on public.cohort_coaching_task_templates
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohort coaching task templates" on public.cohort_coaching_task_templates;
create policy "Authenticated users can delete cohort coaching task templates"
on public.cohort_coaching_task_templates
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read cohort coaching tasks" on public.cohort_coaching_tasks;
create policy "Authenticated users can read cohort coaching tasks"
on public.cohort_coaching_tasks
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohort coaching tasks" on public.cohort_coaching_tasks;
create policy "Authenticated users can insert cohort coaching tasks"
on public.cohort_coaching_tasks
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohort coaching tasks" on public.cohort_coaching_tasks;
create policy "Authenticated users can update cohort coaching tasks"
on public.cohort_coaching_tasks
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohort coaching tasks" on public.cohort_coaching_tasks;
create policy "Authenticated users can delete cohort coaching tasks"
on public.cohort_coaching_tasks
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read cohort coaching sessions" on public.cohort_coaching_sessions;
create policy "Authenticated users can read cohort coaching sessions"
on public.cohort_coaching_sessions
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert cohort coaching sessions" on public.cohort_coaching_sessions;
create policy "Authenticated users can insert cohort coaching sessions"
on public.cohort_coaching_sessions
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cohort coaching sessions" on public.cohort_coaching_sessions;
create policy "Authenticated users can update cohort coaching sessions"
on public.cohort_coaching_sessions
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete cohort coaching sessions" on public.cohort_coaching_sessions;
create policy "Authenticated users can delete cohort coaching sessions"
on public.cohort_coaching_sessions
for delete
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

drop policy if exists "Authenticated users can read profile details" on public.profile_details;
create policy "Authenticated users can read profile details"
on public.profile_details
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert profile details" on public.profile_details;
create policy "Authenticated users can insert profile details"
on public.profile_details
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update profile details" on public.profile_details;
create policy "Authenticated users can update profile details"
on public.profile_details
for update
to authenticated
using (true)
with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete profile details" on public.profile_details;
create policy "Authenticated users can delete profile details"
on public.profile_details
for delete
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
