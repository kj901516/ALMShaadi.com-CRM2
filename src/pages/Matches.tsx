import { useMemo, useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/store';
import { findMatches, type MatchResult } from '../lib/matching';
import { Heart, Sparkles, ChevronRight, Search } from 'lucide-react';
import type { Page } from '../App';

interface Props {
  go: (page: Page, params?: Record<string, unknown>) => void;
}

export default function Matches({ go }: Props) {
  const { profiles } = useApp();
  const [sourceId, setSourceId] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const source = profiles.find((p) => p.id === sourceId) || null;
  const matches = useMemo<MatchResult[]>(() => {
    if (!source) return [];
    return findMatches(source, profiles);
  }, [source, profiles]);

  // Filtered dropdown options (searchable by ID or name)
  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return profiles.slice(0, 100);
    return profiles
      .filter((p) => p.id.toLowerCase().includes(t) || p.fullName.toLowerCase().includes(t))
      .slice(0, 100);
  }, [profiles, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-maroon-800 flex items-center gap-2">
          <Heart size={22} className="text-maroon-600" /> Auto Matching
        </h1>
        <p className="text-sm text-gray-500 mt-1">Select a profile to find compatible matches based on age, height, city, caste, education, profession, and disability preferences.</p>
      </div>

      {/* Searchable dropdown */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <label className="text-xs font-semibold text-maroon-800 uppercase tracking-wide">Search by Profile ID or Name</label>
        <div className="relative mt-1.5" ref={dropdownRef}>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={source ? `${source.id} — ${source.fullName}` : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSourceId('');
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Type MB0001 or a name…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white rounded-lg border border-cream-300 shadow-card">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-400 text-center">No profiles found.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSourceId(p.id);
                      setSearch('');
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-cream-50 transition flex items-center gap-3 border-b border-cream-100 last:border-0"
                  >
                    <div className="w-9 h-12 rounded overflow-hidden bg-cream-100 flex-shrink-0">
                      {p.photos?.[0]?.dataUrl ? <img src={p.photos[0].dataUrl} alt="" className="portrait-photo" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-maroon-900 truncate">{p.fullName}</p>
                      <p className="text-xs text-gray-500">{p.id} • {p.gender || '?'} • {p.age ?? '?'} yrs • {p.city || '-'}</p>
                    </div>
                  </button>
                ))
              )}
              {profiles.length > 100 && !search && (
                <p className="px-3 py-2 text-xs text-gray-400 text-center bg-cream-50">Showing first 100. Type to narrow down.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {source && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-gold-500" />
            <h2 className="font-bold text-maroon-800">Matches for {source.fullName} ({source.id})</h2>
            <span className="text-sm text-gray-500">— {matches.length} found</span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-soft">
              <p className="text-gray-400">No matches found. Add partner requirements to this profile for better matching.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <button
                  key={m.profile.id}
                  onClick={() => go('view', { id: m.profile.id })}
                  className="w-full text-left bg-white rounded-2xl p-3.5 shadow-soft hover:shadow-card transition flex items-center gap-4"
                >
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0">
                    {m.profile.photos?.[0]?.dataUrl ? (
                      <img src={m.profile.photos[0].dataUrl} alt="" className="portrait-photo" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-maroon-200 text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-maroon-900 truncate">{m.profile.fullName}</h3>
                      <span className="text-xs text-gray-400">{m.profile.id}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {[m.profile.age != null ? `${m.profile.age} yrs` : '', m.profile.height, m.profile.city, m.profile.caste, m.profile.education]
                        .filter(Boolean).join(' • ')}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.reasons.map((r, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <MatchRing score={m.score} />
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchRing({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d4a521' : '#dc2626';
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f7e6e8" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}
