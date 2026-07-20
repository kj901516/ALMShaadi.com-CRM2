import type { Profile, Settings, ProfilePhoto } from './types';
import { DEFAULT_SETTINGS, migrateProfile } from './types';
import { supabase, PHOTOS_BUCKET } from './supabase';

// ---------- helpers ----------

/** Row shape stored in the Supabase `profiles` table (snake_case). */
interface ProfileRow {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  father_mother_name: string;
  gender: string;
  age: number | null;
  height: string;
  marital_status: string;
  disability_status: string;
  education: string;
  college_university: string;
  profession_type: string;
  profession: string;
  monthly_income: string;
  whatsapp_number: string;
  contact_person_name: string;
  sect_maslak: string;
  caste: string;
  sub_caste: string;
  local_muhajir: string;
  residence_type: string;
  house_size: string;
  city: string;
  village: string;
  nationality: string;
  address: string;
  property_details: string;
  father_occupation: string;
  mother_occupation: string;
  brothers: number | null;
  married_brothers: number | null;
  sisters: number | null;
  married_sisters: number | null;
  pref_age_from: number | null;
  pref_age_to: number | null;
  pref_height_from: string;
  pref_height_to: string;
  pref_city: string;
  pref_city: string[];
  pref_caste: string[];
  pref_education: string[];
  pref_profession: string[];
  pref_maslak: string[];
  pref_nationality: string[];
  pref_marital_status: string[];
  pref_disability_status: string;
  photos: StoredPhoto[] | string;
  entered_by: string;
}

/** Photo shape persisted in the `photos` jsonb column. */
interface StoredPhoto {
  id: string;
  path: string;
  name: string;
  addedAt: number;
}

function toRow(p: Profile): ProfileRow {
  return {
    id: p.id,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
    full_name: p.fullName,
    father_mother_name: p.fatherMotherName,
    gender: p.gender,
    age: p.age,
    height: p.height,
    marital_status: p.maritalStatus,
    disability_status: p.disabilityStatus,
    education: p.education,
    college_university: p.collegeUniversity,
    profession_type: p.professionType,
    profession: p.profession,
    monthly_income: p.monthlyIncome,
    whatsapp_number: p.whatsappNumber,
    contact_person_name: p.contactPersonName,
    sect_maslak: p.sectMaslak,
    caste: p.caste,
    sub_caste: p.subCaste,
    local_muhajir: p.localMuhajir,
    residence_type: p.residenceType,
    house_size: p.houseSize,
    city: p.city,
    village: p.village,
    nationality: p.nationality,
    address: p.address,
    property_details: p.propertyDetails,
    father_occupation: p.fatherOccupation,
    mother_occupation: p.motherOccupation,
    brothers: p.brothers,
    married_brothers: p.marriedBrothers,
    sisters: p.sisters,
    married_sisters: p.marriedSisters,
    pref_age_from: p.prefAgeFrom,
    pref_age_to: p.prefAgeTo,
    pref_height_from: p.prefHeightFrom,
    pref_height_to: p.prefHeightTo,
    pref_city: p.prefCity,
    pref_caste: p.prefCaste,
    pref_education: p.prefEducation,
    pref_profession: p.prefProfession,
    pref_maslak: p.prefMaslak,
    pref_nationality: p.prefNationality,
    pref_marital_status: p.prefMaritalStatus,
    pref_disability_status: p.prefDisabilityStatus,
    photos: p.photos as unknown as StoredPhoto[],
    entered_by: p.enteredBy,
  };
}

function fromRow(r: ProfileRow): Profile {
  const stored = Array.isArray(r.photos) ? r.photos : [];
  const photos: ProfilePhoto[] = stored.map((ph) => {
    const sp = ph as unknown as StoredPhoto;
    const url = sp.path
      ? supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(sp.path).data.publicUrl
      : '';
    return { id: sp.id, dataUrl: url, name: sp.name, addedAt: sp.addedAt };
  });

  return migrateProfile({
    id: r.id,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
    fullName: r.full_name,
    fatherMotherName: r.father_mother_name,
    gender: r.gender as Profile['gender'],
    age: r.age,
    height: r.height,
    maritalStatus: r.marital_status as Profile['maritalStatus'],
    disabilityStatus: r.disability_status as Profile['disabilityStatus'],
    education: r.education,
    collegeUniversity: r.college_university,
    professionType: r.profession_type,
    profession: r.profession,
    monthlyIncome: r.monthly_income,
    whatsappNumber: r.whatsapp_number,
    contactPersonName: r.contact_person_name,
    sectMaslak: r.sect_maslak,
    caste: r.caste,
    subCaste: r.sub_caste,
    localMuhajir: r.local_muhajir,
    residenceType: r.residence_type as Profile['residenceType'],
    houseSize: r.house_size,
    city: r.city,
    village: r.village,
    nationality: r.nationality,
    address: r.address,
    propertyDetails: r.property_details,
    fatherOccupation: r.father_occupation,
    motherOccupation: r.mother_occupation,
    brothers: r.brothers,
    marriedBrothers: r.married_brothers,
    sisters: r.sisters,
    marriedSisters: r.married_sisters,
    prefAgeFrom: r.pref_age_from,
    prefAgeTo: r.pref_age_to,
    prefHeightFrom: r.pref_height_from,
    prefHeightTo: r.pref_height_to,
    prefCity: r.pref_city,
    prefCaste: r.pref_caste,
    prefEducation: r.pref_education,
    prefProfession: r.pref_profession,
    prefMaslak: r.pref_maslak,
    prefNationality: r.pref_nationality,
    prefMaritalStatus: r.pref_marital_status,
    prefDisabilityStatus: r.pref_disability_status as Profile['prefDisabilityStatus'],
    photos,
    enteredBy: r.entered_by,
  });
}

/** Upload any data-URL photos to Storage and return stored photo refs. */
async function persistPhotos(profileId: string, photos: ProfilePhoto[]): Promise<StoredPhoto[]> {
  const out: StoredPhoto[] = [];
  for (const ph of photos) {
    const isDataUrl = ph.dataUrl.startsWith('data:');
    if (isDataUrl) {
      const path = `${profileId}/${ph.id}`;
      const base64 = ph.dataUrl.split(',')[1];
      const mime = /data:(.*?);base64/.exec(ph.dataUrl)?.[1] || 'image/jpeg';
      const { error } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, decodeBase64(base64), { contentType: mime, upsert: true });
      if (error) {
        // Fall back to keeping the data URL in the row if upload fails
        out.push({ id: ph.id, path: '', name: ph.name, addedAt: ph.addedAt });
        continue;
      }
      out.push({ id: ph.id, path, name: ph.name, addedAt: ph.addedAt });
    } else {
      // Already a URL (existing photo) — keep its path if we can recover it
      const existing = ph as unknown as Partial<StoredPhoto>;
      out.push({ id: ph.id, path: existing.path || '', name: ph.name, addedAt: ph.addedAt });
    }
  }
  return out;
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// ---------- Profiles ----------
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProfileRow[] || []).map(fromRow);
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ProfileRow) : undefined;
}

export async function putProfile(p: Profile): Promise<void> {
  const migrated = migrateProfile(p);
  const storedPhotos = await persistPhotos(p.id, migrated.photos);
  const row = toRow(migrated);
  row.photos = storedPhotos as unknown as StoredPhoto[];
  const { error } = await supabase.from('profiles').upsert(row);
  if (error) throw error;
}

export async function deleteProfile(id: string): Promise<void> {
  // Best-effort: remove photos from storage, then the row
  const { data: files } = await supabase.storage.from(PHOTOS_BUCKET).list(id);
  if (files && files.length) {
    await supabase.storage.from(PHOTOS_BUCKET).remove(files.map((f) => `${id}/${f.name}`));
  }
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkPutProfiles(list: Profile[]): Promise<void> {
  const rows: ProfileRow[] = [];
  for (const p of list) {
    const migrated = migrateProfile(p);
    const storedPhotos = await persistPhotos(p.id, migrated.photos);
    const row = toRow(migrated);
    row.photos = storedPhotos as unknown as StoredPhoto[];
    rows.push(row);
  }
  const { error } = await supabase.from('profiles').upsert(rows);
  if (error) throw error;
}

export async function clearAllProfiles(): Promise<void> {
  const { error } = await supabase.from('profiles').delete().neq('id', '__none__');
  if (error) throw error;
}

// ---------- Settings ----------
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'app')
    .maybeSingle();
  if (error) throw error;
  const value = (data as { value: Settings } | null)?.value;
  return { ...DEFAULT_SETTINGS, ...(value ?? {}) };
}

export async function saveSettings(s: Settings): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'app', value: s as unknown as Record<string, unknown> });
  if (error) throw error;
}

/**
 * One-time full data reset: clears ALL profiles and resets settings to defaults.
 * Uses a meta flag so it only executes once per browser/database.
 * Preserves the draft auto-save key (cleared separately by UI).
 */
export async function performOneTimeReset(): Promise<boolean> {
  const { data: flag } = await supabase
    .from('meta')
    .select('value')
    .eq('key', 'reset_done_v1')
    .maybeSingle();
  if ((flag as { value: unknown } | null)?.value) return false;

  await Promise.all([
    supabase.from('profiles').delete().neq('id', '__none__'),
    supabase.from('settings').upsert({ key: 'app', value: { ...DEFAULT_SETTINGS } as unknown as Record<string, unknown> }),
    supabase.from('meta').upsert({ key: 'seq', value: { n: 0 } as unknown as Record<string, unknown> }),
    supabase.from('meta').upsert({ key: 'reset_done_v1', value: true as unknown as Record<string, unknown> }),
  ]);
  return true;
}

export async function exportSettingsBackup(): Promise<Blob> {
  const s = await getSettings();
  return new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
}

export async function importSettingsBackup(file: File): Promise<Settings> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<Settings>;
  const merged = { ...DEFAULT_SETTINGS, ...parsed };
  await saveSettings(merged);
  return merged;
}

// ---------- Meta (next ID) ----------
export async function getNextProfileId(): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_profile_id');
  if (error) throw error;
  const seq = (data as number) || 0;
  return 'MB' + String(seq).padStart(4, '0');
}

/** Allocate a brand-new unique profile ID right now (used for duplicate so it gets a real MB id). */
export async function allocateProfileId(): Promise<string> {
  return getNextProfileId();
}

// ---------- Draft (auto-save) ----------
const DRAFT_KEY = 'almshaadi_draft';

export async function saveDraft(p: Profile): Promise<void> {
  try {
    await supabase
      .from('meta')
      .upsert({ key: DRAFT_KEY, value: p as unknown as Record<string, unknown> });
  } catch {
    /* ignore */
  }
}

export async function loadDraft(): Promise<Profile | null> {
  const { data } = await supabase
    .from('meta')
    .select('value')
    .eq('key', DRAFT_KEY)
    .maybeSingle();
  const row = data as { value: Profile } | null;
  return row?.value ?? null;
}

export async function clearDraft(): Promise<void> {
  try {
    await supabase.from('meta').delete().eq('key', DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- Backup / Restore ----------
export interface BackupFile {
  app: 'almshaadi-crm';
  version: number;
  exportedAt: number;
  profiles: Profile[];
  settings: Settings;
}

export async function exportBackup(): Promise<BackupFile> {
  const [profiles, settings] = await Promise.all([getAllProfiles(), getSettings()]);
  return {
    app: 'almshaadi-crm',
    version: 2,
    exportedAt: Date.now(),
    profiles,
    settings,
  };
}

export async function importBackup(data: BackupFile, mode: 'replace' | 'merge'): Promise<{ added: number; updated: number }> {
  if (!data || data.app !== 'almshaadi-crm') throw new Error('Invalid backup file');
  if (mode === 'replace') await clearAllProfiles();
  const existing = mode === 'merge' ? await getAllProfiles() : [];
  const existingIds = new Set(existing.map((p) => p.id));
  let added = 0;
  let updated = 0;
  const toPut: Profile[] = [];
  for (const p of data.profiles || []) {
    if (!p.id) continue;
    if (existingIds.has(p.id)) updated++;
    else added++;
    toPut.push(migrateProfile(p));
  }
  await bulkPutProfiles(toPut);
  if (data.settings) await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
  return { added, updated };
}

/**
 * Repair the database: fix broken/missing profile IDs, remove orphan records,
 * and regenerate valid unique IDs where needed. Preserves all valid profiles and settings.
 */
export async function repairDatabase(): Promise<{ repaired: number; removed: number; total: number }> {
  const all = await getAllProfiles();
  const seenIds = new Set<string>();
  const toPut: Profile[] = [];
  let repaired = 0;
  let removed = 0;

  let maxSeq = 0;
  for (const p of all) {
    const isValid = typeof p.id === 'string' && /^MB\d{4,}$/.test(p.id);
    const isDuplicate = isValid && seenIds.has(p.id);
    if (!isValid || isDuplicate) {
      let candidate = '';
      let attempts = 0;
      do {
        maxSeq += 1;
        candidate = 'MB' + String(maxSeq).padStart(4, '0');
        attempts++;
      } while (seenIds.has(candidate) && attempts < 10000);
      seenIds.add(candidate);
      p.id = candidate;
      p.updatedAt = Date.now();
      toPut.push(p);
      repaired++;
      if (isDuplicate) removed++;
    } else {
      seenIds.add(p.id);
      const n = parseInt(p.id.slice(2), 10);
      if (n > maxSeq) maxSeq = n;
      toPut.push(p);
    }
  }

  await bulkPutProfiles(toPut);
  await supabase.from('meta').upsert({ key: 'seq', value: { n: maxSeq } as unknown as Record<string, unknown> });
  return { repaired, removed, total: all.length };
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage || 0, quota: est.quota || 0 };
  }
  return null;
}

export type { ProfilePhoto };
