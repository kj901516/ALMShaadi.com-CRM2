import { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import ProfileCard from '../components/ProfileCard';
import { Users, UserPlus, Search as SearchIcon, User, UserRound, ArrowRight, Sparkles } from 'lucide-react';
import type { Page } from '../App';

interface Props {
  go: (page: Page, params?: Record<string, unknown>) => void;
}

export default function Dashboard({ go }: Props) {
  const { profiles, settings } = useApp();
  const [q, setQ] = useState('');

  const stats = useMemo(() => {
    const boys = profiles.filter((p) => p.gender === 'Male').length;
    const girls = profiles.filter((p) => p.gender === 'Female').length;
    return { total: profiles.length, boys, girls };
  }, [profiles]);

  const recent = useMemo(() => profiles.slice(0, 20), [profiles]);

  const quickResults = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    return profiles
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(t) ||
          p.id.toLowerCase().includes(t) ||
          p.city.toLowerCase().includes(t) ||
          p.caste.toLowerCase().includes(t) ||
          p.profession.toLowerCase().includes(t),
      )
      .slice(0, 12);
  }, [q, profiles]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900 p-6 md:p-8 shadow-card">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #e3bd3e 0, transparent 40%)' }} />
        <div className="relative flex items-start gap-4">
          {settings.bureauLogo && (
            <img src={settings.bureauLogo} alt="Logo" className="w-16 h-16 rounded-2xl object-contain bg-white/10 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-gold-300 text-xs font-semibold uppercase tracking-widest">Assalam-o-Alaikum</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white font-serif">{settings.bureauName}</h1>
            <p className="mt-1 text-sm text-cream-200/80">Marriage Bureau CRM — manage profiles, find matches, share biodata</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => go('add')} className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-maroon-900 text-sm font-bold transition flex items-center gap-1.5">
                <UserPlus size={16} /> Quick Add Profile
              </button>
              <button onClick={() => go('search')} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition flex items-center gap-1.5 backdrop-blur">
                <SearchIcon size={16} /> Advanced Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Total Profiles" value={stats.total} icon={<Users size={20} />} tone="maroon" />
        <StatCard label="Total Boys" value={stats.boys} icon={<User size={20} />} tone="blue" />
        <StatCard label="Total Girls" value={stats.girls} icon={<UserRound size={20} />} tone="pink" />
      </div>

      {/* Quick search */}
      <div className="bg-white rounded-2xl p-4 shadow-soft">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Quick search by name, ID, city, caste, profession…"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        {q.trim() && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{quickResults.length} result(s)</p>
            {quickResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No profiles found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {quickResults.map((p) => (
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
        )}
      </div>

      {/* Recent profiles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-maroon-800 flex items-center gap-2">
            <Sparkles size={18} className="text-gold-500" /> Recent Profiles
          </h2>
          <button onClick={() => go('profiles')} className="text-sm font-semibold text-maroon-600 hover:text-maroon-800 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-soft">
            <p className="text-gray-400">No profiles yet. Add your first profile to get started.</p>
            <button
              onClick={() => go('add')}
              className="mt-4 px-4 py-2 rounded-xl bg-maroon-700 text-white text-sm font-semibold hover:bg-maroon-800 transition inline-flex items-center gap-1.5"
            >
              <UserPlus size={16} /> Add Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {recent.map((p) => (
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
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'maroon' | 'blue' | 'pink' }) {
  const tones = {
    maroon: 'from-maroon-700 to-maroon-800',
    blue: 'from-blue-600 to-blue-700',
    pink: 'from-pink-600 to-pink-700',
  };
  return (
    <div className={`rounded-2xl p-4 md:p-5 bg-gradient-to-br ${tones[tone]} text-white shadow-soft`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">{label}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">{icon}</div>
      </div>
    </div>
  );
}
