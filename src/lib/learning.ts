import dayjs from 'dayjs';

// ================================================================
// Learning Tracker — shared types + pure calculation helpers.
// No DB access here; all functions operate on arrays passed in.
// ================================================================

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';
export type ModuleLessonStatus = 'not_started' | 'in_progress' | 'completed';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type ResourceType = 'course' | 'video' | 'article' | 'book' | 'documentation' | 'other';
export type ResourceStatus = 'saved' | 'in_progress' | 'completed';

export interface LearningCourse {
  id: string;
  userId: string;
  title: string;
  provider: string | null;
  courseUrl: string | null;
  description: string | null;
  lifeArea: string | null;
  status: CourseStatus;
  progressPercentage: number;
  startedAt: string | null;
  completedAt: string | null;
  targetCompletionDate: string | null;
  externalProviderId: string | null;
  externalCourseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningModule {
  id: string;
  userId: string;
  courseId: string | null;
  title: string | null;
  order: number;
  status: ModuleLessonStatus;
  progressPercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningLesson {
  id: string;
  userId: string;
  courseId: string | null;
  moduleId: string | null;
  title: string | null;
  order: number;
  durationMinutes: number | null;
  status: ModuleLessonStatus;
  completedAt: string | null;
  externalLessonId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId: string | null;
  skillId: string | null;
  title: string | null;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  level: SkillLevel;
  progressPercentage: number;
  targetLevel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  title: string;
  provider: string | null;
  issueDate: string | null;
  certificateUrl: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResource {
  id: string;
  userId: string;
  title: string;
  url: string;
  type: ResourceType;
  provider: string | null;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}

/** % of lessons completed for a course; falls back to course.progressPercentage if no lessons. */
export function calculateCourseProgress(course: LearningCourse, lessons: LearningLesson[]): number {
  const courseLessons = lessons.filter((l) => l.courseId === course.id);
  if (courseLessons.length === 0) return course.progressPercentage ?? 0;
  const completed = courseLessons.filter((l) => l.status === 'completed').length;
  return Math.round((completed / courseLessons.length) * 100);
}

/** Sum of durationMinutes for sessions falling within the current ISO week. */
export function calculateStudyTimeThisWeek(sessions: StudySession[]): number {
  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');
  return sessions
    .filter((s) => {
      const d = dayjs(s.date);
      return (d.isAfter(startOfWeek) || d.isSame(startOfWeek, 'day')) && (d.isBefore(endOfWeek) || d.isSame(endOfWeek, 'day'));
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
}

/** Consecutive days with at least one study session, counting backward from today. */
export function calculateLearningStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;

  const studyDays = new Set(sessions.map((s) => dayjs(s.date).format('YYYY-MM-DD')));

  let streak = 0;
  let cursor = dayjs().startOf('day');

  // If no session today, the streak may still be "alive" through yesterday;
  // but if neither today nor yesterday has a session, streak is 0.
  if (!studyDays.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day');
    if (!studyDays.has(cursor.format('YYYY-MM-DD'))) return 0;
  }

  while (studyDays.has(cursor.format('YYYY-MM-DD'))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return streak;
}

/** Exists for symmetry/clarity — skill progress is stored directly. */
export function calculateSkillProgress(skill: Skill): number {
  return skill.progressPercentage;
}

/** First lesson (ordered by `order`) for a course that isn't completed yet. */
export function getNextLesson(course: LearningCourse, lessons: LearningLesson[]): LearningLesson | null {
  const courseLessons = lessons
    .filter((l) => l.courseId === course.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return courseLessons.find((l) => l.status !== 'completed') ?? null;
}

export function getActiveCourses(courses: LearningCourse[]): LearningCourse[] {
  return courses.filter((c) => c.status === 'in_progress');
}

export function getCompletedCourses(courses: LearningCourse[]): LearningCourse[] {
  return courses.filter((c) => c.status === 'completed');
}
