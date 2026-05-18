-- doc-report-studio — схема БД для Supabase
-- Выполнить в SQL Editor проекта Supabase один раз при настройке

-- ============================================
-- Профиль пользователя (расширяет auth.users)
-- ============================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  specialty text,        -- например "Рентгенолог", "МРТ-специалист"
  city text,             -- город / страна
  workplace text,        -- клиника / учреждение
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- автоматически создавать профиль при регистрации
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- События приложения (открытия, генерации)
-- ============================================

create table if not exists public.app_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,   -- 'app_opened', 'protocol_generated', 'template_selected'
  app_name text,              -- 'cervical', 'lspine'
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_app_events_user on public.app_events(user_id, created_at desc);
create index if not exists idx_app_events_type on public.app_events(event_type, created_at desc);

alter table public.app_events enable row level security;

create policy "users can insert own events"
  on public.app_events for insert
  with check (auth.uid() = user_id);

create policy "users can view own events"
  on public.app_events for select
  using (auth.uid() = user_id);

-- ============================================
-- Обратная связь
-- ============================================

create table if not exists public.feedback (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  category text,              -- 'bug', 'feature', 'other'
  app_name text,              -- 'cervical', 'lspine', 'general'
  message text not null,
  user_agent text,
  resolved boolean default false,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

-- ============================================
-- Wait-list (для тех, кто пришёл до открытия)
-- ============================================

create table if not exists public.waitlist (
  id bigserial primary key,
  email text unique not null,
  source text,               -- откуда пришли
  created_at timestamptz default now()
);

-- эта таблица доступна для вставки без auth (публичная подписка на лист ожидания)
alter table public.waitlist enable row level security;

create policy "anyone can join waitlist"
  on public.waitlist for insert
  with check (true);
