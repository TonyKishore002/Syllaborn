import React, { useState, useEffect } from 'react';
import { BookOpen, Palette, User, Sparkles, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { Course } from '../../types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
}

const PRESET_COLORS = [
  '#8b5cf6', // Void Purple
  '#06b6d4', // Electric Cyan
  '#ec4899', // Magic Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Sapphire Blue
  '#f43f5e', // Crimson
  '#14b8a6', // Teal
];

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  courseToEdit,
}) => {
  const { saveCourse, logActivity } = useSyllaborn();

  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseToEdit) {
      setCourseName(courseToEdit.courseName);
      setCourseCode(courseCodePreset(courseToEdit.courseCode));
      setInstructorName(courseToEdit.instructorName || '');
      setSemester(courseToEdit.semester || '');
      setDescription(courseToEdit.description || '');
      setColor(courseToEdit.color || PRESET_COLORS[0]);
    } else {
      setCourseName('');
      setCourseCode('');
      setInstructorName('');
      setSemester('');
      setDescription('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
    setError(null);
  }, [courseToEdit, isOpen]);

  function courseCodePreset(code: string) {
    return code;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      setError('Course name is required.');
      return;
    }
    if (!courseCode.trim()) {
      setError('Course code is required.');
      return;
    }

    const isEdit = Boolean(courseToEdit);
    const updatedCourse: Course = {
      id: courseToEdit?.id || crypto.randomUUID(),
      courseName: courseName.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      instructorName: instructorName.trim() || null,
      semester: semester.trim() || null,
      description: description.trim() || null,
      color,
      createdAt: courseToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCourse(updatedCourse);

    logActivity({
      courseId: updatedCourse.id,
      eventType: isEdit ? 'course_created' : 'course_created',
      title: isEdit ? 'Course Updated' : 'New Realm Inscribed',
      description: `Course "${updatedCourse.courseCode}: ${updatedCourse.courseName}" saved.`,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>{courseToEdit ? 'Edit Course Realm' : 'Inscribe New Course Realm'}</span>
        </div>
      }
      description="Add a university subject to your semester roadmap and quest map."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Course Name <span className="text-indigo-400 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Data Structures and Algorithms"
            className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Course Code <span className="text-indigo-400 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS-301"
              className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 uppercase focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Instructor Name
            </label>
            <input
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="e.g. Dr. Eleanor Vance"
              className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Course Realm Color
          </label>
          <div className="flex items-center gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border border-white/10 shadow-neu-raised-sm active:shadow-neu-inset-sm transition-all ${
                  color === c ? 'ring-2 ring-indigo-400 scale-110 shadow-neu-raised' : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Course Description or Lore
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key concepts, prerequisites, or notes..."
            className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all resize-none"
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            <Check className="w-4 h-4 mr-1.5" />
            {courseToEdit ? 'Save Changes' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
