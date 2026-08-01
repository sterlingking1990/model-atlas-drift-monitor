# model-atlas-drift-monitor

A small dashboard that periodically snapshots the [`model-atlas`](https://github.com/sterlingking1990/model-atlas)
catalog (VAPI + Retell — models, providers, and pricing/quality stats),
diffs it against the last snapshot, and surfaces what changed: models
added/removed per provider, or a stat (price, latency, quality score) that
appeared, disappeared, or changed value.

## Why

Voice-AI platforms add, remove, and reprice models continuously, and none
of that is announced anywhere reliable. This turns `model-atlas`'s live
adapters into a changelog you can actually watch, instead of finding out a
model was deprecated when your app breaks.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. On first load there's no data yet — click
**Check now** to run a live fetch across all 4 adapters (VAPI catalog, VAPI
stats, Retell catalog, Retell stats) and store the first snapshot. Every
check after that diffs against the previous one and adds entries to the
change-history feed.

Copy `.env.example` to `.env.local` if you want:
- `RETELL_API_KEY` — populates real per-provider voice ids for Retell (optional; without it, Retell's voice providers are listed with empty model lists).
- `SLACK_WEBHOOK_URL` — posts a summary to Slack whenever a check finds any drift.
- `CRON_SECRET` — only relevant once deployed (see below).

## How it works

- `src/lib/adapters.ts` — registers the 4 `model-atlas` adapters. A fresh
  adapter instance is built on every check, since each one caches
  internally per-instance and reusing an instance would return stale data
  instead of a real live fetch.
- `src/lib/diff.ts` — pure diff functions. Catalog providers/models are
  compared as **sets**, not arrays, since fetch order isn't guaranteed
  stable between independent live fetches.
- `src/lib/storage.ts` — snapshots and history are plain JSON files under
  `data/` (gitignored): `data/snapshots/<adapter>.json` (last known state)
  and `data/history.jsonl` (append-only diff log). No database needed to
  run this locally. See "Upgrading storage" below for when that stops
  being enough.
- `src/lib/check.ts` — orchestrates a check across all 4 adapters, diffs,
  persists, and (best-effort) notifies Slack if anything changed.
- `src/app/api/check/route.ts` — `POST` (manual button) and `GET` (for
  Vercel Cron) both run a check.

## Retell stats caveat

Retell only publishes per-model **LLM** cost-per-minute pricing (scraped
from its public pricing page — see `model-atlas`'s own docs for the
legitimacy/fragility tradeoffs there). It has no public per-model
quality/latency numbers, and its voice/STT pricing is provider-wide, not
per-model — so the Retell stats card will always show 0 models with stats
for `voice`/`transcriber`. That's expected, not a bug.

## Deploying / scheduling

This isn't deployed yet. `vercel.json` already has a cron entry
(`0 */6 * * *`, hitting `/api/check`) ready for whenever it is — Vercel
Cron only fires once the project is actually deployed there. If you do
deploy it, set `CRON_SECRET` in the Vercel project's env vars; the `GET`
handler then requires `Authorization: Bearer <CRON_SECRET>` (which Vercel
sets automatically on cron-triggered requests) so random internet traffic
can't trigger checks.

## Upgrading storage

The JSON-file approach is deliberately simple: a single local user, a
manual button or a cron every few hours, no concurrent-writer problem
worth solving. If this grows into something with multiple viewers or a
much higher check frequency, swap `src/lib/storage.ts`'s implementation
for Vercel Postgres or KV — nothing else (diff logic, routes, UI) needs to
change, since storage is the only module that touches disk.

## Other shapes considered

"Drift monitor" was one of several `model-atlas` use cases brainstormed
(a CI config validator, a pricing comparison dashboard, a cost-aware model
router). This was built as a web app first; a CLI/cron-script version of
this same drift-monitor idea is a natural variant if a headless version is
ever wanted instead of a dashboard.
