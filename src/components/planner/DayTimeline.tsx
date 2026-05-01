'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  occurrenceKey?: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  prayerBlock: string | null;
  startTime: string | null;  // "HH:mm"
  endTime: string | null;    // "HH:mm"
}

interface DayTimelineProps {
  date: string;             // YYYY-MM-DD
  events: TimelineEvent[];
  onCreateSlot: (startTime: string, endTime: string) => void;
  onMoveEvent: (id: string, startTime: string, endTime: string) => void;
  onResizeEvent: (id: string, startTime: string, endTime: string) => void;
  onSelectEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

// ── Constants ──────────────────────────────────────────────

const HOUR_HEIGHT = 64;            // px per hour
const TOTAL_HOURS = 24;
const TOTAL_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;
const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  planned:     { bg: 'rgba(162, 201, 255, 0.15)', border: 'rgba(162, 201, 255, 0.5)', text: '#a2c9ff' },
  in_progress: { bg: 'rgba(250, 188, 69, 0.15)',  border: 'rgba(250, 188, 69, 0.5)',  text: '#fabc45' },
  completed:   { bg: 'rgba(108, 221, 129, 0.15)', border: 'rgba(108, 221, 129, 0.5)', text: '#6cdd81' },
  cancelled:   { bg: 'rgba(255, 180, 171, 0.15)', border: 'rgba(255, 180, 171, 0.45)', text: '#ffb4ab' },
};

// ── Helpers ────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const clamped = Math.max(0, Math.min(1440, m));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function snapMinutes(m: number): number {
  return Math.round(m / SNAP_MINUTES) * SNAP_MINUTES;
}

function formatTimeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Component ──────────────────────────────────────────────

export default function DayTimeline({
  date, events, onCreateSlot, onMoveEvent, onResizeEvent, onSelectEvent, onDeleteEvent,
}: DayTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Interaction states
  const [dragState, setDragState] = useState<{
    type: 'select' | 'move' | 'resize';
    startY: number;
    currentY: number;
    eventId?: string;
    eventKey?: string;
    offsetMinutes?: number;  // for move: cursor offset from event start
    originalStart?: number;
    originalEnd?: number;
  } | null>(null);

  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Scroll to ~7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, [date]);

  // ── Coordinate helpers ──

  const yToMinutes = useCallback((clientY: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relY = clientY - rect.top;
    return snapMinutes(Math.max(0, Math.min(1440, (relY / TOTAL_HEIGHT) * 1440)));
  }, []);

  const minutesToY = useCallback((minutes: number): number => {
    return (minutes / 1440) * TOTAL_HEIGHT;
  }, []);

  // ── Timed events (with valid times) ──

  const timedEvents = useMemo(() =>
    events.filter(e => e.startTime && e.endTime).map((e, index) => ({
      ...e,
      eventKey: e.occurrenceKey || `${e.id}:${e.startTime}:${e.endTime}:${index}`,
      startMin: timeToMinutes(e.startTime!),
      endMin: timeToMinutes(e.endTime!),
    })),
  [events]);

  // ── Drag-to-select on empty area ──

  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on left click, on the grid itself
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-event-block]') || target.closest('[data-resize-handle]')) return;

    const minutes = yToMinutes(e.clientY);
    setDragState({ type: 'select', startY: minutes, currentY: minutes });
  }, [yToMinutes]);

  // ── Drag-to-move an event ──

  const handleEventMouseDown = useCallback((e: React.MouseEvent, eventKey: string, startMin: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const cursorMin = yToMinutes(e.clientY);
    const ev = timedEvents.find(ev => ev.eventKey === eventKey);
    if (!ev) return;

    setDragState({
      type: 'move',
      startY: cursorMin,
      currentY: cursorMin,
      eventId: ev.id,
      eventKey,
      offsetMinutes: cursorMin - startMin,
      originalStart: ev.startMin,
      originalEnd: ev.endMin,
    });
  }, [yToMinutes, timedEvents]);

  // ── Resize handle ──

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, eventKey: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const ev = timedEvents.find(ev => ev.eventKey === eventKey);
    if (!ev) return;

    setDragState({
      type: 'resize',
      startY: ev.endMin,
      currentY: yToMinutes(e.clientY),
      eventId: ev.id,
      eventKey,
      originalStart: ev.startMin,
      originalEnd: ev.endMin,
    });
  }, [yToMinutes, timedEvents]);

  // ── Global mouse move / up ──

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minutes = yToMinutes(e.clientY);
      setDragState(prev => prev ? { ...prev, currentY: minutes } : null);
    };

    const handleMouseUp = () => {
      if (!dragState) return;

      if (dragState.type === 'select') {
        const start = Math.min(dragState.startY, dragState.currentY);
        const end = Math.max(dragState.startY, dragState.currentY);
        if (end - start >= MIN_DURATION_MINUTES) {
          onCreateSlot(minutesToTime(start), minutesToTime(end));
        }
      } else if (dragState.type === 'move' && dragState.eventId != null) {
        const delta = dragState.currentY - dragState.startY;
        const duration = (dragState.originalEnd || 0) - (dragState.originalStart || 0);
        let newStart = snapMinutes((dragState.originalStart || 0) + delta);
        newStart = Math.max(0, Math.min(1440 - duration, newStart));
        const newEnd = newStart + duration;
        if (newStart !== dragState.originalStart) {
          onMoveEvent(dragState.eventId, minutesToTime(newStart), minutesToTime(newEnd));
        }
      } else if (dragState.type === 'resize' && dragState.eventId != null) {
        const newEnd = Math.max((dragState.originalStart || 0) + MIN_DURATION_MINUTES, dragState.currentY);
        if (newEnd !== dragState.originalEnd) {
          onResizeEvent(dragState.eventId, minutesToTime(dragState.originalStart || 0), minutesToTime(snapMinutes(newEnd)));
        }
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onCreateSlot, onMoveEvent, onResizeEvent, yToMinutes]);

  // ── Compute selection preview ──

  const selectionPreview = useMemo(() => {
    if (!dragState || dragState.type !== 'select') return null;
    const start = Math.min(dragState.startY, dragState.currentY);
    const end = Math.max(dragState.startY, dragState.currentY);
    return { startMin: start, endMin: end };
  }, [dragState]);

  // ── Compute move preview positions ──

  const movePreview = useMemo(() => {
    if (!dragState || dragState.type !== 'move' || !dragState.eventId || !dragState.eventKey) return null;
    const delta = dragState.currentY - dragState.startY;
    const duration = (dragState.originalEnd || 0) - (dragState.originalStart || 0);
    let newStart = snapMinutes((dragState.originalStart || 0) + delta);
    newStart = Math.max(0, Math.min(1440 - duration, newStart));
    return { eventId: dragState.eventId, eventKey: dragState.eventKey, startMin: newStart, endMin: newStart + duration };
  }, [dragState]);

  // ── Compute resize preview ──

  const resizePreview = useMemo(() => {
    if (!dragState || dragState.type !== 'resize' || !dragState.eventId || !dragState.eventKey) return null;
    const newEnd = Math.max((dragState.originalStart || 0) + MIN_DURATION_MINUTES, dragState.currentY);
    return { eventId: dragState.eventId, eventKey: dragState.eventKey, startMin: dragState.originalStart || 0, endMin: snapMinutes(newEnd) };
  }, [dragState]);

  // ── Now marker ──

  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const isToday = date === new Date().toISOString().split('T')[0];

  // ── Render ──

  return (
    <div
      ref={scrollRef}
      className="relative bg-surface-container-lowest border border-outline-variant/15 rounded-md overflow-y-auto"
      style={{ height: '720px' }}
    >
      <div
        ref={containerRef}
        className="relative select-none"
        style={{ height: `${TOTAL_HEIGHT}px`, cursor: dragState?.type === 'select' ? 'crosshair' : dragState ? 'grabbing' : 'default' }}
        onMouseDown={handleContainerMouseDown}
      >
        {/* ── Hour lines ── */}
        {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-outline-variant/10 flex"
            style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
          >
            {/* Time label */}
            <div className="w-14 flex-shrink-0 pr-2 pt-1 text-right">
              <span className="font-mono text-[10px] text-outline">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
            {/* Half-hour line */}
            <div className="flex-1 relative">
              <div
                className="absolute left-0 right-0 border-t border-outline-variant/5"
                style={{ top: `${HOUR_HEIGHT / 2}px` }}
              />
            </div>
          </div>
        ))}

        {/* ── Now indicator ── */}
        {isToday && (
          <div
            className="absolute left-14 right-0 z-30 pointer-events-none flex items-center"
            style={{ top: `${minutesToY(nowMinutes)}px` }}
          >
            <div className="w-2 h-2 rounded-full bg-error flex-shrink-0 -ml-1" />
            <div className="flex-1 h-[1.5px] bg-error/70" />
          </div>
        )}

        {/* ── Selection preview ── */}
        {selectionPreview && selectionPreview.endMin - selectionPreview.startMin >= MIN_DURATION_MINUTES && (
          <div
            className="absolute left-14 right-2 rounded-md z-20 pointer-events-none border-2 border-dashed border-primary/60 bg-primary/10 flex flex-col items-center justify-center"
            style={{
              top: `${minutesToY(selectionPreview.startMin)}px`,
              height: `${minutesToY(selectionPreview.endMin) - minutesToY(selectionPreview.startMin)}px`,
            }}
          >
            <span className="font-mono text-[11px] text-primary font-bold">
              {formatTimeLabel(minutesToTime(selectionPreview.startMin))} – {formatTimeLabel(minutesToTime(selectionPreview.endMin))}
            </span>
            <span className="font-label text-[9px] text-primary/70 uppercase tracking-widest mt-0.5">
              Release to create
            </span>
          </div>
        )}

        {/* ── Event blocks ── */}
        {timedEvents.map(ev => {
          const isMoving = movePreview?.eventKey === ev.eventKey;
          const isResizing = resizePreview?.eventKey === ev.eventKey;
          const startMin = isMoving ? movePreview.startMin : isResizing ? resizePreview.startMin : ev.startMin;
          const endMin = isMoving ? movePreview.endMin : isResizing ? resizePreview.endMin : ev.endMin;
          const colors = STATUS_COLORS[ev.status] || STATUS_COLORS.planned;
          const isDragging = isMoving || isResizing;
          const isHovered = hoveredEvent === ev.eventKey;
          const blockHeight = minutesToY(endMin) - minutesToY(startMin);

          return (
            <div
              key={ev.eventKey}
              data-event-block="true"
              className={`absolute left-14 right-2 rounded-md overflow-hidden transition-shadow ${
                isDragging ? 'shadow-lg z-40 opacity-90' : 'z-10'
              }`}
              style={{
                top: `${minutesToY(startMin)}px`,
                height: `${Math.max(blockHeight, 20)}px`,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                cursor: dragState?.type === 'move' ? 'grabbing' : 'grab',
              }}
              onMouseDown={e => handleEventMouseDown(e, ev.eventKey, startMin)}
              onMouseEnter={() => setHoveredEvent(ev.eventKey)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              {/* Content */}
              <div className="px-2.5 py-1.5 h-full flex flex-col justify-between min-h-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="font-headline text-[12px] font-semibold truncate" style={{ color: colors.text }}>
                      {ev.title}
                    </div>
                    {blockHeight > 40 && (
                      <div className="font-mono text-[9px] mt-0.5" style={{ color: colors.text, opacity: 0.7 }}>
                        {formatTimeLabel(minutesToTime(startMin))} – {formatTimeLabel(minutesToTime(endMin))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {(isHovered && !isDragging) && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); onSelectEvent(ev.id); }}
                        className="p-0.5 rounded-sm hover:bg-white/10 transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[13px]" style={{ color: colors.text }}>edit</span>
                      </button>
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                        className="p-0.5 rounded-sm hover:bg-white/10 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[13px] text-error">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {blockHeight > 56 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {ev.category && (
                      <span className="px-1 py-px rounded-[2px] bg-white/5 font-label text-[8px] uppercase tracking-wider" style={{ color: colors.text }}>
                        {ev.category}
                      </span>
                    )}
                    {ev.prayerBlock && (
                      <span className="px-1 py-px rounded-[2px] bg-white/5 font-label text-[8px] uppercase tracking-wider text-primary">
                        {ev.prayerBlock}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Resize handle */}
              <div
                data-resize-handle="true"
                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize"
                onMouseDown={e => handleResizeMouseDown(e, ev.eventKey)}
              >
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-white/20 group-hover/resize:bg-white/50 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
