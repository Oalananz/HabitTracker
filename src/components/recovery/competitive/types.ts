export type JourneyVisibility = 'private' | 'public';

export interface StructuredJourneyRules {
  noMoreThanFailuresPerWeek?: number;
  resetStreakOnFailure?: boolean;
  mandatoryDailyCheckIn?: boolean;
  syncToPersonal?: boolean;
}

export interface JourneyModel {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  startDate: string;
  endDate: string | null;
  rules: {
    text: string | null;
    structured: StructuredJourneyRules;
  };
  maxFailures: number | null;
  consequenceRules: string | null;
  visibility: JourneyVisibility;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JourneySummary extends JourneyModel {
  participantCount: number;
  totalFailures: number;
  myRole: 'owner' | 'member' | null;
  myStatus: 'active' | 'left' | 'failed' | null;
  myFailures: number;
}

export interface PendingInvite {
  id: string;
  journeyId: string;
  invitedBy: string;
  inviteeUserId: string | null;
  inviteeEmail: string | null;
  inviteeUsername: string | null;
  token: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  inviteLinkPath: string;
  journey: JourneyModel | null;
}

export interface JourneyCatalogResponse {
  journeys: JourneySummary[];
  publicJourneys: JourneySummary[];
  pendingInvites: PendingInvite[];
}

export interface JourneyParticipant {
  id: string;
  journeyId: string;
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'left' | 'failed';
  joinedAt: string;
  currentStreak: number;
  totalFailures: number;
  lastFailureAt: string | null;
  lastCheckInAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  email: string;
  role: 'owner' | 'member';
  status: 'active' | 'left' | 'failed';
  currentStreak: number;
  currentStreakLabel: string;
  totalFailures: number;
  consistencyScore: number;
  weeklyFailures: number;
  triggeredConsequences: number;
}

export interface JourneyFailure {
  id: string;
  journeyId: string;
  userId: string;
  username: string;
  timestamp: string;
  createdAt: string;
}

export interface JourneyConsequence {
  id: string;
  journeyId: string;
  failureThreshold: number;
  description: string;
  consequenceType: 'text' | 'symbolic' | 'warning' | 'penalty';
  symbol: string | null;
  createdAt: string;
}

export interface JourneyReaction {
  id: string;
  journeyId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string | null;
  toUsername: string | null;
  emoji: string;
  message: string | null;
  createdAt: string;
}

export interface JourneyDetailsResponse {
  journey: JourneyModel;
  participants: JourneyParticipant[];
  leaderboard: LeaderboardEntry[];
  recentFailures: JourneyFailure[];
  ruleSummary: {
    text: string | null;
    structured: StructuredJourneyRules;
    maxFailures: number | null;
    consequenceRules: string | null;
  };
  consequences: JourneyConsequence[];
  consequenceStatusByParticipant: Record<
    string,
    Array<{
      id: string;
      description: string;
      triggeredAt: string;
      status: string;
    }>
  >;
  reactions: JourneyReaction[];
  invites: Array<{
    id: string;
    journeyId: string;
    invitedBy: string;
    inviteeUserId: string | null;
    inviteeEmail: string | null;
    inviteeUsername: string | null;
    token: string;
    status: string;
    createdAt: string;
    respondedAt: string | null;
    inviteLinkPath: string;
  }>;
  myMembership: {
    id: string;
    role: 'owner' | 'member';
    status: 'active' | 'failed' | 'left';
    totalFailures: number;
    currentStreak: number;
    lastFailureAt: string | null;
    joinedAt: string;
  } | null;
  canJoin: boolean;
}
