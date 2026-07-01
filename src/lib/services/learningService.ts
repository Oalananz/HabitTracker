import { supabase } from '../supabase';
import dayjs from 'dayjs';
import {
  calculateStudyTimeThisWeek,
  calculateLearningStreak,
  getActiveCourses,
  getCompletedCourses,
  type LearningCourse,
  type LearningModule,
  type LearningLesson,
  type StudySession,
  type Skill,
  type Certificate,
  type LearningResource,
} from '../learning';

// NOTE: the learning_* tables are not yet present in src/lib/database.types.ts
// (generated file — do not hand-edit), so every table-name argument below is
// cast `as any` to keep the Supabase client's generic typing happy. This
// mirrors the existing `.rpc(..., params as any)` pattern used elsewhere.

// ================================================================
// Courses
// ================================================================

export async function getLearningCourses(userId: string): Promise<LearningCourse[]> {
  const { data, error } = await supabase
    .from('learning_courses' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapCourse);
}

export async function getLearningCourse(courseId: string, userId: string): Promise<LearningCourse> {
  const { data, error } = await supabase
    .from('learning_courses' as any)
    .select('*')
    .eq('id', courseId)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return mapCourse(data);
}

export async function createLearningCourse(
  userId: string,
  data: {
    title: string;
    provider?: string;
    courseUrl?: string;
    description?: string;
    lifeArea?: string | null;
    status?: string;
    progressPercentage?: number;
    targetCompletionDate?: string;
  }
): Promise<LearningCourse> {
  const { data: course, error } = await supabase
    .from('learning_courses' as any)
    .insert({
      user_id: userId,
      title: data.title,
      provider: data.provider || null,
      course_url: data.courseUrl || null,
      description: data.description || null,
      life_area: data.lifeArea ?? 'learning',
      status: data.status || 'not_started',
      progress_percentage: data.progressPercentage ?? 0,
      target_completion_date: data.targetCompletionDate || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCourse(course);
}

export async function updateLearningCourse(
  courseId: string,
  userId: string,
  data: {
    title?: string;
    provider?: string;
    courseUrl?: string;
    description?: string;
    lifeArea?: string | null;
    status?: string;
    progressPercentage?: number;
    targetCompletionDate?: string;
    startedAt?: string;
    completedAt?: string;
  }
): Promise<LearningCourse> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.courseUrl !== undefined) updateData.course_url = data.courseUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.lifeArea !== undefined) updateData.life_area = data.lifeArea;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage;
  if (data.targetCompletionDate !== undefined) updateData.target_completion_date = data.targetCompletionDate;
  if (data.startedAt !== undefined) updateData.started_at = data.startedAt;
  if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
  updateData.updated_at = new Date().toISOString();

  const { data: course, error } = await supabase
    .from('learning_courses' as any)
    .update(updateData)
    .eq('id', courseId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCourse(course);
}

export async function deleteLearningCourse(courseId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_courses' as any)
    .delete()
    .eq('id', courseId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Modules
// ================================================================

export async function getLearningModules(userId: string, courseId?: string): Promise<LearningModule[]> {
  let query = supabase.from('learning_modules' as any).select('*').eq('user_id', userId);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query.order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapModule);
}

export async function createLearningModule(
  userId: string,
  data: { courseId: string; title?: string; order?: number; status?: string }
): Promise<LearningModule> {
  const { data: mod, error } = await supabase
    .from('learning_modules' as any)
    .insert({
      user_id: userId,
      course_id: data.courseId,
      title: data.title || null,
      order: data.order ?? 0,
      status: data.status || 'not_started',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapModule(mod);
}

export async function updateLearningModule(
  moduleId: string,
  userId: string,
  data: { title?: string; order?: number; status?: string; progressPercentage?: number }
): Promise<LearningModule> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage;
  updateData.updated_at = new Date().toISOString();

  const { data: mod, error } = await supabase
    .from('learning_modules' as any)
    .update(updateData)
    .eq('id', moduleId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapModule(mod);
}

export async function deleteLearningModule(moduleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_modules' as any)
    .delete()
    .eq('id', moduleId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Lessons
// ================================================================

export async function getLearningLessons(userId: string, courseId?: string): Promise<LearningLesson[]> {
  let query = supabase.from('learning_lessons' as any).select('*').eq('user_id', userId);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query.order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapLesson);
}

export async function createLearningLesson(
  userId: string,
  data: {
    courseId: string;
    moduleId?: string;
    title?: string;
    order?: number;
    durationMinutes?: number;
    status?: string;
  }
): Promise<LearningLesson> {
  const { data: lesson, error } = await supabase
    .from('learning_lessons' as any)
    .insert({
      user_id: userId,
      course_id: data.courseId,
      module_id: data.moduleId || null,
      title: data.title || null,
      order: data.order ?? 0,
      duration_minutes: data.durationMinutes ?? null,
      status: data.status || 'not_started',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLesson(lesson);
}

export async function updateLearningLesson(
  lessonId: string,
  userId: string,
  data: { title?: string; order?: number; durationMinutes?: number; status?: string; completedAt?: string }
): Promise<LearningLesson> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.durationMinutes !== undefined) updateData.duration_minutes = data.durationMinutes;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;
  updateData.updated_at = new Date().toISOString();

  const { data: lesson, error } = await supabase
    .from('learning_lessons' as any)
    .update(updateData)
    .eq('id', lessonId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLesson(lesson);
}

export async function deleteLearningLesson(lessonId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_lessons' as any)
    .delete()
    .eq('id', lessonId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Study sessions
// ================================================================

export async function getStudySessions(
  userId: string,
  filters?: { courseId?: string; skillId?: string; limit?: number }
): Promise<StudySession[]> {
  let query = supabase.from('study_sessions' as any).select('*').eq('user_id', userId);
  if (filters?.courseId) query = query.eq('course_id', filters.courseId);
  if (filters?.skillId) query = query.eq('skill_id', filters.skillId);
  query = query.order('date', { ascending: false });
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapStudySession);
}

export async function createStudySession(
  userId: string,
  data: {
    courseId?: string;
    skillId?: string;
    title?: string;
    durationMinutes: number;
    date: string;
    notes?: string;
  }
): Promise<StudySession> {
  const { data: session, error } = await supabase
    .from('study_sessions' as any)
    .insert({
      user_id: userId,
      course_id: data.courseId || null,
      skill_id: data.skillId || null,
      title: data.title || null,
      duration_minutes: data.durationMinutes,
      date: data.date,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapStudySession(session);
}

export async function deleteStudySession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions' as any)
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Skills
// ================================================================

export async function getSkills(userId: string): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapSkill);
}

export async function createSkill(
  userId: string,
  data: { name: string; category?: string; level?: string; progressPercentage?: number; targetLevel?: string }
): Promise<Skill> {
  const { data: skill, error } = await supabase
    .from('skills' as any)
    .insert({
      user_id: userId,
      name: data.name,
      category: data.category || null,
      level: data.level || 'beginner',
      progress_percentage: data.progressPercentage ?? 0,
      target_level: data.targetLevel || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSkill(skill);
}

export async function updateSkill(
  skillId: string,
  userId: string,
  data: { name?: string; category?: string; level?: string; progressPercentage?: number; targetLevel?: string }
): Promise<Skill> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage;
  if (data.targetLevel !== undefined) updateData.target_level = data.targetLevel;
  updateData.updated_at = new Date().toISOString();

  const { data: skill, error } = await supabase
    .from('skills' as any)
    .update(updateData)
    .eq('id', skillId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSkill(skill);
}

export async function deleteSkill(skillId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('skills' as any)
    .delete()
    .eq('id', skillId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Certificates
// ================================================================

export async function getCertificates(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates' as any)
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapCertificate);
}

export async function createCertificate(
  userId: string,
  data: { title: string; provider?: string; issueDate?: string; certificateUrl?: string; fileUrl?: string }
): Promise<Certificate> {
  const { data: cert, error } = await supabase
    .from('certificates' as any)
    .insert({
      user_id: userId,
      title: data.title,
      provider: data.provider || null,
      issue_date: data.issueDate || null,
      certificate_url: data.certificateUrl || null,
      file_url: data.fileUrl || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCertificate(cert);
}

export async function deleteCertificate(certificateId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('certificates' as any)
    .delete()
    .eq('id', certificateId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Resources
// ================================================================

export async function getLearningResources(userId: string): Promise<LearningResource[]> {
  const { data, error } = await supabase
    .from('learning_resources' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapResource);
}

export async function createLearningResource(
  userId: string,
  data: { title: string; url: string; type?: string; provider?: string; status?: string }
): Promise<LearningResource> {
  const { data: resource, error } = await supabase
    .from('learning_resources' as any)
    .insert({
      user_id: userId,
      title: data.title,
      url: data.url,
      type: data.type || 'other',
      provider: data.provider || null,
      status: data.status || 'saved',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapResource(resource);
}

export async function updateLearningResource(
  resourceId: string,
  userId: string,
  data: { title?: string; url?: string; type?: string; provider?: string; status?: string }
): Promise<LearningResource> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.provider !== undefined) updateData.provider = data.provider;
  if (data.status !== undefined) updateData.status = data.status;
  updateData.updated_at = new Date().toISOString();

  const { data: resource, error } = await supabase
    .from('learning_resources' as any)
    .update(updateData)
    .eq('id', resourceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapResource(resource);
}

export async function deleteLearningResource(resourceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('learning_resources' as any)
    .delete()
    .eq('id', resourceId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// ================================================================
// Summary
// ================================================================

export async function getLearningSummary(userId: string) {
  const [courses, sessions, skills, certificates] = await Promise.all([
    getLearningCourses(userId),
    getStudySessions(userId),
    getSkills(userId),
    getCertificates(userId),
  ]);

  const { data: connectedAccounts, error: connectedError } = await supabase
    .from('connected_learning_accounts' as any)
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'connected');
  if (connectedError) throw new Error(connectedError.message);

  const activeCourses = getActiveCourses(courses);
  const completedCourses = getCompletedCourses(courses);
  const studyTimeThisWeekMinutes = calculateStudyTimeThisWeek(sessions);
  const currentStreak = calculateLearningStreak(sessions);
  const skillsInProgress = skills.filter((s) => s.progressPercentage > 0 && s.progressPercentage < 100).length;
  const certificatesCount = certificates.length;
  const connectedWebsitesCount = (connectedAccounts || []).length;

  const today = dayjs().startOf('day');
  const upcomingStudyTasksCount = courses.filter((c) => {
    if (!c.targetCompletionDate || c.status === 'completed') return false;
    const target = dayjs(c.targetCompletionDate).startOf('day');
    const diff = target.diff(today, 'day');
    return diff >= 0 && diff <= 7;
  }).length;

  return {
    activeCourses: activeCourses.length,
    completedCourses: completedCourses.length,
    studyTimeThisWeekMinutes,
    currentStreak,
    skillsInProgress,
    certificatesCount,
    connectedWebsitesCount,
    upcomingStudyTasksCount,
  };
}

// ================================================================
// Mappers (snake_case DB rows -> camelCase domain types)
// ================================================================

function mapCourse(c: any): LearningCourse {
  return {
    id: c.id,
    userId: c.user_id,
    title: c.title,
    provider: c.provider ?? null,
    courseUrl: c.course_url ?? null,
    description: c.description ?? null,
    lifeArea: c.life_area ?? null,
    status: c.status,
    progressPercentage: c.progress_percentage ?? 0,
    startedAt: c.started_at ?? null,
    completedAt: c.completed_at ?? null,
    targetCompletionDate: c.target_completion_date ?? null,
    externalProviderId: c.external_provider_id ?? null,
    externalCourseId: c.external_course_id ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

function mapModule(m: any): LearningModule {
  return {
    id: m.id,
    userId: m.user_id,
    courseId: m.course_id ?? null,
    title: m.title ?? null,
    order: m.order ?? 0,
    status: m.status,
    progressPercentage: m.progress_percentage ?? null,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

function mapLesson(l: any): LearningLesson {
  return {
    id: l.id,
    userId: l.user_id,
    courseId: l.course_id ?? null,
    moduleId: l.module_id ?? null,
    title: l.title ?? null,
    order: l.order ?? 0,
    durationMinutes: l.duration_minutes ?? null,
    status: l.status,
    completedAt: l.completed_at ?? null,
    externalLessonId: l.external_lesson_id ?? null,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

function mapStudySession(s: any): StudySession {
  return {
    id: s.id,
    userId: s.user_id,
    courseId: s.course_id ?? null,
    skillId: s.skill_id ?? null,
    title: s.title ?? null,
    durationMinutes: s.duration_minutes,
    date: s.date,
    notes: s.notes ?? null,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapSkill(s: any): Skill {
  return {
    id: s.id,
    userId: s.user_id,
    name: s.name,
    category: s.category ?? null,
    level: s.level,
    progressPercentage: s.progress_percentage ?? 0,
    targetLevel: s.target_level ?? null,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function mapCertificate(c: any): Certificate {
  return {
    id: c.id,
    userId: c.user_id,
    title: c.title,
    provider: c.provider ?? null,
    issueDate: c.issue_date ?? null,
    certificateUrl: c.certificate_url ?? null,
    fileUrl: c.file_url ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

function mapResource(r: any): LearningResource {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    url: r.url,
    type: r.type,
    provider: r.provider ?? null,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
