/**
 * Self-contained JSON Backup & Restore system.
 *
 * This module is completely isolated from all existing business logic.
 * It does NOT modify: Share, WhatsApp, PDF, Card, Photo Upload,
 * persistPhotos, putProfile, Search, Matching, Filters, or Settings.
 *
 * Exports produce JSON files with every image embedded as a Base64 Data URI,
 * so a restored file has zero external dependencies.
 *
 * Restore reuses the existing save flow (addProfile / bulkAdd) and existing
 * upload logic (persistPhotos via putProfile), so no new write paths exist.
 */

import type { Profile, Settings, ProfilePhoto } from './types';
import { EMPTY_PROFILE, migrateProfile } from './types';
import { supabase, PHOTOS_BUCKET } from './supabase';
import { uid } from './utils';

// ---------- Shared types ----------

export interface JsonBackupFile {
  app: 'almshaadi-crm';
  kind: 'full-backup';
  version: number;
  exportedAt: number;
  profiles: Profile[];
  settings: Settings;
}

export interface JsonProfileFile {
  app: 'almshaadi-crm';
  kind: 'single-profile';
  version: number;
  exportedAt: number;
  profile: Profile;
}

const APP_TAG = 'almshaadi-crm';
const BACKUP_VERSION = 1;

// ---------- Helpers ----------

/** Fetch a remote Storage URL and convert it to a Base64 data URI. */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Embed all photo URLs as Base64 data URIs so the export is self-contained. */
async function embedPhotos(photos: ProfilePhoto[]): Promise<ProfilePhoto[]> {
  const out: ProfilePhoto[] = [];
  for (const ph of photos || []) {
    if (ph.dataUrl && ph.dataUrl.startsWith('data:')) {
      out.push({ ...ph });
      continue;
    }
    if (ph.dataUrl) {
      try {
        const dataUrl = await urlToDataUrl(ph.dataUrl);
        out.push({ id: ph.id, dataUrl, name: ph.name, addedAt: ph.addedAt });
      } catch {
        // Skip photos that can't be fetched rather than failing the whole export
        out.push({ id: ph.id, dataUrl: '', name: ph.name, addedAt: ph.addedAt });
      }
    } else {
      out.push({ ...ph });
    }
  }
  return out;
}

// ---------- Export ----------

/** Export a single profile as a self-contained JSON file (photos embedded as Base64). */
export async function exportProfileJson(profile: Profile): Promise<JsonProfileFile> {
  const embeddedPhotos = await embedPhotos(profile.photos);
  return {
    app: APP_TAG,
    kind: 'single-profile',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    profile: { ...profile, photos: embeddedPhotos },
  };
}

/** Export the entire CRM (all profiles + settings) as one self-contained JSON file. */
export async function exportFullJsonBackup(
  profiles: Profile[],
  settings: Settings,
): Promise<JsonBackupFile> {
  const embedded: Profile[] = [];
  for (const p of profiles) {
    const photos = await embedPhotos(p.photos);
    embedded.push({ ...p, photos });
  }
  return {
    app: APP_TAG,
    kind: 'full-backup',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    profiles: embedded,
    settings,
  };
}

// ---------- Import / Restore ----------

/** Parse and validate a JSON file. Returns a typed union or throws. */
export async function parseJsonBackupFile(text: string): Promise<JsonProfileFile | JsonBackupFile> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file — could not parse.');
  }
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid backup file — expected a JSON object.');
  }
  const obj = data as Record<string, unknown>;
  if (obj.app !== APP_TAG) {
    throw new Error('This file was not created by ALMShaadi CRM.');
  }
  if (obj.kind === 'single-profile') {
    return obj as unknown as JsonProfileFile;
  }
  if (obj.kind === 'full-backup') {
    return obj as unknown as JsonBackupFile;
  }
  throw new Error('Unrecognized backup file kind.');
}

/**
 * Prepare a single restored profile for loading into the Profile Form.
 * Strips the old ID and timestamps so the existing "Add" flow assigns fresh ones.
 * Photos keep their Base64 data URIs so the existing upload path handles them.
 */
export function prepareRestoredProfile(file: JsonProfileFile): Profile {
  const base = migrateProfile(file.profile);
  return {
    ...base,
    id: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photos: (file.profile.photos || []).map((ph) => ({
      id: ph.id || uid(),
      dataUrl: ph.dataUrl || '',
      name: ph.name || 'photo',
      addedAt: ph.addedAt || Date.now(),
    })),
  };
}

/**
 * Prepare all profiles from a full backup for saving via the existing bulkAdd flow.
 * Preserves original IDs so merge/replace semantics work with existing profiles.
 */
export function prepareRestoredBackup(file: JsonBackupFile): Profile[] {
  return (file.profiles || [])
    .filter((p) => p && p.id)
    .map((p) => {
      const base = migrateProfile(p);
      return {
        ...base,
        photos: (p.photos || []).map((ph) => ({
          id: ph.id || uid(),
          dataUrl: ph.dataUrl || '',
          name: ph.name || 'photo',
          addedAt: ph.addedAt || Date.now(),
        })),
      };
    });
}

// ---------- Storage cleanup helper (used only by full restore in replace mode) ----------

/** Best-effort removal of all existing Storage objects before a replace restore. */
export async function clearStorageForReplace(): Promise<void> {
  try {
    const { data: folders } = await supabase.storage.from(PHOTOS_BUCKET).list();
    if (!folders || folders.length === 0) return;
    const allPaths: string[] = [];
    for (const folder of folders) {
      const { data: files } = await supabase.storage.from(PHOTOS_BUCKET).list(folder.name);
      if (files && files.length) {
        for (const f of files) allPaths.push(`${folder.name}/${f.name}`);
      }
    }
    if (allPaths.length) {
      await supabase.storage.from(PHOTOS_BUCKET).remove(allPaths);
    }
  } catch {
    // Non-fatal: existing clearAllProfiles() handles the DB rows
  }
}

export { EMPTY_PROFILE };
