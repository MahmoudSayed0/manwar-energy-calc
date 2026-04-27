-- 0001_initial_schema.sql
create table appliances (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_ar     text not null,
  name_en     text not null,
  category    text not null check (category in ('cooling','lighting','kitchen','media','laundry','other')),
  inductive   boolean not null default false,
  icon        text not null,
  notes_ar    text,
  notes_en    text,
  sort_order  int  not null default 100,
  created_at  timestamptz not null default now()
);

create table appliance_variants (
  id              uuid primary key default gen_random_uuid(),
  appliance_id    uuid not null references appliances(id) on delete cascade,
  variant_label_ar text not null,
  variant_label_en text not null,
  running_watts   int  not null check (running_watts >= 0),
  surge_watts     int  not null check (surge_watts >= running_watts),
  sort_order      int  not null default 100,
  created_at      timestamptz not null default now()
);

create index appliance_variants_appliance_id_idx on appliance_variants(appliance_id);

create table shops (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  governorate     text not null check (governorate in ('Cairo','Giza','Alexandria','Other')),
  area            text not null,
  whatsapp_number text not null,
  maps_url        text not null,
  facebook_url    text,
  specialty_tags  text[] not null default '{}',
  is_active       boolean not null default true,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index shops_active_governorate_idx on shops(is_active, governorate);

create table pricing (
  id                       uuid primary key default gen_random_uuid(),
  inverter_egp_per_kw_min  int not null,
  inverter_egp_per_kw_max  int not null,
  battery_egp_per_wh_min   numeric(5,2) not null,
  battery_egp_per_wh_max   numeric(5,2) not null,
  effective_from           date not null default current_date
);

-- RLS: public read on appliances, variants, shops, pricing
alter table appliances           enable row level security;
alter table appliance_variants   enable row level security;
alter table shops                enable row level security;
alter table pricing              enable row level security;

create policy "appliances are public"   on appliances           for select using (true);
create policy "variants are public"     on appliance_variants   for select using (true);
create policy "active shops are public" on shops                for select using (is_active = true);
create policy "pricing is public"       on pricing              for select using (true);
