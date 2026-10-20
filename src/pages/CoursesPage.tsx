import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  FileUp,
  Map,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { CourseModal } from '../components/courses/CourseModal';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { courses, milestones, deleteCourse } = useSyllaborn();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeCourseIdForUpload, setActiveCourseIdForUpload] = useState<string | undefined>();
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructorName && c.instructorName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [courses, searchQuery]);

  const confirmDelete = () => {
    if (!courseToDelete) return;
    deleteCourse(courseToDelete.id);
    setCourseToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
            Course Realms ({courses.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your university courses, syllabi, and academic domains.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-cyan-300" />
            <span>Upload Syllabus</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedCourseForEdit(null);
              setIsCourseModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5 text-purple-300" />
            <span>Add Course</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {courses.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course name, code, or instructor..."
            className="w-full bg-[#121528] border border-purple-500/20 focus:border-cyan-400 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-purple-400" />}
          title="No Course Realms Inscribed Yet"
          description="Upload a course syllabus PDF to automatically create a course and extract all its quests, or create a course manually."
          actionLabel="Upload Syllabus PDF"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : filteredCourses.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121528]/50 border border-purple-500/15 text-xs text-slate-400">
          No courses matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const courseMilestones = milestones.filter((m) => m.courseId === course.id);
            const completed = courseMilestones.filter((m) => m.status === 'completed');
            const percent =
              courseMilestones.length > 0
                ? Math.round((completed.length / courseMilestones.length) * 100)
                : 0;

            const nextUpcoming = [...courseMilestones]
              .filter((m) => m.status === 'pending' && m.dueDate)
              .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))[0];

            return (
              <Card
                key={course.id}
                hoverEffect
                className="flex flex-col justify-between space-y-4 relative group"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {course.courseCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourseForEdit(course);
                          setIsCourseModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourseToDelete(course);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-fantasy font-bold text-base text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1">
                    {course.courseName}
                  </h3>

                  {course.instructorName && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Prof. {course.instructorName}
                    </p>
                  )}

                  {course.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Quest Progress</span>
                    <span className="text-slate-200 font-semibold">{percent}%</span>
                  </div>
                  <ProgressBar value={percent} size="sm" variant="cyan" />
                </div>

                {/* Next Milestone & Quick Actions */}
                <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate max-w-[160px]">
                    {nextUpcoming ? (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{nextUpcoming.title}</span>
                      </span>
                    ) : (
                      <span className="italic text-slate-500">No pending deadlines</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCourseIdForUpload(course.id);
                      setIsUploadModalOpen(true);
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                  >
                    <FileUp className="w-3 h-3" />
                    <span>Syllabus</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1222] border border-rose-500/30 p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold font-fantasy text-rose-300">
              Disband Course Realm?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{courseToDelete.courseName}"</span>? All quests, boss encounters, and grading categories associated with this course will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setCourseToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={confirmDelete}>
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        courseToEdit={selectedCourseForEdit}
      />

      {/* Upload Syllabus Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setActiveCourseIdForUpload(undefined);
        }}
        defaultCourseId={activeCourseIdForUpload}
      />
    </div>
  );
};
