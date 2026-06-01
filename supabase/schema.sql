-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  phone text,
  stripe_customer_id text,
  stripe_account_id text,
  subscription_tier text default 'free',
  subscription_status text default 'inactive',
  flip_score_scans_used int default 0,
  photo_scans_used int default 0,
  created_at timestamptz default now()
);

-- LEGO Sets master catalog
create table public.lego_sets (
  id serial primary key,
  set_number text unique not null,
  name text not null,
  theme text,
  subtheme text,
  year_released int,
  retail_price numeric,
  piece_count int,
  image_url text,
  is_retired boolean default false,
  retirement_date date,
  bricklink_avg_price numeric,
  ebay_avg_price numeric,
  last_price_update timestamptz,
  flip_score int,
  flip_score_reasoning text,
  flip_score_updated_at timestamptz,
  created_at timestamptz default now()
);

-- User portfolio
create table public.portfolio_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  set_id int references public.lego_sets(id),
  condition text not null,
  quantity int default 1,
  purchase_price numeric,
  purchase_date date,
  notes text,
  created_at timestamptz default now()
);

-- Marketplace listings
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  set_id int references public.lego_sets(id),
  title text not null,
  description text,
  price numeric not null,
  condition text not null,
  is_trade_ok boolean default false,
  trade_wants text,
  images text[],
  status text default 'active',
  views int default 0,
  location text,
  stripe_payment_intent_id text,
  buyer_id uuid references public.profiles(id),
  sold_at timestamptz,
  created_at timestamptz default now()
);

-- Listing messages / inbox
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Trade matchmaking
create table public.trade_offers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  have_set_ids int[],
  want_set_ids int[],
  notes text,
  status text default 'open',
  matched_with uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Trade matches
create table public.trade_matches (
  id uuid default gen_random_uuid() primary key,
  offer_a_id uuid references public.trade_offers(id),
  offer_b_id uuid references public.trade_offers(id),
  user_a_id uuid references public.profiles(id),
  user_b_id uuid references public.profiles(id),
  match_score numeric,
  status text default 'pending',
  user_a_accepted boolean default false,
  user_b_accepted boolean default false,
  fee_paid boolean default false,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

-- Deal scanner watches
create table public.deal_watches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  set_ids int[],
  max_price numeric,
  radius_miles int default 50,
  zip_code text,
  notify_sms boolean default true,
  notify_email boolean default true,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Deals found by scanner
create table public.deals_found (
  id uuid default gen_random_uuid() primary key,
  set_id int references public.lego_sets(id),
  platform text,
  listing_url text unique,
  listed_price numeric,
  estimated_value numeric,
  roi_percent numeric,
  location text,
  zip_code text,
  raw_title text,
  raw_description text,
  image_url text,
  is_active boolean default true,
  found_at timestamptz default now()
);

-- Deal alerts sent
create table public.deal_alerts_sent (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references public.deals_found(id),
  user_id uuid references public.profiles(id),
  sent_via text,
  sent_at timestamptz default now()
);

-- Flip leaderboard entries
create table public.flip_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  set_id int references public.lego_sets(id),
  bought_price numeric not null,
  sold_price numeric not null,
  bought_at date,
  sold_at date,
  found_where text,
  proof_image_url text,
  notes text,
  roi_percent numeric generated always as (((sold_price - bought_price) / bought_price) * 100) stored,
  profit_dollars numeric generated always as (sold_price - bought_price) stored,
  is_verified boolean default false,
  upvotes int default 0,
  week_number int,
  year int,
  created_at timestamptz default now()
);

-- Weekly champions
create table public.weekly_champions (
  id uuid default gen_random_uuid() primary key,
  flip_entry_id uuid references public.flip_entries(id),
  user_id uuid references public.profiles(id),
  week_number int not null,
  year int not null,
  roi_percent numeric,
  created_at timestamptz default now()
);

-- Budget builder plans
create table public.budget_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  budget_amount numeric not null,
  goal text not null,
  timeline_months int,
  risk_tolerance text,
  theme_preference text,
  ai_plan jsonb,
  projected_return numeric,
  projected_roi_percent numeric,
  created_at timestamptz default now()
);

-- Price alerts
create table public.price_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  set_id int references public.lego_sets(id),
  target_price numeric not null,
  alert_when text default 'below',
  is_triggered boolean default false,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Upvotes (so users can only upvote once per flip)
create table public.flip_upvotes (
  id uuid default gen_random_uuid() primary key,
  flip_entry_id uuid references public.flip_entries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(flip_entry_id, user_id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.listings enable row level security;
alter table public.messages enable row level security;
alter table public.trade_offers enable row level security;
alter table public.trade_matches enable row level security;
alter table public.deal_watches enable row level security;
alter table public.deals_found enable row level security;
alter table public.deal_alerts_sent enable row level security;
alter table public.flip_entries enable row level security;
alter table public.weekly_champions enable row level security;
alter table public.budget_plans enable row level security;
alter table public.price_alerts enable row level security;
alter table public.flip_upvotes enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Portfolio
create policy "Users manage own portfolio" on public.portfolio_items for all using (auth.uid() = user_id);

-- Listings: public read, owner write
create policy "Listings are public" on public.listings for select using (true);
create policy "Sellers manage own listings" on public.listings for all using (auth.uid() = seller_id);

-- Messages
create policy "Users see own messages" on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Users send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Trade offers
create policy "Trade offers are public" on public.trade_offers for select using (true);
create policy "Users manage own trades" on public.trade_offers for all using (auth.uid() = user_id);

-- Trade matches
create policy "Users see own trade matches" on public.trade_matches for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Deal watches
create policy "Users manage own watches" on public.deal_watches for all using (auth.uid() = user_id);

-- Deals found: public read
create policy "Deals are public" on public.deals_found for select using (true);

-- Deal alerts
create policy "Users see own alerts" on public.deal_alerts_sent for select using (auth.uid() = user_id);

-- Flip entries
create policy "Flip entries are public" on public.flip_entries for select using (true);
create policy "Users manage own flips" on public.flip_entries for insert with check (auth.uid() = user_id);
create policy "Users update own flips" on public.flip_entries for update using (auth.uid() = user_id);

-- Weekly champions
create policy "Weekly champions are public" on public.weekly_champions for select using (true);

-- Budget plans
create policy "Users manage own budgets" on public.budget_plans for all using (auth.uid() = user_id);

-- Price alerts
create policy "Users manage own alerts" on public.price_alerts for all using (auth.uid() = user_id);

-- Flip upvotes
create policy "Upvotes are public" on public.flip_upvotes for select using (true);
create policy "Users manage own upvotes" on public.flip_upvotes for all using (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed a few sample LEGO sets
insert into public.lego_sets (set_number, name, theme, year_released, retail_price, piece_count, image_url, is_retired)
values
  ('10307', 'Eiffel Tower', 'Icons', 2022, 629.99, 10001, 'https://images.brickset.com/sets/images/10307-1.jpg', false),
  ('75192', 'Millennium Falcon', 'Star Wars', 2017, 849.99, 7541, 'https://images.brickset.com/sets/images/75192-1.jpg', false),
  ('10294', 'Titanic', 'Icons', 2021, 679.99, 9090, 'https://images.brickset.com/sets/images/10294-1.jpg', false),
  ('71374', 'Nintendo Entertainment System', 'Icons', 2020, 229.99, 2646, 'https://images.brickset.com/sets/images/71374-1.jpg', true),
  ('21325', 'Medieval Blacksmith', 'Ideas', 2021, 179.99, 2164, 'https://images.brickset.com/sets/images/21325-1.jpg', true),
  ('75981', 'Harry Potter Advent Calendar', 'Harry Potter', 2020, 39.99, 335, 'https://images.brickset.com/sets/images/75981-1.jpg', true),
  ('42143', 'Ferrari Daytona SP3', 'Technic', 2022, 449.99, 3778, 'https://images.brickset.com/sets/images/42143-1.jpg', false),
  ('10316', 'The Lord of the Rings: Rivendell', 'Icons', 2023, 499.99, 6167, 'https://images.brickset.com/sets/images/10316-1.jpg', false),
  ('76419', 'Hogwarts Castle and Grounds', 'Harry Potter', 2023, 469.99, 2660, 'https://images.brickset.com/sets/images/76419-1.jpg', false),
  ('21340', 'Tales of the Space Age', 'Ideas', 2023, 99.99, 688, 'https://images.brickset.com/sets/images/21340-1.jpg', false);
