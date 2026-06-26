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
  onEdit?: (id: string, data: { title: string; description?: string; category?: string; priority?: string }) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description || '');
  const [editCategory, setEditCategory] = useState(category || 'General');
  const [editPriority, setEditPriority] = useState(priority || 'nominal');

  const ribbonColor = completed
    ? 'bg-primary'
    : priority === 'critical'
    ? 'bg-tertiary'
    : priority === 'low'
    ? 'bg-on-surface-variant'
    : 'bg-secondary';

  const priorityLabel = priority === 'critical' ? 'HIGH' : priority === 'low' ? 'LOW' : 'MED';
  const priorityColor = priority === 'critical' ? 'text-tertiary' : priority === 'low' ? 'text-on-surface-variant' : 'text-secondary';

  const handleToggle = () => {
    if (!completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle(id, completed);
  };

  const handleEditSave = () => {
    if (!editTitle.trim()) return;
    if (onEdit) {
      onEdit(id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        category: editCategory,
        priority: editPriority,
      });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(title);
    setEditDesc(description || '');
    setEditCategory(category || 'General');
    setEditPriority(priority || 'nominal');
    setIsEditing(false);
  };

  // Inline edit form
  if (isEditing) {
    return (
      <div
        className="relative bg-surface-container rounded-md border border-primary/30 p-4 space-y-3 animate-fade-in"
        style={style}
      >
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-l-md" />
        {/* Title */}
        <div className="flex items-center gap-2 pl-1">
          <span className="text-primary font-mono text-sm">&gt;</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSave();
              if (e.key === 'Escape') handleEditCancel();
            }}
            className="flex-1 bg-transparent text-on-surface font-headline font-semibold text-base border-none p-0 focus:ring-0 focus:outline-none"
            autoFocus
            placeholder="Task title"
          />
        </div>
        {/* Description */}
        <textarea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') handleEditCancel(); }}
          rows={2}
          placeholder="Description (optional)"
          className="w-full bg-surface-container-low text-on-surface text-sm font-body placeholder:text-outline border border-outline-variant/20 rounded-sm px-3 py-2 focus:ring-0 focus:border-primary/50 resize-none"
        />
        {/* Meta */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1 text-xs font-label text-on-surface-variant focus:border-primary/50"
          >
            {['General', 'Health', 'Work', 'Learning', 'Personal', 'Admin'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/20 rounded-sm px-2 py-1 text-xs font-label text-on-surface-variant focus:border-primary/50"
          >
            <option value="low">Low</option>
            <option value="nominal">Nominal</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleEditCancel}
            className="px-3 py-1.5 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditSave}
            disabled={!editTitle.trim()}
            className="px-4 py-1.5 bg-primary text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 disabled:opacity-40"
          >
            Save ↵
          </button>
        </div>
      </div>
    );
  }

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
              <span className={`px-1.5 py-0.5 bg-surface-container-lowest ${priorityColor} font-label text-[9px] uppercase rounded-[2px] border border-outline-variant/15`}>
                {priorityLabel}
              </span>
            )}
            {category && (
              <span className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface-variant font-label text-[9px] uppercase rounded-[2px] border border-outline-variant/15">
                {category}
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className="font-body text-sm text-on-surface-variant mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Actions — always visible */}
      <div className="flex gap-0.5 items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!completed && onEdit && sourceType === 'manual' && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-sm hover:bg-primary/10"
            id={`task-edit-${id}`}
            title="Edit task"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        )}
        {sourceType === 'manual' && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-sm hover:bg-error/10"
            id={`task-delete-${id}`}
            title="Delete task"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
