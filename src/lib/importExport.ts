import type { Profile, Settings } from './types';
import { EMPTY_PROFILE } from './types';
import { uid } from './utils';
import * as XLSX from 'xlsx';

export interface ImportResult {
  count: number;
  errors: string[];
  profiles: Profile[];
}

const FIELD_ALIASES: Record<string, keyof Profile> = {
  profileid: 'id', id: 'id',
  fullname: 'fullName', name: 'fullName',
  gender: 'gender', age: 'age', height: 'height',
  maritalstatus: 'maritalStatus', marital: 'maritalStatus',
  disabilitystatus: 'disabilityStatus', disability: 'disabilityStatus',
  education: 'education', qualification: 'education',
  collegeuniversity: 'collegeUniversity', college: 'collegeUniversity', university: 'collegeUniversity',
  profession: 'profession', occupation: 'profession',
  monthlyincome: 'monthlyIncome', income: 'monthlyIncome',
  whatsappnumber: 'whatsappNumber', whatsapp: 'whatsappNumber', phone: 'whatsappNumber', mobile: 'whatsappNumber',
  sectmaslak: 'sectMaslak', sect: 'sectMaslak', maslak: 'sectMaslak',
  caste: 'caste', subcaste: 'subCaste',
  localmuhajir: 'localMuhajir', local: 'localMuhajir', muhajir: 'localMuhajir', migrated: 'localMuhajir', localmigrated: 'localMuhajir',
  residencetype: 'residenceType', housesize: 'houseSize',
  city: 'city', village: 'village', address: 'address', nationality: 'nationality',
  propertydetails: 'propertyDetails', property: 'propertyDetails',
  fatheroccupation: 'fatherOccupation', father: 'fatherOccupation',
  motheroccupation: 'motherOccupation', mother: 'motherOccupation',
  brothers: 'brothers', marriedbrothers: 'marriedBrothers',
  sisters: 'sisters', marriedsisters: 'marriedSisters',
  prefagefrom: 'prefAgeFrom', agefrom: 'prefAgeFrom',
  prefageto: 'prefAgeTo', ageto: 'prefAgeTo',
  prefheightfrom: 'prefHeightFrom', heightfrom: 'prefHeightFrom',
  prefheightto: 'prefHeightTo', heightto: 'prefHeightTo',
  prefcity: 'prefCity', prefcaste: 'prefCaste',
  prefmaslak: 'prefMaslak',
  prefnationality: 'prefNationality', prefcountry: 'prefNationality', prefnationalitycountry: 'prefNationality',
  prefmaritalstatus: 'prefMaritalStatus', prefmarital: 'prefMaritalStatus',
  fathermothername: 'fatherMotherName', fathername: 'fatherMotherName', mothername: 'fatherMotherName',
  contactpersonname: 'contactPersonName', contactperson: 'contactPersonName',
  professiontype: 'professionType',
  jobbusinessdetails: 'jobBusinessDetails', jobdetails: 'jobBusinessDetails', businessdetails: 'jobBusinessDetails',
  prefeducation: 'prefEducation',
  prefprofession: 'prefProfession',
  prefdisabilitystatus: 'prefDisabilityStatus',
  enteredby: 'enteredBy', staff: 'enteredBy',
};

const ARRAY_FIELDS: (keyof Profile)[] = ['prefEducation', 'prefProfession', 'prefCaste', 'prefCity', 'prefMaslak', 'prefNationality', 'prefMaritalStatus'];

function normKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z]/g, '');
}

function coerce(field: keyof Profile, value: unknown): unknown {
  if (value == null || value === '') return null;
  if (ARRAY_FIELDS.includes(field)) {
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    const s = String(value).trim();
    if (!s) return [];
    // split on | or , 
    return s.split(/[|,]/).map((v) => v.trim()).filter(Boolean);
  }
  const numericFields: (keyof Profile)[] = ['age', 'brothers', 'marriedBrothers', 'sisters', 'marriedSisters', 'prefAgeFrom', 'prefAgeTo'];
  if (numericFields.includes(field)) {
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    return isNaN(n) ? null : n;
  }
  return String(value).trim();
}

function rowToProfile(row: Record<string, unknown>, settings: Settings): Profile {
  const p = EMPTY_PROFILE();
  p.createdAt = Date.now();
  p.updatedAt = Date.now();
  p.nationality = settings.defaultNationality || p.nationality;
  p.city = settings.defaultCity || p.city;
  p.enteredBy = settings.bureauName || '';
  for (const [k, v] of Object.entries(row)) {
    const key = normKey(k);
    const field = FIELD_ALIASES[key];
    if (field) {
      (p as unknown as Record<string, unknown>)[field] = coerce(field, v);
    }
  }
  if (!p.id) p.id = 'IMP-' + uid();
  return p;
}

function parseCsv(text: string): Record<string, unknown>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return [];
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { cur.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (field || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ''; }
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else field += ch;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const headers = rows[0].map((h) => h.trim());
  const out: Record<string, unknown>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const obj: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = rows[r][c] ?? '';
    out.push(obj);
  }
  return out;
}

export async function importFile(file: File, settings: Settings): Promise<ImportResult> {
  const errors: string[] = [];
  let rows: Record<string, unknown>[] = [];
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith('.csv')) {
      const text = await file.text();
      rows = parseCsv(text);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
    } else {
      throw new Error('Unsupported file type. Use CSV or XLSX.');
    }
  } catch (e) {
    return { count: 0, errors: [(e as Error).message], profiles: [] };
  }
  if (!rows.length) return { count: 0, errors: ['No rows found in file'], profiles: [] };
  const profiles = rows.map((r) => rowToProfile(r, settings));
  return { count: profiles.length, errors, profiles };
}

function serializeForExport(profiles: Profile[]) {
  const headers = Object.keys(EMPTY_PROFILE()).filter((k) => k !== 'photos');
  const data = profiles.map((p) => {
    const row: Record<string, unknown> = {};
    for (const h of headers) {
      const val = (p as unknown as Record<string, unknown>)[h];
      // join arrays with | for CSV/Excel
      row[h] = Array.isArray(val) ? val.join('|') : val;
    }
    row.photos = (p.photos || []).length;
    return row;
  });
  return { headers, data };
}

export function exportProfilesCSV(profiles: Profile[]) {
  const { headers, data } = serializeForExport(profiles);
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const csv = XLSX.utils.sheet_to_csv(ws);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

export function exportProfilesXLSX(profiles: Profile[]) {
  const { headers, data } = serializeForExport(profiles);
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Profiles');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function exportProfilesJSON(profiles: Profile[]) {
  return new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
}
