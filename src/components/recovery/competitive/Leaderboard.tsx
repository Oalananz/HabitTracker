'use client';

import type { LeaderboardEntry } from './types';

interface LeaderboardProps {
  rows: LeaderboardEntry[];
}

function rankStyle(rank: number) {
  if (rank === 1) return 'text-tertiary';
  if (rank === 2) return 'text-secondary';
  if (rank === 3) return 'text-primary';
  return 'text-on-surface-variant';
}

export default function Leaderboard({ rows }: LeaderboardProps) {
  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden">
      <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
        <h4 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
          <span className="text-primary">&gt;</span> LEADERBOARD
        </h4>
        <span className="font-mono text-[10px] text-on-surface-variant">sorted: streak - failures - consistency</span>
      </div>

      {rows.length === 0 ? (
        <div className="p-4 font-mono text-xs text-outline">No participants yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-surface-container-lowest">
              <tr className="text-left">
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">#</th>
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">Participant</th>
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">Streak</th>
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">Failures</th>
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">Consistency</th>
                <th className="px-3 py-2 font-mono text-[10px] text-on-surface-variant uppercase">Consequences</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-t border-outline-variant/10 hover:bg-surface-container-lowest/50">
                  <td className="px-3 py-2">
                    <span className={`font-headline text-sm font-bold ${rankStyle(row.rank)}`}>#{row.rank}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          row.status === 'failed'
                            ? 'bg-error'
                            : row.status === 'active'
                              ? 'bg-primary'
                              : 'bg-outline'
                        }`}
                      />
                      <div>
                        <div className="font-body text-sm text-on-surface">
                          {row.username}
                          {row.role === 'owner' ? ' (owner)' : ''}
                        </div>
                        <div className="font-mono text-[10px] text-on-surface-variant uppercase">{row.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{row.currentStreakLabel}</td>
                  <td className="px-3 py-2 font-mono text-xs text-on-surface">{row.totalFailures}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full bg-scanline-gradient"
                          style={{ width: `${Math.max(0, Math.min(100, row.consistencyScore))}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-on-surface-variant">{row.consistencyScore}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-error">{row.triggeredConsequences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
