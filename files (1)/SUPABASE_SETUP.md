# Supabase Setup (10 minutes, free)

## Step 1 — Create a Supabase project
1. Go to https://supabase.com and sign up for free
2. Click **New Project**, give it a name (e.g. `centerstage`), set a password, choose a region close to Philippines (Singapore works well)
3. Wait ~2 minutes for it to provision

## Step 2 — Create the 3 tables
Go to **SQL Editor** in your Supabase dashboard and run this:

```sql
create table if not exists songs (
  id text primary key,
  data jsonb not null
);

create table if not exists programs (
  id text primary key,
  data jsonb not null
);

create table if not exists events (
  id text primary key,
  data jsonb not null
);

-- Allow public read/write (fine for a team app with no auth)
alter table songs enable row level security;
alter table programs enable row level security;
alter table events enable row level security;

create policy "public_all" on songs for all using (true) with check (true);
create policy "public_all" on programs for all using (true) with check (true);
create policy "public_all" on events for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table songs;
alter publication supabase_realtime add table programs;
alter publication supabase_realtime add table events;
```

## Step 3 — Get your keys
In your Supabase project go to **Settings → API** and copy:
- **Project URL** (looks like `https://xxxx.supabase.co`)
- **anon public** key (long string starting with `eyJ...`)

## Step 4 — Add keys to your project
In your `worship-app` folder, create a file called `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5 — Install Supabase package
In your terminal inside the `worship-app` folder:
```
npm install @supabase/supabase-js
```

## Step 6 — Add env to Vercel
In your Vercel project dashboard:
1. Go to **Settings → Environment Variables**
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values

## Step 7 — Add logo
Put your `logo.png` file inside the `worship-app/public` folder.
It will show on the splash screen and in the menu.

## Step 8 — Deploy
```
git add .
git commit -m "supabase sync + sections + program selector"
git push
```

That's it! All devices will now sync automatically.
