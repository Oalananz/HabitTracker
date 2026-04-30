const fs = require('fs');

const path = 'src/app/planner/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard imports with calendar imports
content = content.replace(
  "import dayjs from 'dayjs';",
  "import dayjs from 'dayjs';\nimport { Calendar, momentLocalizer, Views } from 'react-big-calendar';\nimport moment from 'moment';\nimport 'react-big-calendar/lib/css/react-big-calendar.css';"
);

// Add localizer
const viewModeRegex = "type ViewMode = 'daily' | 'weekly' | 'monthly' | 'overview';";
content = content.replace(
  viewModeRegex,
  "type ViewMode = 'daily' | 'weekly' | 'monthly' | 'overview';\n\nconst localizer = momentLocalizer(moment);"
);

// Build events from filteredPlans
const plansByDateRegex = "const plansByDate = filteredPlans.reduce<Record<string, typeof plans>>((acc, plan) => {";
const calendarEvents = `
  const events = filteredPlans.map(p => {
    const start = new Date(p.startDate);
    let end = p.endDate ? new Date(p.endDate) : new Date(dayjs(p.startDate).add(1, 'hour').toDate());
    return {
      id: p.id,
      title: p.title,
      start,
      end,
      resource: p
    };
  });

  const onSelectEvent = (event: any) => {
    setEditingPlan(event.id);
    setShowForm(true);
  };
`;

content = content.replace(plansByDateRegex, calendarEvents + '\n  ' + plansByDateRegex);

const renderingCutoffRegex = /\{view === 'overview' \? \([\s\S]*\}\)/;

let calendarRenderStr = `
{<div style={{ height: '70vh' }} className="bg-surface-container-lowest p-2 rounded-md border border-outline-variant/15">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={view === 'monthly' ? Views.MONTH : view === 'weekly' ? Views.WEEK : Views.DAY}
          view={view === 'monthly' ? Views.MONTH : view === 'weekly' ? Views.WEEK : Views.DAY}
          onView={(newView) => {
            if (newView === Views.MONTH) setView('monthly');
            else if (newView === Views.WEEK) setView('weekly');
            else setView('daily');
          }}
          date={view === 'monthly' ? currentMonth.toDate() : dayjs(plannerDate).toDate()}
          onNavigate={(newDate) => {
            if (view === 'monthly') setCurrentMonth(dayjs(newDate));
            else setPlannerDate(dayjs(newDate).format('YYYY-MM-DD'));
          }}
          onSelectEvent={onSelectEvent}
          style={{ height: '100%', color: 'white' }}
          eventPropGetter={(event) => {
            const p = event.resource;
            let backgroundColor = '#333';
            if (p.status === 'completed') backgroundColor = '#10b981';
            else if (p.status === 'in_progress') backgroundColor = '#f59e0b';
            else if (p.status === 'planned') backgroundColor = '#3b82f6';
            return { style: { backgroundColor, borderRadius: '4px', border: 'none', color: 'white', padding: '2px 4px', fontSize: '12px' } };
          }}
        />
      </div>}
`;

content = content.replace(renderingCutoffRegex, calendarRenderStr);

fs.writeFileSync(path, content, 'utf8');
