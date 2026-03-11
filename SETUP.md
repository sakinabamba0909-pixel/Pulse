# Pulse — Setup Guide

## Step 1: Set up the Database

1. Go to your Supabase dashboard → **SQL Editor**
2. If you have old tables, the migration handles cleanup automatically
3. Paste the entire contents of `supabase/001_initial_schema.sql` and click **Run**
4. You should see all tables created successfully

**Verify:** Go to **Table Editor** — you should see 18 tables:
- user_profiles, news_preferences, projects, goals, entries
- tasks, reminders, relationships, commitments, decisions
- documents, sources, email_connections, calendar_connections
- ai_tool_connections, ai_tool_projects, action_log, insights

## Step 2: Enable Auth

1. In Supabase dashboard → **Authentication** → **Providers**
2. Enable **Email** (already enabled by default)
3. Optional: Enable **Google** OAuth for "Sign in with Google"
   - You'll need a Google Cloud project with OAuth credentials
   - Set the redirect URL to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

## Step 3: Set up the Next.js Project

```bash
# Clone or copy the pulse/ folder to your machine
cd pulse

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env.local
```

Edit `.env.local` with your actual values from:
- **Supabase:** Dashboard → Settings → API (URL + anon key + service role key)
- **Anthropic:** console.anthropic.com → API Keys

## Step 4: Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Deploy to Vercel

```bash
# If you have Vercel CLI
vercel

# Or push to GitHub and connect the repo in Vercel dashboard
```

Add the same environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)

## Project Structure

```
pulse/
├── supabase/
│   └── 001_initial_schema.sql    ← Run this in SQL Editor
├── src/
│   ├── app/
│   │   ├── auth/callback/route.ts  ← OAuth callback handler
│   │   ├── api/
│   │   │   └── onboarding/complete/route.ts ← Saves onboarding data
│   │   ├── layout.tsx             ← Root layout (add next)
│   │   └── page.tsx               ← Landing page (add next)
│   ├── components/                ← UI components (add next)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts          ← Browser Supabase client
│   │       └── server.ts          ← Server Supabase client
│   ├── types/
│   │   └── database.ts            ← TypeScript types for all tables
│   └── middleware.ts              ← Auth middleware (protects routes)
├── .env.example                   ← Environment variables template
├── package.json
├── tsconfig.json
└── next.config.js
```

## What's Built So Far

✅ Complete database schema (18 tables, RLS, indexes, triggers, views)
✅ Auth middleware (protects routes, handles session refresh)
✅ OAuth callback (redirects to onboarding if not completed)
✅ Supabase clients (browser + server + admin)
✅ TypeScript types for every table
✅ Onboarding API endpoint (saves all profile data)

## What's Next

Step 2: Login/signup pages + onboarding UI (connected to real DB)
Step 3: Voice conversation loop + AI brain API
Step 4: Morning briefing + news integration
Step 5: Email integration (Gmail OAuth)
Step 6: Deploy to Vercel
