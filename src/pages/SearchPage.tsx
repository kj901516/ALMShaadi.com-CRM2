import { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import ProfileCard from '../components/ProfileCard';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import type { Page } from '../App';
import { heightToInches } from '../lib/utils';

interface Props {
  go: (page: Page, params?: Record<string, unknown>) => void;
}

const empty = {
  q: '',
  gender: '',
  ageFrom: '',
  ageTo: '',
  hFrom: '',
  hTo: '',
  city: '',
  village: '',
  caste: '',
  education: '',
  profession: '',
  marital: '',
  maslak: '',
  nationality: '',
  prefMarital: '',
};

export default function SearchPage({ go }: Props) {
  const { profiles } = useApp();
  const [f, setF] = useState({ ...empty });
  const [showFilters, setShowFilters] = useState(false);

  const cities = useMemo(() => [...new Set(profiles.map((p) => p.city).filter(Boolean))].sort(), [profiles]);
  const castes = useMemo(() => [...new Set(profiles.map((p) => p.caste).filter(Boolean))].sort(), [profiles]);
  const educations = useMemo(() => [...new Set(profiles.map((p) => p.education).filter(Boolean))].sort(), [profiles]);
  const professions = useMemo(() => [...new Set(profiles.map((p) => p.profession).filter(Boolean))].sort(), [profiles]);
  const maslaks = useMemo(() => [...new Set(profiles.map((p) => p.sectMaslak).filter(Boolean))].sort(), [profiles]);
  const nationalities = useMemo(() => [...new Set(profiles.map((p) => p.nationality).filter(Boolean))].sort(), [profiles]);

  const results = useMemo(() => {
    return profiles.filter((p) => {
      if (f.q) {
        const t = f.q.toLowerCase();
        if (![p.fullName, p.id, p.city, p.village, p.caste, p.profession, p.education].some((v) => v.toLowerCase().includes(t))) return false;
      }
      if (f.gender && p.gender !== f.gender) return false;
      if (f.marital && p.maritalStatus !== f.marital) return false;
      if (f.ageFrom && (p.age == null || p.age < +f.ageFrom)) return false;
      if (f.ageTo && (p.age == null || p.age > +f.ageTo)) return false;
      const h = heightToInches(p.height);
      if (f.hFrom) {
        const lo = heightToInches(f.hFrom);
        if (lo != null && (h == null || h < lo)) return false;
      }
      if (f.hTo) {
        const hi = heightToInches(f.hTo);
        if (hi != null && (h == null || h > hi)) return false;
      }
      if (f.city && p.city !== f.city) return false;
      if (f.village && p.village !== f.village) return false;
      if (f.caste && p.caste !== f.caste) return false;
      if (f.education && p.education !== f.education) return false;
      if (f.profession && p.profession !== f.profession) return false;
      if (f.maslak && p.sectMaslak !== f.maslak) return false;
      if (f.nationality && p.nationality !== f.nationality) return false;
      if (f.prefMarital && !(p.prefMaritalStatus || []).includes(f.prefMarital)) return false;
      return true;
    });
  }, [profiles, f]);

  const reset = () => setF({ ...empty });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-maroon-800">Search & Filters</h1>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="md:hidden px-3 py-2 rounded-lg bg-maroon-700 text-white text-sm font-semibold flex items-center gap-1.5"
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        {/* Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block bg-white rounded-2xl p-4 shadow-soft h-fit space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide">Advanced Filters</h2>
            <button onClick={reset} className="text-xs text-gray-500 hover:text-maroon-700 flex items-center gap-1">
              <X size={12} /> Reset
            </button>
          </div>

          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
              placeholder="Keyword"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          <Labeled label="Gender">
            <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className={cls}>
              <option value="">Any</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Labeled>

          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Age From">
              <input type="number" value={f.ageFrom} onChange={(e) => setF({ ...f, ageFrom: e.target.value })} className={cls} />
            </Labeled>
            <Labeled label="Age To">
              <input type="number" value={f.ageTo} onChange={(e) => setF({ ...f, ageTo: e.target.value })} className={cls} />
            </Labeled>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Height From" hint={`5'4"`}>
              <input value={f.hFrom} onChange={(e) => setF({ ...f, hFrom: e.target.value })} className={cls} />
            </Labeled>
            <Labeled label="Height To" hint={`5'10"`}>
              <input value={f.hTo} onChange={(e) => setF({ ...f, hTo: e.target.value })} className={cls} />
            </Labeled>
          </div>

          <Labeled label="City">
            <select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={cls}>
              <option value="">Any</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Village">
            <input value={f.village} onChange={(e) => setF({ ...f, village: e.target.value })} className={cls} placeholder="Village name" />
          </Labeled>
          <Labeled label="Caste">
            <select value={f.caste} onChange={(e) => setF({ ...f, caste: e.target.value })} className={cls}>
              <option value="">Any</option>
              {castes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Education">
            <select value={f.education} onChange={(e) => setF({ ...f, education: e.target.value })} className={cls}>
              <option value="">Any</option>
              {educations.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Profession">
            <select value={f.profession} onChange={(e) => setF({ ...f, profession: e.target.value })} className={cls}>
              <option value="">Any</option>
              {professions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Marital Status">
            <select value={f.marital} onChange={(e) => setF({ ...f, marital: e.target.value })} className={cls}>
              <option value="">Any</option>
              <option>Never Married</option>
              <option>Divorced</option>
              <option>Widowed</option>
              <option>Awaiting Divorce</option>
              <option>Annulled</option>
            </select>
          </Labeled>
          <Labeled label="Maslak">
            <select value={f.maslak} onChange={(e) => setF({ ...f, maslak: e.target.value })} className={cls}>
              <option value="">Any</option>
              {maslaks.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Nationality / Country">
            <select value={f.nationality} onChange={(e) => setF({ ...f, nationality: e.target.value })} className={cls}>
              <option value="">Any</option>
              {nationalities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Preferred Marital Status">
            <select value={f.prefMarital} onChange={(e) => setF({ ...f, prefMarital: e.target.value })} className={cls}>
              <option value="">Any</option>
              <option>Never Married</option>
              <option>Divorced</option>
              <option>Widowed</option>
              <option>Awaiting Divorce</option>
              <option>Annulled</option>
            </select>
          </Labeled>
        </aside>

        {/* Results */}
        <div>
          <p className="text-sm text-gray-500 mb-3 font-medium">{results.length} matching profile(s)</p>
          {results.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-soft">
              <p className="text-gray-400">No profiles match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  onView={() => go('view', { id: p.id })}
                  onEdit={() => go('edit', { id: p.id })}
                  onDelete={() => go('profiles', { deleteId: p.id })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cls = 'w-full px-3 py-2 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400';

function Labeled({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-maroon-800">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-gray-400">e.g. {hint}</span>}
    </label>
  );
}
