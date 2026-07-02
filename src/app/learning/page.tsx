'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import Button from '@/components/ui/Button';
import CourseForm from '@/components/learning/CourseForm';
import SkillForm from '@/components/learning/SkillForm';
import StudySessionForm from '@/components/learning/StudySessionForm';
import CertificateForm from '@/components/learning/CertificateForm';
import ResourceForm from '@/components/learning/ResourceForm';
import { useToast } from '@/store/useToast';
import { useConfirm } from '@/components/ui/useConfirm';
import {
  calculateCourseProgress,
  getActiveCourses,
  type LearningCourse,
  type Skill,
  type StudySession,
  type Certificate,
  type LearningResource,
} from '@/lib/learning';

interface LearningSummary {
  activeCourses: number;
  completedCourses: number;
  studyTimeThisWeekMinutes: number;
  currentStreak: number;
  skillsInProgress: number;
  certificatesCount: number;
  connectedWebsitesCount: number;
  upcomingStudyTasksCount: number;
}

type ActiveForm = 'course' | 'skill' | 'session' | 'certificate' | 'resource' | null;

export default function LearningPage() {
  const { addToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, coursesRes, skillsRes, sessionsRes, certsRes, resourcesRes] = await Promise.all([
        fetch('/api/learning/summary'),
        fetch('/api/learning/courses'),
        fetch('/api/learning/skills'),
        fetch('/api/learning/study-sessions?limit=10'),
        fetch('/api/learning/certificates'),
        fetch('/api/learning/resources'),
      ]);
      const [summaryData, coursesData, skillsData, sessionsData, certsData, resourcesData] = await Promise.all([
        summaryRes.json(),
        coursesRes.json(),
        skillsRes.json(),
        sessionsRes.json(),
        certsRes.json(),
        resourcesRes.json(),
      ]);

      setSummary(summaryData.summary);
      setCourses(coursesData.courses || []);
      setSkills(skillsData.skills || []);
      setSessions(sessionsData.sessions || []);
      setCertificates(certsData.certificates || []);
      setResources(resourcesData.resources || []);
    } catch (err) {
      console.error('Failed to load learning data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const closeForm = () => setActiveForm(null);

  const handleCreateCourse = async (data: any) => {
    await fetch('/api/learning/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    closeForm();
    fetchAll();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!(await confirm({ message: 'Delete this course?' }))) return;
    await fetch('/api/learning/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', courseId }),
    });
    fetchAll();
  };

  const handleCreateSkill = async (data: any) => {
    await fetch('/api/learning/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    closeForm();
    fetchAll();
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!(await confirm({ message: 'Delete this skill?' }))) return;
    await fetch('/api/learning/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', skillId }),
    });
    fetchAll();
  };

  const handleCreateSession = async (data: any) => {
    await fetch('/api/learning/study-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    closeForm();
    fetchAll();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!(await confirm({ message: 'Delete this study session?' }))) return;
    await fetch('/api/learning/study-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', sessionId }),
    });
    fetchAll();
  };

  const handleCreateCertificate = async (data: any) => {
    await fetch('/api/learning/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    closeForm();
    fetchAll();
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!(await confirm({ message: 'Delete this certificate?' }))) return;
    await fetch('/api/learning/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', certificateId }),
    });
    fetchAll();
  };

  const handleCreateResource = async (data: any) => {
    await fetch('/api/learning/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...data }),
    });
    closeForm();
    fetchAll();
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!(await confirm({ message: 'Delete this resource?' }))) return;
    await fetch('/api/learning/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', resourceId }),
    });
    fetchAll();
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setPlanMessage(null);
    try {
      const res = await fetch('/api/ai/learning-study-plan', { method: 'POST' });
      const data = await res.json();
      setPlanMessage(data.message || 'Coming soon.');
      addToast(data.message || 'Coming soon.', 'info', 4000);
    } catch {
      setPlanMessage('Unable to reach the study plan service right now.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const activeCourses = getActiveCourses(courses);

  const mostRecentActive = activeCourses
    .slice()
    .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())[0];

  return (
    <div className="space-y-8 animate-page-enter">
      {ConfirmDialog}
      <PageHeader
        title="Learning"
        description="Track courses, skills, study time, and certificates in one place."
        actions={
          <Link href="/learning/connections">
            <Button variant="secondary" icon="link">Connect learning website</Button>
          </Link>
        }
      />

      {/* Stat cards */}
      {loading ? (
        <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
          <span className="animate-blink text-primary">▊</span> Loading learning data...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Courses" value={summary?.activeCourses ?? 0} icon="school" variant="primary" />
          <StatCard label="Completed Courses" value={summary?.completedCourses ?? 0} icon="workspace_premium" />
          <StatCard
            label="Study Time This Week"
            value={Math.round((summary?.studyTimeThisWeekMinutes ?? 0) / 60 * 10) / 10}
            unit="hrs"
            icon="schedule"
          />
          <StatCard label="Current Streak" value={summary?.currentStreak ?? 0} unit="days" icon="local_fire_department" />
          <StatCard label="Skills in Progress" value={summary?.skillsInProgress ?? 0} icon="psychology" />
          <StatCard label="Certificates" value={summary?.certificatesCount ?? 0} icon="military_tech" />
          <StatCard label="Connected Websites" value={summary?.connectedWebsitesCount ?? 0} icon="cloud_done" />
          <StatCard label="Upcoming Study Tasks" value={summary?.upcomingStudyTasksCount ?? 0} icon="event_upcoming" />
        </div>
      )}

      {/* Recommended next action */}
      <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[20px] text-primary flex-shrink-0">tips_and_updates</span>
        <div>
          <p className="font-headline text-sm font-bold text-on-surface">Recommended next step</p>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            {mostRecentActive
              ? `Continue "${mostRecentActive.title}" — ${mostRecentActive.progressPercentage}% complete.`
              : 'No active courses yet — add one to get started.'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="add" onClick={() => setActiveForm(activeForm === 'course' ? null : 'course')}>
          Add course
        </Button>
        <Button variant="secondary" icon="psychology" onClick={() => setActiveForm(activeForm === 'skill' ? null : 'skill')}>
          Add skill
        </Button>
        <Button variant="secondary" icon="schedule" onClick={() => setActiveForm(activeForm === 'session' ? null : 'session')}>
          Log study session
        </Button>
        <Button variant="secondary" icon="military_tech" onClick={() => setActiveForm(activeForm === 'certificate' ? null : 'certificate')}>
          Add certificate
        </Button>
        <Button variant="secondary" icon="bookmark_add" onClick={() => setActiveForm(activeForm === 'resource' ? null : 'resource')}>
          Add resource
        </Button>
      </div>

      {/* Inline forms */}
      {activeForm === 'course' && <CourseForm onSubmit={handleCreateCourse} onCancel={closeForm} />}
      {activeForm === 'skill' && <SkillForm onSubmit={handleCreateSkill} onCancel={closeForm} />}
      {activeForm === 'session' && (
        <StudySessionForm courses={courses} skills={skills} onSubmit={handleCreateSession} onCancel={closeForm} />
      )}
      {activeForm === 'certificate' && <CertificateForm onSubmit={handleCreateCertificate} onCancel={closeForm} />}
      {activeForm === 'resource' && <ResourceForm onSubmit={handleCreateResource} onCancel={closeForm} />}

      {/* Courses */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Courses" />
        {courses.length === 0 ? (
          <EmptyState compact title="No courses yet" description="Add a course to start tracking your progress." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course) => {
              const progress = calculateCourseProgress(course, []);
              return (
                <div key={course.id} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-headline text-sm font-bold text-on-surface truncate">{course.title}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">
                        {course.provider || 'Self-tracked'} · {course.status.replace('_', ' ')}
                        {course.targetCompletionDate && ` · due ${dayjs(course.targetCompletionDate).format('MMM D, YYYY')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-outline hover:text-error transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-scanline-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">{progress}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Skills" />
        {skills.length === 0 ? (
          <EmptyState compact title="No skills tracked" description="Add a skill to monitor your growth over time." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-headline text-sm font-bold text-on-surface truncate">{skill.name}</p>
                    <p className="font-mono text-[10px] text-outline mt-0.5">
                      {skill.level}{skill.targetLevel && ` → ${skill.targetLevel}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="text-outline hover:text-error transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
                <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-scanline-gradient rounded-full transition-all duration-500" style={{ width: `${skill.progressPercentage}%` }} />
                </div>
                <p className="font-mono text-[10px] text-on-surface-variant mt-1">{skill.progressPercentage}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study session history */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Study history" />
        {sessions.length === 0 ? (
          <EmptyState compact title="No study sessions logged" description="Log a session after you study to build your streak." />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">schedule</span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">{s.title || 'Study session'}</p>
                    <p className="font-mono text-[10px] text-outline">{dayjs(s.date).format('MMM D, YYYY')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-sm text-on-surface-variant whitespace-nowrap">{s.durationMinutes} min</span>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-outline hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Certificates" />
        {certificates.length === 0 ? (
          <EmptyState compact title="No certificates yet" description="Add a certificate once you complete a course." />
        ) : (
          <div className="space-y-2">
            {certificates.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-tertiary flex-shrink-0">military_tech</span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">{c.title}</p>
                    <p className="font-mono text-[10px] text-outline">
                      {c.provider || 'Self-issued'}{c.issueDate && ` · ${dayjs(c.issueDate).format('MMM D, YYYY')}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDeleteCertificate(c.id)} className="text-outline hover:text-error transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
        <SectionHeader title="Resources" />
        {resources.length === 0 ? (
          <EmptyState compact title="No saved resources" description="Save articles, videos, or docs you want to come back to." />
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-sm hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">bookmark</span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-on-surface truncate">{r.title}</p>
                    <p className="font-mono text-[10px] text-outline">{r.type} · {r.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteResource(r.id)} className="text-outline hover:text-error transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Study Plan */}
      <div className="flex flex-col items-start gap-2">
        <Button variant="secondary" icon="auto_awesome" onClick={handleGeneratePlan} disabled={generatingPlan}>
          {generatingPlan ? 'Checking…' : 'Generate study plan'}
        </Button>
        {planMessage && <p className="text-xs text-on-surface-variant/60">{planMessage}</p>}
      </div>
    </div>
  );
}
