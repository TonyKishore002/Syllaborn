import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProfileModal } from '../components/profile/ProfileModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { exportBackupData, inspectBackupJson, restoreBackupData, BackupPreview } from '../lib/local-backup';
import { ApplicationSettings, SyllabornDataDocument } from '../types';

export const SettingsPage: React.FC = () => {
  const { profile, settings, updateSettings, resetData, refresh } = useSyllaborn();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null);
  const [parsedImportData, setParsedImportData] = useState<SyllabornDataDocument | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleHumorChange = (mode: 'chill' | 'playful' | 'chaotic') => {
    updateSettings({ humorIntensity: mode });
  };

  const handleCompanionToggle = () => {
    updateSettings({ companionVisibility: !settings.companionVisibility });
  };

  const handleSoundToggle = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleReducedMotionToggle = () => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  };

  const handleImportFileSelected = async (file: File) => {
    setImportError(null);
    setImportSuccessMessage(null);
    setImportPreview(null);
    setParsedImportData(null);
    setImportFile(file);

    try {
      const text = await file.text();
      const result = inspectBackupJson(text);

      if (result.error || !result.preview || !result.parsedData) {
        setImportError(result.error || 'Failed to validate backup file.');
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
    const success = restoreBackupData(parsedImportData);
    if (success) {
      setImportSuccessMessage('Backup successfully restored! Your semester state has been updated.');
      setImportPreview(null);
      setParsedImportData(null);
      setImportFile(null);
      refresh();
    } else {
      setImportError('Failed to commit restored data to browser localStorage.');
    }
  };

  const handleResetData = () => {
    resetData();
    setIsResetConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-purple-400" />
          <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
            Settings &amp; Data Sanctuary
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Customize your RPG experience, manage backups, and review local data privacy.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-fantasy font-bold text-base text-slate-100">
                {profile?.displayName || 'Adventurer'}
              </h3>
              <p className="text-xs text-slate-400">
                {profile?.universityName || 'Academy Realm'} • Timezone: {profile?.timezone || 'UTC'}
              </p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setIsProfileModalOpen(true)}>
            Edit Profile &amp; Dates
          </Button>
        </div>

        <div className="pt-3 border-t border-purple-500/15 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 block">Semester Bounds</span>
            <span className="font-mono text-slate-200">
              {profile?.semesterStartDate} to {profile?.semesterEndDate}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Character Nickname</span>
            <span className="text-purple-300 font-medium">
              {profile?.characterName || 'Unset'}
            </span>
          </div>
        </div>
      </Card>

      {/* RPG Gameplay & Professor Panic Settings */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="font-fantasy font-bold text-base text-slate-100">
            RPG Experience &amp; Companion
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust the comedic intensity of Professor Panic and application animations.
          </p>
        </div>

        {/* Humor Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Humor &amp; Dialogue Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['chill', 'playful', 'chaotic'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleHumorChange(mode)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  settings.humorIntensity === mode
                    ? 'bg-purple-950/60 border-purple-400 text-white shadow-lg shadow-purple-950/40 ring-1 ring-purple-400'
                    : 'bg-[#101324] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-fantasy font-bold text-xs uppercase">{mode}</span>
                  {settings.humorIntensity === mode && (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {mode === 'chill'
                    ? 'Calm, measured, encouraging advice without sensory overload.'
                    : mode === 'playful'
                    ? 'Witty banter, fun RPG references, and upbeat reminders.'
                    : 'Maximum panic, caffeine-fueled wizard hysteria, and pure chaotic energy!'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Companion Visibility and Accessibility Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-purple-500/15">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1122] border border-slate-800">
            <div>
              <span className="text-xs font-medium text-slate-200 block">
                Professor Panic Companion
              </span>
              <span className="text-[11px] text-slate-500">
                Show the floating wizard advisor on screen
              </span>
            </div>
            <button
              type="button"
              onClick={handleCompanionToggle}
              className={`p-2 rounded-lg border transition-colors ${
                settings.companionVisibility
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {settings.companionVisibility ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1122] border border-slate-800">
            <div>
              <span className="text-xs font-medium text-slate-200 block">
                Reduced Motion Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Minimizes floating animations and bursts
              </span>
            </div>
            <button
              type="button"
              onClick={handleReducedMotionToggle}
              className={`p-2 rounded-lg border transition-colors ${
                settings.reducedMotion
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* JSON Backup Export & Import */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="font-fantasy font-bold text-base text-slate-100">
            Backup &amp; Restore (JSON)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Because Syllaborn operates without a remote database, export backups to preserve your data across browsers or devices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export Box */}
          <div className="p-4 rounded-2xl bg-[#0e1122] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Export Data Backup
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Downloads a validated JSON snapshot containing all your courses, milestones, grading weights, XP transactions, and achievements.
            </p>
            <Button variant="cyan" size="sm" onClick={exportBackupData}>
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download JSON Backup</span>
            </Button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-2xl bg-[#0e1122] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Restore Data Backup
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Restore from a previously exported Syllaborn JSON file. The system validates the schema before importing.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImportFileSelected(file);
                };
                input.click();
              }}
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-purple-300" />
              <span>Select Backup File</span>
            </Button>
          </div>
        </div>

        {/* Import Preview Banner */}
        {importPreview && (
          <div className="p-4 rounded-2xl bg-[#141830] border border-cyan-400/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 font-mono uppercase">
                Backup Preview: {importFile?.name}
              </span>
              <Badge variant="cyan">Schema Valid (v{importPreview.version})</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-[#0b0e1a]">
                <span className="text-slate-500 block text-[10px]">Student</span>
                <span className="font-semibold text-slate-200">{importPreview.profileName || 'Unknown'}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0b0e1a]">
                <span className="text-slate-500 block text-[10px]">Courses</span>
                <span className="font-mono text-cyan-400 font-bold">{importPreview.coursesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0b0e1a]">
                <span className="text-slate-500 block text-[10px]">Quests</span>
                <span className="font-mono text-purple-300 font-bold">{importPreview.milestonesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#0b0e1a]">
                <span className="text-slate-500 block text-[10px]">Achievements</span>
                <span className="font-mono text-amber-300 font-bold">{importPreview.achievementsUnlocked}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setImportPreview(null)}>
                Cancel
              </Button>
              <Button variant="cyan" size="sm" onClick={handleConfirmImport}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Confirm Restore</span>
              </Button>
            </div>
          </div>
        )}

        {importError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{importSuccessMessage}</span>
          </div>
        )}
      </Card>

      {/* Danger Zone: Reset Local Data */}
      <Card className="p-6 border-rose-500/30 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-fantasy font-bold text-base text-rose-300">
              Reset Local Profile and Data
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Permanently purges all courses, milestones, XP transactions, and profile records from browser localStorage. This action cannot be undone.
            </p>
          </div>

          <Button variant="danger" size="sm" onClick={() => setIsResetConfirmOpen(true)}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Reset Data</span>
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1222] border border-rose-500/40 p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-fantasy font-bold text-lg">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Destructive Reset</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you absolutely certain? This will delete all course realms, extracted syllabus milestones, earned XP, and reset your character back to first-time onboarding.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleResetData}>
                Yes, Purge Everything
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
