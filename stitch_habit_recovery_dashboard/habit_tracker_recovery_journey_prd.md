# Habit Tracker + Recovery Journey - Product Requirements Document

## Project Overview
A productivity and self-tracking web application that combines a recurring habit tracker with a recovery timer system. The app features a developer-centric "GitHub + Terminal" aesthetic.

## Tech Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (Dark Mode default)
- **State Management:** Zustand with local persistence
- **Date Handling:** dayjs
- **Visualization:** Recharts (Charts) + Custom GitHub-style heatmap

## Core Modules

### 1. Recovery Journey
- **Time Tracking:** Live-updating timer showing days, hours, and seconds since a starting point.
- **Failure Tracking:** "I Failed" button increments a counter and logs the timestamp.
- **Persistent Storage:** Timer and logs persist across sessions.
- **Management:** Ability to reset the journey or manually adjust the start time.
- **UI Style:** Terminal panels, monospace stats, and log-style history.

### 2. Habit Tracker
- **Recurring Logic:** Supports daily, weekdays, weekends, and custom day rules.
- **Task Generation:** Automatically generates daily task instances for active habits. Retroactive generation for missed days.
- **Task Types:** Recurring habits and one-off tasks.
- **Attributes:** Title, description, category, priority, and completion status stored per date.

### 3. Dashboard & Analytics
- **Metrics:** Completion rates (day/week/month), habit streaks (current/longest), and consistency rankings.
- **Visuals:** GitHub-style contribution heatmap and weekly/monthly performance charts.
- **Recovery Insights:** Streak duration, failure frequency, and time-of-day grouping.

### 4. Navigation & Layout
- **Sidebar Navigation:** Today, Dashboard, Recovery Journey, Calendar, Habits, Settings.
- **Design System:** Near-black background, subtle borders, monospace typography for stats/headers, and status-based accent colors (green, blue, red, yellow).

## Implementation Details
- **Services:** Logic for `generateTasksForDate`, `calculateHabitStreaks`, and `calculateElapsedTime`.
- **Persistence:** All data stored in `localStorage`.
- **UI Components:** Terminal-style cards, command-style headers (`> system/status`), and status badges.