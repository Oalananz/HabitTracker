'use client';

import { useState } from 'react';
import dayjs from 'dayjs';

interface CertificateFormProps {
  onSubmit: (data: {
    title: string;
    provider: string;
    issueDate: string;
    certificateUrl: string;
  }) => void;
  onCancel: () => void;
  initial?: { title?: string; provider?: string | null; issueDate?: string | null; certificateUrl?: string | null };
  /** Editing an existing item (changes the title and submit label). */
  editing?: boolean;
}

const todayStr = () => dayjs().format('YYYY-MM-DD');

export default function CertificateForm({ onSubmit, onCancel, initial, editing }: CertificateFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [provider, setProvider] = useState(initial?.provider || '');
  const [issueDate, setIssueDate] = useState(initial?.issueDate || todayStr());
  const [certificateUrl, setCertificateUrl] = useState(initial?.certificateUrl || '');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      provider: provider.trim(),
      issueDate,
      certificateUrl: certificateUrl.trim(),
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {editing ? 'EDIT_CERTIFICATE' : 'NEW_CERTIFICATE'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="certificate-form-title" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TITLE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input id="certificate-form-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. AWS Certified Developer"
            />
          </div>
        </div>

        <div>
          <label htmlFor="certificate-form-provider-optional" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PROVIDER (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input id="certificate-form-provider-optional"
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Amazon, Google, Coursera..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="certificate-form-issue-date-optional" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; ISSUE_DATE (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input id="certificate-form-issue-date-optional"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>

        <div>
          <label htmlFor="certificate-form-certificate-url-optional" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CERTIFICATE_URL (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input id="certificate-form-certificate-url-optional"
              type="url"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {editing ? 'SAVE CHANGES' : 'ADD CERTIFICATE'} &#8629;
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
