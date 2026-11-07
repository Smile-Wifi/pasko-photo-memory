create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- first account to sign up becomes the admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create type public.order_status as enum ('pending_payment','payment_verified','processing','completed','failed');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  access_token uuid not null default gen_random_uuid(),
  full_name text not null,
  mobile text not null,
  email text,
  package text not null check (package in ('basic','premium')),
  amount integer not null,
  payment_method text not null check (payment_method in ('gcash','maya','bank')),
  payment_reference text,
  status public.order_status not null default 'pending_payment',
  original_path text not null,
  result_paths text[] not null default '{}',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admins read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create index orders_created_idx on public.orders (created_at desc);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "settings public read" on public.app_settings for select to anon, authenticated using (true);
create policy "admins write settings" on public.app_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.app_settings (key, value) values
 ('pricing', '{"basic":99,"premium":149}'),
 ('music', '{"url":null,"title":null}'),
 ('payment', '{"gcash":"0917 000 0000 (XmasMagic PH)","maya":"0918 000 0000 (XmasMagic PH)","bank":"BDO 0000-0000-0000 · XmasMagic PH"}'),
 ('retention_days', '30');

create table public.samples (
  id uuid primary key default gen_random_uuid(),
  style text not null,
  image_url text not null,
  created_at timestamptz not null default now()
);
grant select on public.samples to anon, authenticated;
grant insert, update, delete on public.samples to authenticated;
grant all on public.samples to service_role;
alter table public.samples enable row level security;
create policy "samples public read" on public.samples for select to anon, authenticated using (true);
create policy "admins write samples" on public.samples for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));