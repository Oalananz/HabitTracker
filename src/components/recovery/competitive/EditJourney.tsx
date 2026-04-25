'use client';

import { useState } from 'react';
import type { JourneyDetailsResponse } from './types';

interface EditJourneyProps {
  details: JourneyDetailsResponse;
  onClose: () => void;
  onSave: (updates: {
    name: string;
    description?: string | null;
    rulesText?: string | null;
    consequenceRules?: string | null;
  }) => Promise<void>;
}

export default function EditJourney({ details, onClose, onSave }: EditJourneyProps) {
  const [name, setName] = useState(details.journey.name);
  const [description, setDescription] = useState(details.journey.description || '');
  const [rulesText, setRulesText] = useState(details.ruleSummary.text || '');
  const [consequenceRules, setConsequenceRules] = useState(details.ruleSummary.consequenceRules || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Journey name is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        rulesText: rulesText.trim() || null,
        consequenceRules: consequenceRules.trim() || null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-low rounded-lg border border-outline-variant/20 p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-headline text-xl font-bold text-on-surface">Edit Journey</h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-on-surface-variant hover:text-on-surface text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Journey Name */}
          <div>
            <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
              Journey Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 disabled:opacity-50"
              placeholder="Enter journey name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 disabled:opacity-50 resize-none"
              placeholder="Optional journey description"
            />
          </div>

          {/* Rules Text */}
          <div>
            <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
              Rules Summary
            </label>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              disabled={isSaving}
              rows={4}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 disabled:opacity-50 resize-none"
              placeholder="Describe the main rules for this journey"
              dir="auto"
            />
          </div>

          {/* Consequence Rules */}
          <div>
            <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
              Consequence Rules Notes
            </label>
            <textarea
              value={consequenceRules}
              onChange={(e) => setConsequenceRules(e.target.value)}
              disabled={isSaving}
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 disabled:opacity-50 resize-none"
              placeholder="Optional notes about consequences"
              dir="auto"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface font-label text-xs uppercase tracking-wider disabled:opacity-50 transition-colors hover:bg-surface-container-highest"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label text-xs uppercase tracking-wider font-bold disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
