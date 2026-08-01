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
    const path = sp.path || `${r.id}/${sp.id}`;
    const url = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
    return { id: sp.id, dataUrl: url, name: sp.name, addedAt: sp.addedAt, path };
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

/** Draw a watermark (profile ID) onto a data: URL image and return a new data: URL.
 *  This is used only for newly uploaded photos before they are uploaded to storage.
 *  The watermark is rendered vertically along the right edge, semi-transparent.
 */
async function watermarkDataUrl(dataUrl: string, watermarkText: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const width = img.width;
          const height = img.height;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0, width, height);

          // Watermark styling (vertical on right edge)
          const margin = Math.max(12, Math.round(Math.min(width, height) * 0.02));
          const fontSize = Math.max(14, Math.round(width * 0.045)); // medium size
          ctx.font = `700 ${fontSize}px sans-serif`;
          ctx.textBaseline = 'middle';

          // Prepare vertical layout by stacking characters
          const letters = watermarkText.split('');
          const lineHeight = Math.round(fontSize * 1.1);
          const totalHeight = letters.length * lineHeight;

          const padX = Math.round(fontSize * 0.5);
          const padY = Math.round(fontSize * 0.35);
          const rectW = fontSize + padX * 2;
          const rectH = totalHeight + padY * 2;
          const rectX = width - rectW - margin;
          const rectY = height - rectH - margin; // place near bottom-right vertically

          // Draw semi-transparent white background (30% opacity)
          ctx.fillStyle = 'rgba(255,255,255,0.30)';
          const radius = Math.round(padY);
          ctx.beginPath();
          ctx.moveTo(rectX + radius, rectY);
          ctx.arcTo(rectX + rectW, rectY, rectX + rectW, rectY + rectH, radius);
          ctx.arcTo(rectX + rectW, rectY + rectH, rectX, rectY + rectH, radius);
          ctx.arcTo(rectX, rectY + rectH, rectX, rectY, radius);
          ctx.arcTo(rectX, rectY, rectX + rectW, rectY, radius);
          ctx.closePath();
          ctx.fill();

          // Draw each letter stacked top-to-bottom inside the rect
          ctx.fillStyle = '#000';
          ctx.font = `700 ${fontSize}px sans-serif`;
          const startX = rectX + padX;
          let y = rectY + padY + Math.round(fontSize / 2);
          for (const ch of letters) {
            ctx.fillText(ch, startX, y + 1);
            y += lineHeight;
          }

          // Export preserving PNG when possible
          const mimeMatch = /^data:(image\/(png|jpeg|jpg));base64,/.exec(dataUrl);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const outDataUrl = mime === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
          resolve(outDataUrl);
        } catch (ex) {
          // eslint-disable-next-line no-console
          console.error('watermarkDataUrl draw error', ex);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('watermarkDataUrl error', e);
      resolve(dataUrl);
    }
  });
}

/** Upload any data-URL photos to Storage and return stored photo refs. */
async function persistPhotos(profileId: string, photos: ProfilePhoto[]): Promise<StoredPhoto[]> {
  const out: StoredPhoto[] = [];
  for (const ph of photos) {
    const isDataUrl = ph.dataUrl.startsWith('data:');
    if (isDataUrl) {
      // Insert watermark step for new uploads when profileId is present
      let toUploadDataUrl = ph.dataUrl;
      if (profileId) {
        try {
          toUploadDataUrl = await watermarkDataUrl(ph.dataUrl, profileId);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('persistPhotos watermark failed', e);
          toUploadDataUrl = ph.dataUrl;
        }
      }

      const path = `${profileId}/${ph.id}`;
      const base64 = toUploadDataUrl.split(',')[1];
      const mime = /data:(.*?);base64/.exec(toUploadDataUrl)?.[1] || 'image/jpeg';
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
