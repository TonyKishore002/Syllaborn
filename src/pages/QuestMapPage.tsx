import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  Sparkles,
  Swords,
  CheckCircle2,
  Lock,
  List,
  Compass,
  Clock,
  Percent,
  Flame,
  Filter,
  MapPin,
  CheckSquare,
  Square,
  ShieldAlert,
  Gamepad2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { MilestoneModal } from '../components/quests/MilestoneModal';
import { PlayQuestModal, PlayableQuestItem } from '../components/game/PlayQuestModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Milestone, Course, CourseUnit, CourseTopic } from '../types';
import { DIFFICULTY_LABELS } from '../lib/gamification';

// Thematic fantasy region names based on course names fallback
function getFantasyRegionName(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes('algo') || lower.includes('data struct')) return 'Forest of Infinite Loops';
  if (lower.includes('operat') || lower.includes('system')) return 'Citadel of Deadlocks';
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra')) return 'Spire of Ancient Axioms';
  if (lower.includes('database') || lower.includes('sql')) return 'Vaults of Structured Knowledge';
  if (lower.includes('network') || lower.includes('web')) return 'Archipelago of Packet Waves';
  if (lower.includes('ai') || lower.includes('machine') || lower.includes('learn')) return 'Nexus of Sentient Weights';
  if (lower.includes('physics')) return 'Chasm of Entangled Forces';
  if (lower.includes('history') || lower.includes('lit')) return 'Hall of Forgotten Scribes';
  return `Realm of ${courseName}`;
}

export const QuestMapPage: React.FC = () => {
  const { courses, milestones, units } = useSyllaborn();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'timeline'>('map');
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedQuestForPlay, setSelectedQuestForPlay] = useState<PlayableQuestItem | null>(null);

  const filteredCourses = useMemo(() => {
    if (selectedCourseFilter === 'all') return courses;
    return courses.filter((c) => c.id === selectedCourseFilter);
  }, [courses, selectedCourseFilter]);

  const handleNodeClick = (milestone: Milestone) => {
    setActiveMilestone(milestone);
  };

  const handlePlayMilestone = (milestone: Milestone) => {
    const course = courses.find((c) => c.id === milestone.courseId);
    setSelectedQuestForPlay({
      id: milestone.id,
      kind: 'milestone',
      title: milestone.title,
      description: milestone.description || undefined,
      courseId: milestone.courseId,
      courseCode: course?.courseCode,
      courseName: course?.courseName,
      xpReward: milestone.xpReward,
      status: milestone.status,
      gameConfig: milestone.gameConfig,
      bossHp: milestone.bossHp,
      weightPercent: milestone.weightPercent,
      isBoss: milestone.difficultyCategory === 'boss_fight' || milestone.difficultyCategory === 'final_raid',
    });
    setIsPlayModalOpen(true);
  };

  const handlePlayTopicQuest = (topic: CourseTopic, courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    setSelectedQuestForPlay({
      id: topic.id,
      kind: 'topic',
      title: topic.questTitle || topic.title,
      description: topic.description,
      courseId,
      courseCode: course?.courseCode,
      courseName: course?.courseName,
      xpReward: topic.xpReward || 25,
      status: topic.status,
      gameConfig: topic.gameConfig,
    });
    setIsPlayModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
              Interactive Semester RPG World
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore your academic realms: Courses are <strong>Regions</strong>, Units are <strong>Locations</strong>, Topics are <strong>Quests</strong>, and Assessments are <strong>Boss Battles</strong>.
          </p>
        </div>

        {/* View Switcher and Course Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-[#121528] p-1 border border-purple-500/25">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="bg-[#121528] border border-purple-500/25 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Course Regions</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-cyan-400" />}
          title="The Map is Currently Uncharted"
          description="Inscribe your first course syllabus to chart connected quest routes and epic boss battles."
          actionLabel="View Courses"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map / Timeline Board (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {filteredCourses.map((course) => {
              const courseMilestones = [...milestones]
                .filter((m) => m.courseId === course.id)
                .sort((a, b) => {
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return a.dueDate > b.dueDate ? 1 : -1;
                });

              const courseUnits = units.filter((u) => u.courseId === course.id);
              const regionTitle = course.regionName || getFantasyRegionName(course.courseName);

              const totalTopics = courseUnits.reduce((acc, u) => acc + u.topics.length, 0);
              const completedTopics = courseUnits.reduce(
                (acc, u) => acc + u.topics.filter((t) => t.status === 'completed').length,
                0
              );
              const completedBosses = courseMilestones.filter((m) => m.status === 'completed').length;

              return (
                <div
                  key={course.id}
                  className="rounded-3xl p-6 bg-[#0f1224]/80 border border-purple-500/20 backdrop-blur-md relative overflow-hidden shadow-xl space-y-6"
                >
                  {/* Thematic Ambient Glow */}
                  <div
                    className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-[70px] opacity-30 pointer-events-none"
                    style={{ backgroundColor: course.color }}
                  />

                  {/* Course Realm Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pb-4 border-b border-purple-500/15">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-lg"
                        style={{ backgroundColor: course.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                            Region
                          </span>
                          <h3 className="font-fantasy font-bold text-lg text-slate-100">
                            {regionTitle}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {course.courseCode}: {course.courseName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      {totalTopics > 0 && (
                        <span className="text-purple-300 font-semibold bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/20">
                          {completedTopics}/{totalTopics} Quests Cleared
                        </span>
                      )}
                      <span className="text-rose-300 font-semibold bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/20">
                        {completedBosses}/{courseMilestones.length} Bosses Defeated
                      </span>
                    </div>
                  </div>

                  {/* Locations & Topic Quests Section */}
                  {courseUnits.length > 0 && (
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                          Regional Locations &amp; Curriculum Quests ({courseUnits.length} Locations)
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {courseUnits.map((u) => (
                          <div
                            key={u.id}
                            className="p-3.5 rounded-2xl bg-[#14182e]/80 border border-purple-500/20 space-y-2.5 shadow-md"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-purple-500/10 pb-2">
                              <div>
                                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                                  Location {u.unitNumber}
                                </span>
                                <h5 className="font-fantasy font-semibold text-slate-200 text-sm">
                                  {u.locationName}
                                </h5>
                                <p className="text-[11px] text-slate-400 font-sans">{u.title}</p>
                              </div>
                            </div>

                            {/* Quests inside location */}
                            <div className="space-y-1.5 pt-1">
                              {u.topics.map((topic) => {
                                const isDone = topic.status === 'completed';
                                return (
                                  <div
                                    key={topic.id}
                                    onClick={() => handlePlayTopicQuest(topic, u.courseId)}
                                    className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer group ${
                                      isDone
                                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                                        : 'bg-[#0d1020] border-slate-800 hover:border-purple-500/40 text-slate-200'
                                    }`}
                                  >
                                    <div className="mt-0.5 shrink-0 text-cyan-400 group-hover:scale-110 transition-transform">
                                      {isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <Gamepad2 className="w-4 h-4 text-cyan-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-xs font-semibold leading-tight ${
                                          isDone ? 'line-through text-slate-500' : 'text-slate-200'
                                        }`}
                                      >
                                        {topic.questTitle || topic.title}
                                      </p>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {isDone ? 'Conquered ✓ (Click to Replay)' : 'Play Quest Mini-Game'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-bold">
                                      +{topic.xpReward || 25} XP
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boss Battles Pathway (Milestones / Assessments) */}
                  <div className="space-y-3 relative z-10 pt-2 border-t border-purple-500/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-rose-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                          Regional Boss Encounters &amp; Major Assessments ({courseMilestones.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Click a Boss to inspect &amp; fight</span>
                    </div>

                    {courseMilestones.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">
                        No boss encounters configured for this realm yet.
                      </p>
                    ) : viewMode === 'map' ? (
                      <div className="relative py-2 overflow-x-auto">
                        <div className="flex items-center gap-6 min-w-max pb-4 px-2">
                          {courseMilestones.map((m, index) => {
                            const isCompleted = m.status === 'completed';
                            const isBoss =
                              m.difficultyCategory === 'boss_fight' ||
                              m.difficultyCategory === 'final_raid';
                            const isSelected = activeMilestone?.id === m.id;

                            return (
                              <React.Fragment key={m.id}>
                                {/* Node Element */}
                                <div
                                  onClick={() => handleNodeClick(m)}
                                  className={`relative group flex flex-col items-center cursor-pointer transition-all ${
                                    isSelected ? 'scale-110' : 'hover:scale-105'
                                  }`}
                                >
                                  {/* Circular Node Icon */}
                                  <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shadow-xl relative ${
                                      isCompleted
                                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-400 shadow-emerald-950/40'
                                        : isBoss
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse shadow-rose-950/60'
                                        : 'bg-[#15192e] border-purple-500/40 text-purple-300 shadow-purple-950/40'
                                    } ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#08090f]' : ''}`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-6 h-6" />
                                    ) : isBoss ? (
                                      <Swords className="w-6 h-6 text-rose-400" />
                                    ) : (
                                      <Sparkles className="w-5 h-5 text-cyan-400" />
                                    )}

                                    {/* Stage Number */}
                                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0d0f1b] border border-purple-500/40 text-[9px] font-mono font-bold flex items-center justify-center text-slate-300">
                                      {index + 1}
                                    </span>
                                  </div>

                                  {/* Node Label Below */}
                                  <div className="text-center mt-2 w-28">
                                    <p
                                      className={`text-xs font-semibold truncate ${
                                        isCompleted
                                          ? 'line-through text-slate-500'
                                          : 'text-slate-200'
                                      }`}
                                    >
                                      {m.title}
                                    </p>
                                    <span className="text-[10px] font-mono text-slate-400 block">
                                      {m.dueDate || 'TBD'}
                                    </span>
                                    {m.bossHp && !isCompleted && (
                                      <span className="text-[9px] font-mono text-rose-400 font-bold block">
                                        {m.bossHp} HP
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Connected Path Line */}
                                {index < courseMilestones.length - 1 && (
                                  <div
                                    className={`w-10 h-1 rounded-full shrink-0 transition-colors ${
                                      isCompleted
                                        ? 'bg-emerald-500/60'
                                        : 'bg-purple-500/30 border-t border-dashed border-purple-400/40'
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Timeline View */
                      <div className="space-y-3 relative pl-6 border-l-2 border-purple-500/20 ml-2">
                        {courseMilestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleNodeClick(m)}
                            className="p-3.5 rounded-xl bg-[#14182b] border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              {m.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Swords className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                              <div>
                                <p className={`text-xs font-semibold ${m.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {m.title}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Due {m.dueDate || 'TBD'} • {m.bossHp ? `${m.bossHp} HP` : 'Quest'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-amber-300 font-bold">
                              +{m.xpReward} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Node Inspector */}
          <div className="space-y-6">
            {activeMilestone ? (
              <div className="sticky top-20 rounded-3xl p-6 bg-[#0f1224]/90 border border-purple-500/25 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-purple-500/15 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                      Boss Encounter Details
                    </span>
                    <h3 className="font-fantasy font-bold text-lg text-slate-100 mt-1">
                      {activeMilestone.title}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      activeMilestone.difficultyCategory === 'final_raid'
                        ? 'rose'
                        : activeMilestone.difficultyCategory === 'boss_fight'
                        ? 'purple'
                        : 'cyan'
                    }
                  >
                    {DIFFICULTY_LABELS[activeMilestone.difficultyCategory].label}
                  </Badge>
                </div>

                {/* Encounter Attributes */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Due Date:</span>
                    </span>
                    <span className="font-mono text-slate-200">
                      {activeMilestone.dueDate || 'Not specified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-purple-400" />
                      <span>Assessment Weight:</span>
                    </span>
                    <span className="font-mono text-purple-300 font-semibold">
                      {activeMilestone.weightPercent !== null
                        ? `${activeMilestone.weightPercent}%`
                        : 'Weight not specified'}
                    </span>
                  </div>

                  {activeMilestone.bossHp !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span>Boss Health Points:</span>
                      </span>
                      <span className="font-mono text-rose-300 font-bold">
                        {activeMilestone.status === 'completed' ? '0 HP (Defeated)' : `${activeMilestone.bossHp} HP`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reward:</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      +{activeMilestone.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Syllabus Evidence Excerpt */}
                {activeMilestone.sourceExcerpt && (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                    <span className="font-semibold block text-cyan-300 text-[11px]">
                      Syllabus Evidence
                    </span>
                    <p className="italic text-[11px] text-slate-300">
                      "{activeMilestone.sourceExcerpt}"
                    </p>
                  </div>
                )}

                {/* Battle Action Button */}
                <Button
                  variant={activeMilestone.status === 'completed' ? 'secondary' : 'emerald'}
                  size="md"
                  onClick={() => handlePlayMilestone(activeMilestone)}
                  className="w-full shadow-lg flex items-center justify-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>
                    {activeMilestone.status === 'completed'
                      ? 'Replay Boss Fight (Practice)'
                      : 'Battle Boss in Mini-Game'}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="sticky top-20 p-8 rounded-3xl bg-[#121528]/50 border border-purple-500/15 text-center text-xs text-slate-400 space-y-2">
                <Compass className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
                <p className="font-semibold text-slate-300">Select a Boss Node</p>
                <p className="text-[11px]">
                  Click any stage node on the map to inspect its due dates, boss health, grading weight, and claim victory XP.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestoneToEdit={activeMilestone}
      />

      {/* Interactive Quest Play Modal */}
      <PlayQuestModal
        isOpen={isPlayModalOpen}
        onClose={() => {
          setIsPlayModalOpen(false);
          setSelectedQuestForPlay(null);
        }}
        quest={selectedQuestForPlay}
      />
    </div>
  );
};
