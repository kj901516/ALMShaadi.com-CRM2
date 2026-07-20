import { useEffect, useRef, useState } from 'react';
import type { Profile, Settings } from '../lib/types';
import { EMPTY_PROFILE } from '../lib/types';
import { getNextProfileId, saveDraft, loadDraft, clearDraft } from '../lib/db';
import { Field, TextInput, Select, Textarea, SectionTitle } from './Form';
import PhotoUpload from './PhotoUpload';
import { useKeyboardNav } from '../lib/useKeyboardNav';
import { User, Briefcase, Users, Heart, Save, X, Zap, BookOpen, Home, Check } from 'lucide-react';

interface Props {
  initial?: Profile | null;
  settings: Settings;
  onSave: (p: Profile) => Promise<void>;
  onCancel: () => void;
}

const MARITAL = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce', 'Annulled'];
const GENDERS = ['Male', 'Female'];
const DISABILITY = ['None', 'Physical Disability', 'Hearing Impairment', 'Visual Impairment', 'Other'];
const RESIDENCE = ['Own House', 'Rental House'];
const PREF_DISABILITY = ['Any', 'None', 'Physical Disability', 'Hearing Impairment', 'Visual Impairment', 'Other'];
const EDU_OPTIONS = ['MBBS', 'Engineer', 'BS IT', 'BSc', 'MSc', 'MBA', 'PhD', 'FA', 'BA', 'MA', 'Masters', 'Any'];
const PROF_OPTIONS = ['Doctor', 'Engineer', 'Government Job', 'Private Job', 'Business', 'Businessman', 'Teacher', 'Government Employee', 'Any'];
const CASTE_OPTIONS = ['Jutt', 'Rajput', 'Arain', 'Gujjar', 'Butt', 'Mughal', 'Syed', 'Qureshi', 'Awan', 'Malik', 'Sheikh', 'Pathan', 'Any'];
const PROF_TYPE_OPTIONS = ['Government Job', 'Private Job', 'Business'];
const CITY_OPTIONS = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Hyderabad', 'Peshawar', 'Quetta', 'Any'];
const MASLAK_OPTIONS = ['Barelvi', 'Deobandi', 'Ahl-e-Hadees', 'Shia', 'Sunni', 'Any'];
const NATIONALITY_OPTIONS = ['Pakistan', 'UAE', 'Saudi Arabia', 'UK', 'Canada', 'USA', 'Any'];
const PREF_MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce', 'Annulled', 'Any'];

type FieldKey =
  | 'fullName' | 'fatherMotherName' | 'gender' | 'age' | 'height' | 'maritalStatus' | 'disabilityStatus'
  | 'education' | 'collegeUniversity' | 'professionType' | 'profession' | 'monthlyIncome' | 'whatsappNumber' | 'contactPersonName'
  | 'sectMaslak' | 'caste' | 'subCaste' | 'localMuhajir'
  | 'residenceType' | 'houseSize' | 'city' | 'village' | 'nationality' | 'address' | 'propertyDetails'
  | 'fatherOccupation' | 'motherOccupation' | 'brothers' | 'marriedBrothers' | 'sisters' | 'marriedSisters'
  | 'prefAgeFrom' | 'prefAgeTo' | 'prefHeightFrom' | 'prefHeightTo' | 'prefCity' | 'prefCaste'
  | 'prefMaslak' | 'prefNationality' | 'prefMaritalStatus'
  | 'prefDisabilityStatus' | 'prefEducation' | 'prefProfession' | 'enteredBy';

const FIELD_ORDER: FieldKey[] = [
  'fullName', 'fatherMotherName', 'gender', 'age', 'height', 'maritalStatus', 'disabilityStatus',
  'education', 'collegeUniversity', 'professionType', 'profession', 'monthlyIncome', 'whatsappNumber', 'contactPersonName',
  'sectMaslak', 'caste', 'subCaste', 'localMuhajir',
  'residenceType', 'houseSize', 'city', 'village', 'nationality', 'address', 'propertyDetails',
  'fatherOccupation', 'motherOccupation', 'brothers', 'marriedBrothers', 'sisters', 'marriedSisters',
  'prefAgeFrom', 'prefAgeTo', 'prefHeightFrom', 'prefHeightTo', 'prefCity', 'prefCaste',
  'prefMaslak', 'prefNationality', 'prefMaritalStatus',
  'prefDisabilityStatus', 'prefEducation', 'prefProfession', 'enteredBy',
];

function MultiSelect({ options, values, onChange, attachProps }: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  attachProps: Record<string, unknown>;
}) {
  const [customInput, setCustomInput] = useState('');
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  const addCustom = () => {
    const parts = customInput.split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    const newVals = [...values];
    for (const p of parts) {
      if (!newVals.includes(p)) newVals.push(p);
    }
    onChange(newVals);
    setCustomInput('');
  };
  const handleCustomKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustom();
    }
  };
  const presetSet = new Set(options);
  const customSelected = values.filter((v) => !presetSet.has(v));
  return (
    <div {...attachProps} className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[42px]">
        {options.map((opt) => {
          const sel = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                sel ? 'bg-maroon-700 text-white border-maroon-700' : 'bg-cream-50 text-gray-600 border-cream-300 hover:border-gold-400'
              }`}
            >
              {sel && <Check size={12} />} {opt}
            </button>
          );
        })}
      </div>
      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customSelected.map((c) => (
            <span key={c} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gold-100 text-gold-800 border border-gold-300 flex items-center gap-1">
              {c}
              <button type="button" onClick={() => toggle(c)} className="hover:text-gold-900"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleCustomKey}
          placeholder="Type custom value(s), comma-separated…"
          className="flex-1 px-3 py-1.5 rounded-lg border border-cream-300 bg-cream-50 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        <button type="button" onClick={addCustom} className="px-3 py-1.5 rounded-lg bg-maroon-700 text-white text-xs font-semibold hover:bg-maroon-800 transition">
          Add
        </button>
      </div>
    </div>
  );
}

export default function ProfileForm({ initial, settings, onSave, onCancel }: Props) {
  const [p, setP] = useState<Profile>(() => {
    if (initial) return { ...initial, updatedAt: Date.now() };
    const base = EMPTY_PROFILE();
    base.city = settings.defaultCity || '';
    base.nationality = settings.defaultNationality || 'Pakistani';
    base.enteredBy = settings.bureauName || '';
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [draftRestored, setDraftRestored] = useState(false);

  const isEditing = !!initial;
  const { containerRef, setOrder, focusField, handleKeyDown } = useKeyboardNav<FieldKey>({
    enabled: fastMode,
    initialFocusKey: 'fullName',
  });

  useEffect(() => {
    setOrder(FIELD_ORDER);
  }, [setOrder]);

  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pRef = useRef(p);
  pRef.current = p;

  useEffect(() => {
    if (isEditing) return;
    (async () => {
      const draft = await loadDraft();
      if (draft && draft.fullName && !draft.id) {
        if (confirm('An unfinished profile draft was found. Restore it?')) {
          setP(draft);
        } else {
          await clearDraft();
        }
      }
      setDraftRestored(true);
    })();
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [isEditing]);

  useEffect(() => {
    if (isEditing || !draftRestored) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const cur = pRef.current;
      if (cur.fullName || cur.whatsappNumber || cur.city) {
        saveDraft({ ...cur, id: '' });
      }
    }, 2000);
  }, [p, isEditing, draftRestored]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const numOr = (v: string) => (v === '' ? null : Number(v));

  const fieldProps = (key: FieldKey) => ({
    'data-field': key,
    onKeyDown: handleKeyDown,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (typeof (e.target as HTMLInputElement).select === 'function') {
        (e.target as HTMLInputElement).select();
      }
    },
  });

  const handleSave = async () => {
    if (!p.fullName.trim()) {
      alert('Full Name is required');
      focusField('fullName');
      return;
    }
    setSaving(true);
    let toSave = p;
    if (!toSave.id) {
      const id = await getNextProfileId();
      toSave = { ...toSave, id, createdAt: Date.now(), updatedAt: Date.now() };
    } else {
      toSave = { ...toSave, updatedAt: Date.now() };
    }
    await onSave(toSave);
    await clearDraft();
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!isEditing && (p.fullName || p.whatsappNumber || p.city)) {
      if (confirm('Save this profile as a draft before leaving?')) {
        await saveDraft({ ...p, id: '' });
      } else {
        await clearDraft();
      }
    }
    onCancel();
  };

  return (
    <div className="max-w-4xl mx-auto pb-24" ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-cream-50/90 backdrop-blur z-10 py-3 -mx-4 px-4">
        <h2 className="text-xl font-bold text-maroon-800">{initial ? 'Edit Profile' : 'Add New Profile'}</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            onClick={() => setFastMode((f) => !f)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
              fastMode ? 'bg-gold-500 text-maroon-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Fast Entry Mode: Enter jumps to next field"
          >
            <Zap size={16} /> Fast Mode
          </button>
          <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5">
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-maroon-700 hover:bg-maroon-800 transition flex items-center gap-1.5 disabled:opacity-60">
            <Save size={16} /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {fastMode && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-gold-100 border border-gold-300 text-gold-800 text-xs font-medium flex items-center gap-2">
          <Zap size={14} /> Fast Entry Mode is ON — press <kbd className="px-1.5 py-0.5 rounded bg-white border border-gold-300 font-mono">Enter</kbd> for next field,{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-gold-300 font-mono">Shift+Enter</kbd> for previous. No mouse needed.
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<User size={18} />}>Profile Photos</SectionTitle>
          <PhotoUpload photos={p.photos} onChange={(photos) => set('photos', photos)} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<User size={18} />}>Basic Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Full Name">
              <TextInput {...fieldProps('fullName')} value={p.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Father / Mother Name">
              <TextInput {...fieldProps('fatherMotherName')} value={p.fatherMotherName} onChange={(e) => set('fatherMotherName', e.target.value)} placeholder="Father / Mother name" />
            </Field>
            <Field label="Gender">
              <Select {...fieldProps('gender')} value={p.gender} onChange={(e) => set('gender', e.target.value as Profile['gender'])}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="Age">
              <TextInput {...fieldProps('age')} type="number" value={p.age ?? ''} onChange={(e) => set('age', numOr(e.target.value))} placeholder="Years" />
            </Field>
            <Field label="Height" hint="e.g. 5'9&quot;">
              <TextInput {...fieldProps('height')} value={p.height} onChange={(e) => set('height', e.target.value)} placeholder={`5'9"`} />
            </Field>
            <Field label="Marital Status">
              <Select {...fieldProps('maritalStatus')} value={p.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value as Profile['maritalStatus'])}>
                <option value="">Select</option>
                {MARITAL.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Disability Status">
              <Select {...fieldProps('disabilityStatus')} value={p.disabilityStatus} onChange={(e) => set('disabilityStatus', e.target.value as Profile['disabilityStatus'])}>
                <option value="">Select</option>
                {DISABILITY.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Qualification">
              <TextInput {...fieldProps('education')} value={p.education} onChange={(e) => set('education', e.target.value)} placeholder="Qualification" />
            </Field>
            <Field label="College / University">
              <TextInput {...fieldProps('collegeUniversity')} value={p.collegeUniversity} onChange={(e) => set('collegeUniversity', e.target.value)} placeholder="College / University" />
            </Field>
            <Field label="Profession Type">
              <Select {...fieldProps('professionType')} value={p.professionType} onChange={(e) => set('professionType', e.target.value)}>
                <option value="">Select</option>
                {PROF_TYPE_OPTIONS.map((pt) => <option key={pt}>{pt}</option>)}
              </Select>
            </Field>
            <Field label="Job / Business Details">
              <TextInput {...fieldProps('profession')} value={p.profession} onChange={(e) => set('profession', e.target.value)} placeholder="Government Teacher, Software Engineer, Shop Owner…" />
            </Field>
            <Field label="Monthly Income">
              <TextInput {...fieldProps('monthlyIncome')} value={p.monthlyIncome} onChange={(e) => set('monthlyIncome', e.target.value)} placeholder="Monthly income" />
            </Field>
            <Field label="WhatsApp Number">
              <TextInput {...fieldProps('whatsappNumber')} value={p.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="e.g. 03001234567" />
            </Field>
            <Field label="Contact Person Name">
              <TextInput {...fieldProps('contactPersonName')} value={p.contactPersonName} onChange={(e) => set('contactPersonName', e.target.value)} placeholder="Father, Mother, Brother…" />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<BookOpen size={18} />}>Religion Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Maslak">
              <TextInput {...fieldProps('sectMaslak')} value={p.sectMaslak} onChange={(e) => set('sectMaslak', e.target.value)} placeholder="Maslak" />
            </Field>
            <Field label="Caste">
              <TextInput {...fieldProps('caste')} value={p.caste} onChange={(e) => set('caste', e.target.value)} placeholder="Caste" />
            </Field>
            <Field label="Sub Caste">
              <TextInput {...fieldProps('subCaste')} value={p.subCaste} onChange={(e) => set('subCaste', e.target.value)} placeholder="Sub Caste" />
            </Field>
            <Field label="Local / Migrated">
              <TextInput {...fieldProps('localMuhajir')} value={p.localMuhajir} onChange={(e) => set('localMuhajir', e.target.value)} placeholder="Local / Migrated" />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<Home size={18} />}>Residence Details</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Residence Type">
              <Select {...fieldProps('residenceType')} value={p.residenceType} onChange={(e) => set('residenceType', e.target.value as Profile['residenceType'])}>
                <option value="">Select</option>
                {RESIDENCE.map((r) => <option key={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="House Size" hint="5 Marla, 10 Marla, 1 Kanal…">
              <TextInput {...fieldProps('houseSize')} value={p.houseSize} onChange={(e) => set('houseSize', e.target.value)} placeholder="5 Marla" />
            </Field>
            <Field label="City">
              <TextInput {...fieldProps('city')} value={p.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
            </Field>
            <Field label="Village">
              <TextInput {...fieldProps('village')} value={p.village} onChange={(e) => set('village', e.target.value)} placeholder="Village" />
            </Field>
            <Field label="Nationality">
              <TextInput value={p.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Nationality" />
            </Field>
            <div className="col-span-2 md:col-span-3">
              <Field label="Address">
                <Textarea {...fieldProps('address')} value={p.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Property Details">
                <Textarea {...fieldProps('propertyDetails')} value={p.propertyDetails} onChange={(e) => set('propertyDetails', e.target.value)} placeholder="Property details" />
              </Field>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<Users size={18} />}>Family Information</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Father Occupation">
              <TextInput {...fieldProps('fatherOccupation')} value={p.fatherOccupation} onChange={(e) => set('fatherOccupation', e.target.value)} />
            </Field>
            <Field label="Mother Occupation">
              <TextInput {...fieldProps('motherOccupation')} value={p.motherOccupation} onChange={(e) => set('motherOccupation', e.target.value)} />
            </Field>
            <Field label="Brothers">
              <TextInput {...fieldProps('brothers')} type="number" value={p.brothers ?? ''} onChange={(e) => set('brothers', numOr(e.target.value))} />
            </Field>
            <Field label="Married Brothers">
              <TextInput {...fieldProps('marriedBrothers')} type="number" value={p.marriedBrothers ?? ''} onChange={(e) => set('marriedBrothers', numOr(e.target.value))} />
            </Field>
            <Field label="Sisters">
              <TextInput {...fieldProps('sisters')} type="number" value={p.sisters ?? ''} onChange={(e) => set('sisters', numOr(e.target.value))} />
            </Field>
            <Field label="Married Sisters">
              <TextInput {...fieldProps('marriedSisters')} type="number" value={p.marriedSisters ?? ''} onChange={(e) => set('marriedSisters', numOr(e.target.value))} />
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<Heart size={18} />}>Partner Requirements</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Preferred Age From">
              <TextInput {...fieldProps('prefAgeFrom')} type="number" value={p.prefAgeFrom ?? ''} onChange={(e) => set('prefAgeFrom', numOr(e.target.value))} />
            </Field>
            <Field label="Preferred Age To">
              <TextInput {...fieldProps('prefAgeTo')} type="number" value={p.prefAgeTo ?? ''} onChange={(e) => set('prefAgeTo', numOr(e.target.value))} />
            </Field>
            <Field label="Preferred Height From">
              <TextInput {...fieldProps('prefHeightFrom')} value={p.prefHeightFrom} onChange={(e) => set('prefHeightFrom', e.target.value)} placeholder={`5'4"`} />
            </Field>
            <Field label="Preferred Height To">
              <TextInput {...fieldProps('prefHeightTo')} value={p.prefHeightTo} onChange={(e) => set('prefHeightTo', e.target.value)} placeholder={`5'10"`} />
            </Field>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred City (multi-select)">
                <MultiSelect options={CITY_OPTIONS} values={p.prefCity} onChange={(v) => set('prefCity', v)} attachProps={fieldProps('prefCity')} />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Caste (multi-select)">
                <MultiSelect options={CASTE_OPTIONS} values={p.prefCaste} onChange={(v) => set('prefCaste', v)} attachProps={fieldProps('prefCaste')} />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Maslak (multi-select)">
                <MultiSelect options={MASLAK_OPTIONS} values={p.prefMaslak} onChange={(v) => set('prefMaslak', v)} attachProps={fieldProps('prefMaslak')} />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Nationality / Country (multi-select)">
                <MultiSelect options={NATIONALITY_OPTIONS} values={p.prefNationality} onChange={(v) => set('prefNationality', v)} attachProps={fieldProps('prefNationality')} />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Marital Status (multi-select)">
                <MultiSelect options={PREF_MARITAL_OPTIONS} values={p.prefMaritalStatus} onChange={(v) => set('prefMaritalStatus', v)} attachProps={fieldProps('prefMaritalStatus')} />
              </Field>
            </div>
            <Field label="Preferred Disability Status">
              <Select {...fieldProps('prefDisabilityStatus')} value={p.prefDisabilityStatus} onChange={(e) => set('prefDisabilityStatus', e.target.value as Profile['prefDisabilityStatus'])}>
                <option value="">Select</option>
                {PREF_DISABILITY.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Education (multi-select)">
                <MultiSelect options={EDU_OPTIONS} values={p.prefEducation} onChange={(v) => set('prefEducation', v)} attachProps={fieldProps('prefEducation')} />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Field label="Preferred Profession (multi-select)">
                <MultiSelect options={PROF_OPTIONS} values={p.prefProfession} onChange={(v) => set('prefProfession', v)} attachProps={fieldProps('prefProfession')} />
              </Field>
            </div>
          </div>
        </section>

        {settings.adminMode && (
          <section className="bg-white rounded-2xl p-5 shadow-soft border-l-4 border-gold-400">
            <SectionTitle icon={<Briefcase size={18} />}>Admin: Profile Entered By</SectionTitle>
            <Field label="Entered By (staff)">
              <TextInput {...fieldProps('enteredBy')} value={p.enteredBy} onChange={(e) => set('enteredBy', e.target.value)} placeholder="Staff name" />
            </Field>
            <p className="mt-2 text-xs text-gray-400">This field is hidden from the public profile view.</p>
          </section>
        )}
      </div>
    </div>
  );
}
