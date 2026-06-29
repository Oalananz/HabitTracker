'use client';

import { LIFE_AREAS, type LifeAreaId, isLifeAreaId } from '@/lib/lifeAreas';

interface LifeAreaSelectProps {
  value: string | null | undefined;
  onChange: (value: LifeAreaId | null) => void;
  /** Render the terminal "> LABEL" caption above the control. */
  label?: string;
  id?: string;
  className?: string;
}

/** Terminal-styled life-area dropdown used in create/edit forms. */
export default function LifeAreaSelect({ value, onChange, label = 'LIFE_AREA', id, className = '' }: LifeAreaSelectProps) {
  return (
    <div className={className}>
      {label && (
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
          &gt; {label}
        </label>
      )}
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(isLifeAreaId(v) ? v : null);
        }}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
      >
        <option value="" className="bg-surface-container-lowest">Unassigned</option>
        {LIFE_AREAS.map((area) => (
          <option key={area.id} value={area.id} className="bg-surface-container-lowest">
            {area.label}
          </option>
        ))}
      </select>
    </div>
  );
}
