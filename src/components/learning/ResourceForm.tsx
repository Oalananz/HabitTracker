'use client';

import { useState } from 'react';
import type { ResourceType, ResourceStatus } from '@/lib/learning';

interface ResourceFormProps {
  onSubmit: (data: {
    title: string;
    url: string;
    type: ResourceType;
    provider: string;
    status: ResourceStatus;
  }) => void;
  onCancel: () => void;
}

const TYPES: ResourceType[] = ['course', 'video', 'article', 'book', 'documentation', 'other'];
const STATUSES: ResourceStatus[] = ['saved', 'in_progress', 'completed'];

export default function ResourceForm({ onSubmit, onCancel }: ResourceFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ResourceType>('other');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('saved');

  const handleSubmit = () => {
    if (!title.trim() || !url.trim()) return;
    onSubmit({ title: title.trim(), url: url.trim(), type, provider: provider.trim(), status });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> NEW_RESOURCE
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TITLE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. Effective TypeScript"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; URL
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TYPE
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-surface-container-lowest">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PROVIDER (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="YouTube, O'Reilly..."
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; STATUS
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ResourceStatus)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface-container-lowest">
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !url.trim()}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          ADD RESOURCE &#8629;
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-bright transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
