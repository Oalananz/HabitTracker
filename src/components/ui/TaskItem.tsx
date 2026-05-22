'use client';

import { useState } from 'react';

interface TaskItemProps {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  completed: boolean;
  sourceType: string;
  onToggle: (id: string, completed: boolean) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  style?: React.CSSProperties;
}

export default function TaskItem({
  id,
  title,
  description,
  category,
  priority,
  completed,
  sourceType,
  onToggle,
  onDelete,
  onEdit,
  style,
}: TaskItemProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const ribbonColor = completed
    ? 'bg-primary'
    : priority === 'critical'
    ? 'bg-tertiary'
    : priority === 'low'
    ? 'bg-on-surface-variant'
    : 'bg-secondary';

  const priorityLabel = priority === 'critical' ? 'HIGH PRIO' : priority === 'low' ? 'LOW PRIO' : 'MED PRIO';
  const priorityColor = priority === 'critical' ? 'text-tertiary' : priority === 'low' ? 'text-on-surface-variant' : 'text-secondary';

  const handleToggle = () => {
    if (!completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle(id, completed);
  };

  return (
    <div
      className={`group relative bg-surface-container-low rounded-md p-4 flex gap-4 items-start transition-all duration-200 ${
        completed
          ? 'opacity-50'
          : 'hover:bg-surface-container-high hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20'
      }`}
      style={style}
    >
      {/* Status Ribbon */}
      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${ribbonColor} rounded-l-md transition-colors duration-300`} />

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 border-2 rounded-[2px] flex items-center justify-center transition-all duration-200 ${
          completed
            ? 'border-primary bg-primary/20'
            : 'border-outline-variant hover:border-primary hover:bg-primary/5 cursor-pointer'
        } ${justCompleted ? 'animate-check-pop' : ''}`}
        id={`task-toggle-${id}`}
      >
        {completed && (
          <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            check
          </span>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h3
            className={`font-headline font-semibold text-base truncate transition-all duration-300 ${
              completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
            }`}
          >
            {title}
          </h3>
          <div className="flex gap-1.5 flex-shrink-0">
            {!completed && (
              <span className={`px-2 py-0.5 bg-surface-container-lowest ${priorityColor} font-label text-[10px] uppercase rounded-[2px] border border-outline-variant/15 transition-colors`}>
                {priorityLabel}
              </span>
            )}
            {category && (
              <span className="px-2 py-0.5 bg-surface-container-lowest text-on-surface-variant font-label text-[10px] uppercase rounded-[2px] border border-outline-variant/15">
                {category}
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className="font-body text-sm text-on-surface-variant mt-1 truncate">{description}</p>
        )}
      </div>

      {/* Actions — visible on hover (desktop) or always visible (mobile) */}
      <div className="flex md:hidden md:group-hover:flex gap-1 items-center flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(id)}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 btn-ripple"
            id={`task-edit-${id}`}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        )}
        {sourceType === 'manual' && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-on-surface-variant hover:text-error transition-colors p-1 btn-ripple"
            id={`task-delete-${id}`}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
