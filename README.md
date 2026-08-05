# Social Content Tracker

Internal planning and production tracker for the team's LinkedIn, Instagram,
and X content — calendar + list views, post lifecycle, holiday/regulatory
content triggers, gap-fill suggestions, idea backlog, and an archive with
Excel export. Built to the [Social Content Tracker PRD](../Social%20Media/Social_Content_Tracker_PRD.docx),
matching the stack and conventions of the existing [work-tracker](../work-tracker)
app so both deploy the same way.

Doesn't publish anything — posting to each platform stays manual. This just
makes sure nothing is missed and finished work is easy to find later.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · raw `pg` against
Vercel/Neon Postgres (no ORM) · Vercel Blob for collateral · `xlsx` for the
archive export. No login system — see "Access model" below.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `POSTGRES_URL` (or `DATABASE_URL`) | Everything | Any Postgres connection string — Vercel Postgres, Neon, Supabase, etc. Tables are created automatically on first request. |
| `BLOB_READ_WRITE_TOKEN` | Collateral upload | From a Vercel Blob store. Without it, the "Upload" button 501s but linking to existing storage (pasting a URL) still works. |
| `TEAMS_WEBHOOK_URL` | Notifications | An [incoming webhook](https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) URL for the team's Teams channel. |
| `CRON_SECRET` | Notifications (prod) | Any random string. Vercel Cron sends it automatically once set in the project's env vars; without it the check route is open to anyone. |

Without a database configured, every page still renders (nav, calendar
grid, forms) — only the data-dependent parts show a loading state, since
the API routes 500 on the DB connection. That's expected in a sandbox with
no live Postgres attached; point `POSTGRES_URL` at a real instance to see
data flow end to end.

## Deploying

Same pattern as work-tracker: push to a Vercel project, add the env vars
above, done. `vercel.json` already schedules the daily notification check
(8am UTC) via Vercel Cron.

## Access model

There's no login (matching work-tracker). The top-right picker in the nav
bar is "who am I" — selecting one of the four editor names unlocks every
edit action; leaving it on "Viewer" is read-only. This is the two-tier
model from the PRD without building real auth for a four-person team with
no approval workflow. If the team later wants real access control, swap
`lib/current-user.tsx` for NextAuth (or similar) without touching the API
routes — they already gate on an `x-current-user` header, they just don't
verify it cryptographically yet.

## What's implemented vs. simplified

Everything in the PRD's MVP roadmap (§17.1) is here in some form. A few
things are intentionally simplified rather than fully built out, called out
so nothing is mistaken for a bug:

- **Holiday `post_trigger` flags** (which occasions are worth a post vs.
  purely reference) are an editorial starting point in `lib/holiday-seed.ts`,
  not a final answer — correct any individual call via `PATCH
  /api/holidays/:id` (no dedicated admin UI yet, curl or a quick script).
- **Eid Al Fitr / Eid Al Adha** for Qatar, KSA, and UAE load with `date:
  null, tbc: true` — the source calendars don't publish even a provisional
  date. Fill in the real date the same way once the Ministry announces it;
  that clears `tbc` and lets it flow into the suggestion engine.
- **Cross-region holiday merging**: the same occasion on the same date
  across regions (Diwali landing on Nov 8, 2026 in both the India and USA
  lists is the real case that drove this) surfaces as one suggestion
  tagged with every region it applies to, computed live in
  `lib/suggestions.ts` — not deduplicated in storage.
- **IPO India/KSA recurring rules** have no fixed target date (per the
  PRD's own open decision) — `last_post_date` carries the two reference
  anchors from the PRD conversation (India: Jul 22, 2026; KSA: baseline
  unset) so the gap-fill clock has somewhere to start.
- **Regulatory calendar** ships with the five dates that survived the PRD
  review (`lib/regulatory-seed.ts`) — US SEC 10-Q, UAE Corporate Tax, CBAM,
  California SB 253, India DPDP. Everything else considered got cut in that
  conversation; add more via `createRegulatoryDate` if priorities change.
- **Teams notifications** post to one shared channel via incoming webhook,
  naming the owner in plain text — not a real per-person @mention. Graph
  API is the acknowledged v2 upgrade (PRD §16, §18).
- **Comments** (`/api/posts/:id/comments`) exist as an API but have no
  dedicated UI panel yet — wire them into the post form when that's next.

## Project layout

```
app/            Pages (calendar, list, backlog, archive) + API routes
components/     PostForm, TopNav, PipelineHealthStrip, SuggestionsPanel, StatusBadge
lib/db.ts       Postgres pool, schema, and all CRUD
lib/types.ts    Shared domain types
lib/*-seed.ts   Holiday / regulatory / recurring-rule seed data
lib/suggestions.ts   Gap-fill / holiday / regulatory suggestion computation
lib/notify.ts   Teams webhook + daily alert batching
lib/style-check.ts   Caption style compliance (soft warnings)
lib/current-user.tsx Lightweight "who am I" stand-in for auth
```
