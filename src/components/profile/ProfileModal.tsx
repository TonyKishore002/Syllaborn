import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  Calendar,
  Globe,
  Building2,
  Check,
  ShieldAlert,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { PlayerProfile, SyllabornDataDocument } from '../../types';
import { exportBackupData, inspectBackupJson, restoreBackupData, BackupPreview } from '../../lib/local-backup';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnboarding?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  isOnboarding = false,
}) => {
  const { profile, settings, updateSettings, saveProfile, resetData, logActivity, refresh } = useSyllaborn();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Profile Form state
  const [displayName, setDisplayName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');
  const [timezone, setTimezone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Backup state
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null);
  const [parsedImportData, setParsedImportData] = useState<SyllabornDataDocument | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setCharacterName(profile.characterName || '');
      setUniversityName(profile.universityName || '');
      setSemesterStartDate(profile.semesterStartDate || '');
      setSemesterEndDate(profile.semesterEndDate || '');
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 4, 15).toISOString().split('T')[0];
      setSemesterStartDate(start);
      setSemesterEndDate(end);
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }
  }, [profile, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required.';
    }
    if (!semesterStartDate) {
      newErrors.semesterStartDate = 'Semester start date is required.';
    }
    if (!semesterEndDate) {
      newErrors.semesterEndDate = 'Semester end date is required.';
    }
    if (semesterStartDate && semesterEndDate && semesterStartDate >= semesterEndDate) {
      newErrors.semesterEndDate = 'Semester end date must be after the start date.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedProfile: PlayerProfile = {
      id: profile?.id || crypto.randomUUID(),
      displayName: displayName.trim(),
      characterName: characterName.trim() || null,
      universityName: universityName.trim() || null,
      semesterStartDate,
      semesterEndDate,
      timezone: timezone || 'UTC',
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProfile(updatedProfile);

    logActivity({
      eventType: 'profile_updated',
      title: isOnboarding ? 'Hero Created!' : 'Profile Updated',
      description: `Player profile set for ${displayName}.`,
    });

    onClose();
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setImportPreview(null);
    setParsedImportData(null);

    try {
      const text = await file.text();
      const result = inspectBackupJson(text);

      if (result.error || !result.preview || !result.parsedData) {
        setImportError(result.error || 'Failed to parse backup.');
        return;
      }

      setImportPreview(result.preview);
      setParsedImportData(result.parsedData);
    } catch (err: any) {
      setImportError(err.message || 'Could not read file.');
    }
  };

  const handleConfirmImport = () => {
    if (!parsedImportData) return;
    const ok = restoreBackupData(parsedImportData);
    if (ok) {
      setImportSuccess('Data successfully restored from backup!');
      setImportPreview(null);
      setParsedImportData(null);
      refresh();
    } else {
      setImportError('Failed to save restored data.');
    }
  };

  const handleReset = () => {
    resetData();
    setIsResetConfirmOpen(false);
    onClose();
    window.location.reload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isOnboarding ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>{isOnboarding ? 'Create Your Semester Hero' : 'Hero Profile & Settings'}</span>
        </div>
      }
      description={
        isOnboarding
          ? 'Welcome to Syllaborn! Configure your local academic adventurer to begin.'
          : 'Manage your hero profile, companion settings, and local game data.'
      }
      maxWidth="md"
    >
      {/* Navigation Tabs (when not onboarding) */}
      {!isOnboarding && (
        <div className="p-1 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm flex gap-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#0E1322] text-white border border-white/[0.05] shadow-neu-raised-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Hero Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#0E1322] text-white border border-white/[0.05] shadow-neu-raised-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Settings & Data</span>
          </button>
        </div>
      )}

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm text-[11px] text-sky-300 flex items-start gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
            <span>
              All your progress is saved safely in your local browser storage. No account or remote tracking required.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Student / Display Name <span className="text-indigo-400 font-bold">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
            {errors.displayName && (
              <p className="text-[11px] text-rose-400 font-medium mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Adventurer Nickname (Optional)
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Arcane Magus"
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              University / School (Optional)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="e.g. University of Science"
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Semester Start <span className="text-indigo-400 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={semesterStartDate}
                onChange={(e) => setSemesterStartDate(e.target.value)}
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
              {errors.semesterStartDate && (
                <p className="text-[11px] text-rose-400 font-medium mt-1">{errors.semesterStartDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Semester End <span className="text-indigo-400 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={semesterEndDate}
                onChange={(e) => setSemesterEndDate(e.target.value)}
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
              {errors.semesterEndDate && (
                <p className="text-[11px] text-rose-400 font-medium mt-1">{errors.semesterEndDate}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            {!isOnboarding && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" size="md">
              <Check className="w-4 h-4 mr-1.5" />
              {isOnboarding ? 'Embark on Adventure' : 'Save Profile'}
            </Button>
          </div>
        </form>
      ) : (
        /* Settings & Data Management */
        <div className="space-y-5">
          {/* Professor Panic & Humor Controls */}
          <div className="p-4 rounded-3xl bg-[#0E1322] border border-white/[0.04] shadow-neu-raised space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Professor Panic Companion
                </span>
                <p className="text-[11px] text-slate-400">
                  Enable or adjust humor for your academic guide.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateSettings({ companionVisibility: !settings.companionVisibility })
                }
                className="text-xs px-3.5 py-1.5 rounded-2xl border border-indigo-500/30 bg-[#0E1322] text-indigo-300 hover:text-white font-semibold shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all active:translate-y-0.5"
              >
                {settings.companionVisibility ? 'Hide Companion' : 'Show Companion'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2.5 border-t border-white/[0.04]">
              <span className="text-[11px] text-slate-400 font-medium">Humor Level:</span>
              {(['chill', 'playful', 'chaotic'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateSettings({ humorIntensity: mode })}
                  className={`px-3 py-1 rounded-full text-[11px] capitalize border transition-all ${
                    settings.humorIntensity === mode
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-neu-raised-sm border-indigo-400/40'
                      : 'bg-[#070b14] border-white/[0.03] shadow-neu-inset-sm text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Backup & Data Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white tracking-wide uppercase">Local Data Sanctuary</h4>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={exportBackupData}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0E1322] hover:bg-[#12182a] text-sky-300 border border-sky-500/25 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm text-xs font-bold transition-all active:translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0E1322] hover:bg-[#12182a] text-slate-200 border border-white/[0.04] shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm text-xs font-bold transition-all active:translate-y-0.5 cursor-pointer">
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFileSelected}
                  className="hidden"
                />
              </label>
            </div>

            {/* Import Feedback */}
            {importError && (
              <p className="text-[11px] text-rose-400 bg-rose-950/25 p-3 rounded-2xl border border-rose-800/40 shadow-neu-inset-sm font-medium">
                {importError}
              </p>
            )}
            {importSuccess && (
              <p className="text-[11px] text-emerald-400 bg-emerald-950/25 p-3 rounded-2xl border border-emerald-800/40 shadow-neu-inset-sm font-medium">
                {importSuccess}
              </p>
            )}
            {importPreview && (
              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm space-y-2">
                <p className="text-xs text-sky-400 font-bold">Valid Backup Found:</p>
                <p className="text-[11px] text-slate-300">
                  {importPreview.coursesCount} Courses • {importPreview.milestonesCount} Quests
                </p>
                <Button size="sm" variant="primary" onClick={handleConfirmImport}>
                  Confirm &amp; Restore
                </Button>
              </div>
            )}

            {/* Reset Data */}
            <div className="pt-2">
              {!isResetConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-rose-300 bg-[#0E1322] hover:bg-[#151c30] rounded-2xl border border-rose-800/40 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm font-semibold transition-all active:translate-y-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset All Progress</span>
                </button>
              ) : (
                <div className="p-4 rounded-3xl bg-[#0E1322] border border-rose-800/50 shadow-neu-raised text-center space-y-2.5">
                  <p className="text-xs text-rose-300 font-medium">
                    Are you sure? This erases all local courses, quests, and XP.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsResetConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" variant="danger" onClick={handleReset}>
                      Yes, Erase Everything
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
