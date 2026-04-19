# HabitTerminal — Habit Tracker + Recovery Journey

A production-grade, full-stack habit tracking and recovery monitoring web application with a **GitHub + Terminal** inspired aesthetic ("Editorial Terminalism").

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS v4 (Dark Mode) |
| **State** | Zustand |
| **Charts** | Recharts |
| **Dates** | dayjs |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT (jose) + bcryptjs + httpOnly cookies |

## Features

### 🔄 Daily Task System
- Automatic task generation from recurring habits
- Retroactive generation for missed days
- Idempotent generation (no duplicates)
- Manual one-off tasks
- Complete/uncomplete per-day instances
- Past tasks preserved when habits are edited

### 📋 Habit Management
- Create recurring habits with custom repeat rules
- Daily, Weekdays, Weekends, or Custom day patterns
- Activate/deactivate habits (stops future generation only)
- Priority levels: Low, Nominal, Critical
- Categories for organization

### 🛡️ Recovery Journey
- Live-updating timer showing days, hours, minutes since start
- "I Failed" button with confirmation
- Failure event logging with timestamps
- Milestone tracking (7, 30, 90 days)
- Reset with optional log clearing
- Timer always derived from database

### 📊 Dashboard & Analytics
- GitHub-style contribution heatmap (365 days)
- Current and longest streak calculations
- Completion rate (daily/weekly/monthly)
- Weekly performance trend charts
- Recovery analytics

### 📅 Calendar / History
- Month view with task completion indicators
- Select any date to view tasks and failures
- Failure incident reports per day

### 🔐 Authentication
- Registration & Login
- JWT-based sessions (httpOnly cookies)
- Secure password hashing (bcrypt)

## Project Structure

```
habit-tracker/
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Login, Register, Logout, Me
│   │   │   ├── tasks/         # Task CRUD + generation
│   │   │   ├── habits/        # Habit CRUD
│   │   │   ├── recovery/      # Recovery state + failures
│   │   │   ├── failures/      # Failure log management
│   │   │   └── dashboard/     # Analytics metrics
│   │   ├── today/             # Today's tasks page
│   │   ├── dashboard/         # Analytics dashboard
│   │   ├── recovery/          # Recovery journey page
│   │   ├── calendar/          # Calendar history page
│   │   ├── habits/            # Habit management page
│   │   ├── settings/          # System configuration
│   │   ├── login/             # Auth page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Root redirect
│   │   └── globals.css        # Design system CSS
│   ├── components/
│   │   ├── layout/            # Sidebar, AppShell
│   │   ├── ui/                # StatCard, TaskItem, SectionHeader, EmptyState
│   │   ├── habits/            # HabitForm
│   │   ├── recovery/          # TimerDisplay, FailureLogList
│   │   └── dashboard/         # ContributionHeatmap, ChartWidgets
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT auth utilities
│   │   └── services/          # Business logic services
│   └── store/
│       └── useStore.ts        # Zustand state management
├── .env                       # Environment variables
├── .env.example               # Template env
├── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Install Dependencies

```bash
cd habit-tracker
npm install
```

### 2. PostgreSQL Setup

Make sure PostgreSQL is running. Create a database:

```sql
CREATE DATABASE habit_tracker;
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/habit_tracker?schema=public"
JWT_SECRET="your-secure-random-secret-key"
```

### 4. Run Prisma Migration

```bash
npx prisma migrate dev --name init
```

### 5. Seed Sample Data (Optional)

```bash
npm run db:seed
```

This creates a demo user with 60 days of task history.

**Demo Login:**
- Email: `demo@sovereign.sys`
- Password: `demo1234`

### 6. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

### 7. Prisma Studio (Optional)

```bash
npm run db:studio
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Get current user |
| `/api/tasks` | GET | Get tasks for date |
| `/api/tasks` | POST | Task actions (create/complete/delete/generate) |
| `/api/habits` | GET | Get all habits |
| `/api/habits` | POST | Habit actions (create/update/activate/delete) |
| `/api/recovery` | GET | Get recovery state |
| `/api/recovery` | POST | Recovery actions (fail/reset/setStartTime) |
| `/api/failures` | GET | Get failure logs |
| `/api/failures` | POST | Delete failure log |
| `/api/dashboard` | GET | Get analytics metrics |

## Design System

**Theme:** Editorial Terminalism — "The Sovereign Console"

- **Background:** `#10141a` (deep obsidian)
- **Surface layers:** Tonal depth via background color shifts
- **Accent (Success):** `#6cdd81` (primary green)
- **Info:** `#a2c9ff` (secondary blue)
- **Warning:** `#fabc45` (tertiary gold)
- **Error:** `#ffb4ab`
- **Typography:** Space Grotesk (headlines), Inter (body), JetBrains Mono (code)
- **Corners:** 2-4px maximum (sharp, "hard-tech" feel)
- **No borders for structure** — depth through tonal shifts

## License

MIT
