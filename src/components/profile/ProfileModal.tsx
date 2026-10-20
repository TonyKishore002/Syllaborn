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
          <Sparkles className="w-5 h-5 text-purple-400" />
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
        <div className="flex border-b border-purple-500/20 mb-4 pb-1 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-purple-500/20 text-cyan-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Hero Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-purple-500/20 text-cyan-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Settings & Data</span>
          </button>
        </div>
      )}

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <span>
              All your progress is saved safely in your local browser storage. No account or remote tracking required.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Student / Display Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-[#14182b] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            {errors.displayName && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Adventurer Nickname (Optional)
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Arcane Magus"
                className="w-full bg-[#14182b] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
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
                className="w-full bg-[#14182b] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Semester Start <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={semesterStartDate}
                onChange={(e) => setSemesterStartDate(e.target.value)}
                className="w-full bg-[#14182b] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
              {errors.semesterStartDate && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.semesterStartDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Semester End <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={semesterEndDate}
                onChange={(e) => setSemesterEndDate(e.target.value)}
                className="w-full bg-[#14182b] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
              {errors.semesterEndDate && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.semesterEndDate}</p>
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
          <div className="p-3.5 rounded-2xl bg-[#121528] border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
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
                className="text-xs px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-cyan-300 hover:bg-purple-500/20 transition-colors"
              >
                {settings.companionVisibility ? 'Hide Companion' : 'Show Companion'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-purple-500/15">
              <span className="text-[11px] text-slate-400">Humor Level:</span>
              {(['chill', 'playful', 'chaotic'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateSettings({ humorIntensity: mode })}
                  className={`px-2 py-0.5 rounded text-[11px] capitalize border transition-all ${
                    settings.humorIntensity === mode
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200 font-bold'
                      : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Backup & Data Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Local Data Sanctuary</h4>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={exportBackupData}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-cyan-300 border border-purple-500/30 text-xs font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#14182b] hover:bg-[#1a1f38] text-slate-300 border border-slate-700 text-xs font-medium transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-purple-400" />
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
              <p className="text-[11px] text-rose-400 bg-rose-950/20 p-2 rounded-lg border border-rose-500/30">
                {importError}
              </p>
            )}
            {importSuccess && (
              <p className="text-[11px] text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/30">
                {importSuccess}
              </p>
            )}
            {importPreview && (
              <div className="p-3 rounded-xl bg-[#151930] border border-cyan-500/30 space-y-2">
                <p className="text-xs text-cyan-300 font-medium">Valid Backup Found:</p>
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
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl border border-rose-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All Progress</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2">
                  <p className="text-xs text-rose-300 font-semibold">
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
