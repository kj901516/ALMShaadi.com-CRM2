import type { Profile } from './types';
import { heightToInches } from './utils';

export interface MatchResult {
  profile: Profile;
  score: number; // 0-100
  reasons: { label: string; ok: boolean }[];
}

function ageScore(p: Profile, pref: { from: number | null; to: number | null }): number {
  if (pref.from == null && pref.to == null) return 100;
  if (p.age == null) return 50;
  const from = pref.from ?? 0;
  const to = pref.to ?? 200;
  if (p.age >= from && p.age <= to) return 100;
  const dist = p.age < from ? from - p.age : p.age - to;
  return Math.max(0, 100 - dist * 15);
}

function heightScore(p: Profile, pref: { from: string; to: string }): number {
  if (!pref.from && !pref.to) return 100;
  const h = heightToInches(p.height);
  if (h == null) return 50;
  const lo = heightToInches(pref.from);
  const hi = heightToInches(pref.to);
  if (lo == null && hi == null) return 100;
  const min = lo ?? 0;
  const max = hi ?? 200;
  if (h >= min && h <= max) return 100;
  const dist = h < min ? min - h : h - max;
  return Math.max(0, 100 - dist * 12);
}

function textScore(val: string, pref: string): number {
  if (!pref) return 100;
  if (!val) return 0;
  const a = val.toLowerCase().trim();
  const b = pref.toLowerCase().trim();
  if (!b) return 100;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  return 0;
}

function arrayScore(val: string, pref: string[]): number {
  if (!pref || pref.length === 0) return 100;
  if (pref.includes('Any')) return 100;
  if (!val) return 0;
  const v = val.toLowerCase().trim();
  for (const p of pref) {
    const pp = p.toLowerCase().trim();
    if (v === pp || v.includes(pp) || pp.includes(v)) return 100;
  }
  return 0;
}

function disabilityScore(val: string, pref: string): number {
  if (!pref || pref === 'Any') return 100;
  if (!val) return pref === 'None' ? 100 : 50;
  if (val === pref) return 100;
  return 0;
}

export function matchOne(source: Profile, candidate: Profile): MatchResult {
  const reasons: { label: string; ok: boolean }[] = [];

  const age = ageScore(candidate, { from: source.prefAgeFrom, to: source.prefAgeTo });
  reasons.push({ label: 'Age preference', ok: age >= 80 });

  const height = heightScore(candidate, { from: source.prefHeightFrom, to: source.prefHeightTo });
  reasons.push({ label: 'Height preference', ok: height >= 80 });

  const city = arrayScore(candidate.city, source.prefCity);
  reasons.push({ label: 'City preference', ok: city >= 80 });

  const caste = arrayScore(candidate.caste, source.prefCaste);
  reasons.push({ label: 'Caste preference', ok: caste >= 80 });

  const edu = arrayScore(candidate.education, source.prefEducation);
  reasons.push({ label: 'Education preference', ok: edu >= 80 });

  const prof = arrayScore(candidate.profession, source.prefProfession);
  reasons.push({ label: 'Profession preference', ok: prof >= 80 });

  const maslak = arrayScore(candidate.sectMaslak, source.prefMaslak);
  reasons.push({ label: 'Maslak preference', ok: maslak >= 80 });

  const nationality = arrayScore(candidate.nationality, source.prefNationality);
  reasons.push({ label: 'Nationality preference', ok: nationality >= 80 });

  const marital = arrayScore(candidate.maritalStatus, source.prefMaritalStatus);
  reasons.push({ label: 'Marital status preference', ok: marital >= 80 });

  const dis = disabilityScore(candidate.disabilityStatus || '', source.prefDisabilityStatus || 'Any');
  reasons.push({ label: 'Disability preference', ok: dis >= 80 });

  const score = Math.round((age + height + city + caste + edu + prof + maslak + nationality + marital + dis) / 10);
  return { profile: candidate, score, reasons };
}

export function findMatches(source: Profile, all: Profile[]): MatchResult[] {
  const pool = all.filter(
    (p) => p.id !== source.id && source.gender && p.gender && p.gender !== source.gender,
  );
  return pool
    .map((c) => matchOne(source, c))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
