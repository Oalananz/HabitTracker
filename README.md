<div align="center">
  <img src="public/logo.png" alt="HabitTerminal" width="96" />

  # HabitTerminal

  **A full-stack daily discipline operating system with a terminal/hacker aesthetic.**

  Track discipline, worship, recovery, focus, and habits — all in one place. Online or offline.

  <sub>Next.js 16 · TypeScript · Supabase · Tailwind CSS v4 · Offline-first PWA</sub>
</div>

---

## Overview

HabitTerminal is a full-stack, responsive web app designed around the concept of **total daily discipline** — it tracks not just habits and tasks, but a holistic scoring system covering focus hours, all five daily prayers, recovery journeys, sleep, and discipline streaks. The design language is "Editorial Terminalism" — sharp corners, monospace accents, neon green accents, and a deep-obsidian dark theme. It works on desktop and mobile browsers, installs as a PWA, and keeps working offline with a local cache and background sync.

---

## Features

### 🧠 Daily Discipline System (v2.0)
- **Day Record** — One unified record per day capturing focus, worship, discipline, and sleep. Auto-scored 0–10 every time it's updated.
- **DayStatusBanner** — Green / yellow / red status bar: `DAY SECURED` (≥8), `IN PROGRESS` (4–7), `NOT SECURED` (<4 after 8pm).
- **DisciplineCard** — 4-layer tracking panel:
  - **FOCUS_LAYER** — Log hours with +1h/+2h/+4h buttons, custom input, and a terminal block-bar progress display.
  - **WORSHIP_LAYER** — Toggle all 5 daily prayers (Fajr/Dhuhr/Asr/Maghrib/Isha) individually or all at once, plus Quran, Dhikr (morning/evening), Night Prayer, and 12 Sunnah Rakahs.
  - **DISCIPLINE_LAYER** — No Reels / No Masturbation / Low Sugar / No Music / No Yapping toggles, each showing journey-linked streak badges.
  - **SLEEP_LAYER** — Sleep hour stepper with goal progress bar.
- **ScoreDisplay** — Live 0–10 score with per-category point breakdown and streak counters.
- **ActivityLog** — Terminal-style scrolling event log of all actions taken today.

### 🏆 Achievements (42 Total)
- 6 categories: STREAK / SCORE / WORSHIP / FOCUS / DISCIPLINE / COMPOUND
- 5 rarity tiers: COMMON → UNCOMMON → RARE → EPIC → LEGENDARY
- Progress bars for locked achievements, unlock dates for completed ones
- AchievementToast — auto-dismissing top-right notification on unlock, color-coded by rarity
- Sidebar badge pulses with the count of new unseen achievements
- `/achievements` page — accordion grouped by category, filter by locked/unlocked

### 🔄 Today's Tasks
- Auto-generated daily tasks from recurring habits with retroactive catch-up and idempotent generation
- One-off manual tasks with quick-add (`Enter`) or detailed form (`Shift+Enter`)
- **Inline edit** — hover to reveal edit/delete buttons; click edit to expand in-place form with title, description, category, and priority fields. `Enter` to save, `Escape` to cancel.
- Filter by status (Pending/Completed) and category
- Task completion logged to the Activity Log

### 📋 Habit Management
- Recurring habits with custom repeat rules (Daily / Weekdays / Weekends / Custom days)
- Priority levels and activation toggles (future-only effect)

### 🛡️ Recovery Journeys
- Live timer (days / hours / minutes), failure logging with timestamps, milestone tracking (7 / 30 / 90 days)
- **TODAY CLEAN ✓** / **FAILURE LOGGED ✗** status tag on each journey card
- Competitive shared journeys — join, leave, compare against other participants

### 🕌 Prayer Planner
- Day plans organized by prayer block (Fajr / Dhuhr / Asr / Maghrib / Isha)
- Real prayer times via browser geolocation (falls back to stored defaults)
- **PERFORMED ✓** toggle on each prayer block — synced directly with the day record
- **ALL PRAYERS COMPLETE** banner appears when all 5 are done

### 🎯 Goals
- Progress tracking with safe concurrent increments via Postgres RPCs

### 📊 Dashboard & Analytics
- GitHub-style contribution heatmap
- **StreakMatrix** — current vs best for Focus / Prayer / No Reels / Discipline
- **SevenDayReport** — 7-day colored block grid (green → red by score)
- Recent achievements preview with link to full `/achievements` page
- Trend charts and completion rates

### 📅 Calendar / History
- Month view with daily score and completion indicators

### 🔐 Auth
- Supabase Auth (email + Google OAuth) with secure server-side sessions

### 📡 Offline-first PWA
- Local IndexedDB cache (Dexie), sync queue, and service worker

---

## Scoring System

| Category | Points |
|---|---|
| Focus ≥ goal hours | +2 |
| All 5 prayers done | +2 |
| Quran + at least one Dhikr | +2 |
| No Reels | +1 |
| No Masturbation | +1 |
| No Music | +1 |
| Sleep ≥ goal hours | +1 |
| **Max** | **10** |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (dark mode) |
| State | Zustand |
| Charts | Recharts |
| Dates | dayjs |
| Backend / DB / Auth | Supabase (PostgreSQL + Auth) |
| Offline storage | Dexie (IndexedDB) + service worker |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your Supabase credentials (found under **Settings → API** in the Supabase dashboard):

```bash
cp .env.example .env.local
```

### 3. Set up the database

In the Supabase **SQL Editor**, run the migrations **in order**:

1. `supabase/migration.sql` — core schema (users, habits, tasks, recovery)
2. `supabase/auth_integration.sql` — auth profile triggers
3. `supabase/migration_v2_journeys_goals.sql` — journeys & goals
4. Files in `supabase/migrations/` — planner / prayer / competitive features
5. `supabase-migration.sql` — RPCs (`increment_goal_progress`, `increment_journey_failure`)
6. **`supabase/migration_v3_day_records_achievements.sql`** — v2.0 system (day records, achievements, user stats, preferences, scoring trigger, streak calculator)

### 4. Run the dev server

```bash
npm run dev
```

Visit **http://localhost:3000**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── app/                      # App Router pages + API routes
│   ├── api/                  # Route handlers
│   │   ├── tasks/            # Task CRUD + monthly aggregation
│   │   ├── habits/           # Habit management
│   │   ├── day-record/       # Daily discipline record (GET + POST)
│   │   ├── achievements/     # 42 achievement definitions + unlock status
│   │   ├── user-stats/       # Streak matrix + cumulative totals
│   │   ├── user-preferences/ # Focus/sleep goals + notifications
│   │   ├── journeys/         # Recovery + competitive journeys
│   │   ├── goals/            # Goal progress
│   │   └── …
│   ├── today/                # Today page (DisciplineCard + tasks)
│   ├── achievements/         # Achievements page (42 with rarity + progress)
│   ├── dashboard/            # Analytics + streak matrix + 7-day report
│   ├── prayer-planner/       # Prayer-block day planner
│   ├── recovery/             # Recovery journeys
│   ├── goals/  calendar/  habits/  settings/  login/  planner/
│   ├── layout.tsx            # Root layout (PWA manifest, fonts)
│   └── globals.css           # Design-system tokens
├── components/
│   ├── today/                # DisciplineCard, DayStatusBanner, ScoreDisplay, ActivityLog
│   ├── achievements/         # AchievementCard, AchievementToast
│   ├── dashboard/            # StreakMatrix, SevenDayReport, ChartWidgets, Heatmap
│   ├── recovery/             # TimerDisplay, FailureLogList, CompetitiveMode
│   ├── planner/              # PlanCard, PlanForm
│   ├── layout/               # Sidebar, TopBar
│   └── ui/                   # TaskItem (inline edit), StatCard, SectionHeader, …
├── lib/
│   ├── services/
│   │   └── dayRecordService.ts  # Typed day record CRUD + RPC wrapper
│   └── offline/              # Dexie cache + sync queue + network status
├── store/useStore.ts          # Zustand store (tasks, day record, achievements, stats, …)
└── middleware.ts              # Session refresh
supabase/                      # SQL schema, auth, migrations
```

---

## Design System

**Editorial Terminalism — "The Sovereign Console"**

- **Background:** `#10141a` (deep obsidian), depth via tonal shifts rather than borders
- **Primary accent:** `#6cdd81` (neon green) — active states, scores, streaks
- **Info:** `#a2c9ff` · **Warning:** `#fabc45` · **Error:** `#ffb4ab`
- **Type:** Space Grotesk (headlines), Inter (body), JetBrains Mono (code/terminal)
- **Corners:** 2–4px max for a sharp, hard-tech feel
- **Terminal conventions:** `> command --flag` headings, `[LOG]` style entries, block-character progress bars (`█░`)
