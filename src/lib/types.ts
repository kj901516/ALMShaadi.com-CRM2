*** Begin Patch
*** Update File: src/lib/types.ts
@@
-*** Begin Patch
-*** Update File: src/lib/types.ts
-@@
-   prefMaritalStatus: string[];
--  prefDisabilityStatus: DisabilityStatus;
-+  prefDisabilityStatus: DisabilityStatus;
-+  prefLocalMuhajir?: string;
-@@
--  prefMaritalStatus: [],
--  prefDisabilityStatus: '',
-+  prefMaritalStatus: [],
-+  prefDisabilityStatus: 'None',
-+  prefLocalMuhajir: 'Any',
-*** End Patch
+export type Gender = 'Male' | 'Female' | '';
+export type MaritalStatus = 'Never Married' | 'Divorced' | 'Widowed' | 'Awaiting Divorce' | 'Annulled' | '';
+export type DisabilityStatus = 'None' | 'Physical Disability' | 'Hearing Impairment' | 'Visual Impairment' | 'Other' | '';
+export type ResidenceType = 'Own House' | 'Rental House' | '';
+
+export interface ProfilePhoto {
+  id: string;
+  dataUrl: string; // base64
+  name: string;
+  addedAt: number;
+}
+
+export interface Profile {
+  id: string; // MB0001
+  createdAt: number;
+  updatedAt: number;
+
+  // Basic
+  fullName: string;
+  fatherMotherName: string;
+  gender: Gender;
+  age: number | null;
+  height: string; // e.g. 5'9"
+  maritalStatus: MaritalStatus;
+  disabilityStatus: DisabilityStatus;
+  education: string; // Qualification
+  collegeUniversity: string;
+  professionType: string;
+  profession: string; // Job / Business Details
+  monthlyIncome: string;
+  whatsappNumber: string;
+  contactPersonName: string;
+
+  // Religion
+  sectMaslak: string;
+  caste: string;
+  subCaste: string;
+  localMuhajir: string; // Local / Migrated
+
+  // Residence (includes property details)
+  residenceType: ResidenceType;
+  houseSize: string;
+  city: string;
+  village: string;
+  nationality: string;
+  address: string;
+  propertyDetails: string;
+
+  // Family
+  fatherOccupation: string;
+  motherOccupation: string;
+  brothers: number | null;
+  marriedBrothers: number | null;
+  sisters: number | null;
+  marriedSisters: number | null;
+
+  // Partner requirements
+  prefAgeFrom: number | null;
+  prefAgeTo: number | null;
+  prefHeightFrom: string;
+  prefHeightTo: string;
+  prefCity: string[];
+  prefCaste: string[];
+  prefEducation: string[]; // multi-select
+  prefProfession: string[]; // multi-select
+  prefMaslak: string[];
+  prefNationality: string[];
+  prefMaritalStatus: string[];
+  prefDisabilityStatus: DisabilityStatus;
+
+  // Photos
+  photos: ProfilePhoto[];
+
+  // Staff
+  enteredBy: string;
+}
+
+export interface Settings {
+  bureauName: string;
+  myWhatsAppNumber: string;
+  bureauAddress: string;
+  bureauLogo: string; // dataURL
+  themeColor: string;
+  defaultCity: string;
+  defaultNationality: string;
+  adminMode: boolean;
+}
+
+export const DEFAULT_SETTINGS: Settings = {
+  bureauName: 'ALMShaadi.com Marriage Bureau',
+  myWhatsAppNumber: '',
+  bureauAddress: '',
+  bureauLogo: '',
+  themeColor: 'maroon',
+  defaultCity: '',
+  defaultNationality: 'Pakistani',
+  adminMode: true,
+};
+
+export const EMPTY_PROFILE = (): Profile => ({
+  id: '',
+  createdAt: Date.now(),
+  updatedAt: Date.now(),
+  fullName: '',
+  fatherMotherName: '',
+  gender: '',
+  age: null,
+  height: '',
+  maritalStatus: '',
+  disabilityStatus: '',
+  education: '',
+  collegeUniversity: '',
+  professionType: '',
+  profession: '',
+  monthlyIncome: '',
+  whatsappNumber: '',
+  contactPersonName: '',
+  sectMaslak: '',
+  caste: '',
+  subCaste: '',
+  localMuhajir: '',
+  residenceType: '',
+  houseSize: '',
+  city: '',
+  village: '',
+  nationality: '',
+  address: '',
+  propertyDetails: '',
+  fatherOccupation: '',
+  motherOccupation: '',
+  brothers: null,
+  marriedBrothers: null,
+  sisters: null,
+  marriedSisters: null,
+  prefAgeFrom: null,
+  prefAgeTo: null,
+  prefHeightFrom: '',
+  prefHeightTo: '',
+  prefCity: [],
+  prefCaste: [],
+  prefEducation: [],
+  prefProfession: [],
+  prefMaslak: [],
+  prefNationality: [],
+  prefMaritalStatus: [],
+  prefDisabilityStatus: '',
+  photos: [],
+  enteredBy: '',
+});
+
+/** Merge any profile (possibly from older schema) with defaults so new fields always exist. */
+export function migrateProfile(p: PartialProfile): Profile {
+  const base = EMPTY_PROFILE();
+  const merged = { ...base, ...p };
+  // Ensure array fields are arrays
+  merged.prefCity = Array.isArray(p.prefCity) ? p.prefCity : (typeof p.prefCity === 'string' && p.prefCity ? String(p.prefCity).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefCaste = Array.isArray(p.prefCaste) ? p.prefCaste : (typeof p.prefCaste === 'string' && p.prefCaste ? String(p.prefCaste).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefEducation = Array.isArray(p.prefEducation) ? p.prefEducation : (typeof p.prefEducation === 'string' && p.prefEducation ? String(p.prefEducation).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefProfession = Array.isArray(p.prefProfession) ? p.prefProfession : (typeof p.prefProfession === 'string' && p.prefProfession ? String(p.prefProfession).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefMaslak = Array.isArray(p.prefMaslak) ? p.prefMaslak : (typeof p.prefMaslak === 'string' && p.prefMaslak ? String(p.prefMaslak).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefNationality = Array.isArray(p.prefNationality) ? p.prefNationality : (typeof p.prefNationality === 'string' && p.prefNationality ? String(p.prefNationality).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.prefMaritalStatus = Array.isArray(p.prefMaritalStatus) ? p.prefMaritalStatus : (typeof p.prefMaritalStatus === 'string' && p.prefMaritalStatus ? String(p.prefMaritalStatus).split(/[|,]/).map((s) => s.trim()).filter(Boolean) : []);
+  merged.photos = p.photos || [];
+  return merged;
+}
*** End Patch