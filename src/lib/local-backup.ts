import { storage } from './storage';
import { syllabornDataDocumentSchema } from './validation';
import { SyllabornDataDocument } from '../types';

export interface BackupPreview {
  version: number;
  profileName: string | null;
  coursesCount: number;
  milestonesCount: number;
  achievementsUnlocked: number;
  exportedAt?: string;
  valid: boolean;
  error?: string;
}

export function exportBackupData(): void {
  const data = storage.load();
  const exportPayload = {
    ...data,
    exportedAt: new Date().toISOString(),
    appName: 'Syllaborn',
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  const dateStr = new Date().toISOString().split('T')[0];
  anchor.href = url;
  anchor.download = `syllaborn-backup-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function inspectBackupJson(jsonString: string): { preview: BackupPreview | null; parsedData: SyllabornDataDocument | null; error?: string } {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = syllabornDataDocumentSchema.safeParse(raw);

    if (!parsed.success) {
      const errorDetails = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return {
        preview: null,
        parsedData: null,
        error: `Invalid backup schema: ${errorDetails}`,
      };
    }

    const data = parsed.data as SyllabornDataDocument;
    const preview: BackupPreview = {
      version: data.version,
      profileName: data.profile?.displayName ?? null,
      coursesCount: data.courses.length,
      milestonesCount: data.milestones.length,
      achievementsUnlocked: data.achievements.filter((a) => a.unlockedAt).length,
      exportedAt: (raw as any)?.exportedAt,
      valid: true,
    };

    return { preview, parsedData: data };
  } catch (err: any) {
    return {
      preview: null,
      parsedData: null,
      error: `Malformed JSON: ${err?.message || 'Could not parse file.'}`,
    };
  }
}

export function restoreBackupData(data: SyllabornDataDocument): boolean {
  return storage.save(data);
}
