import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../lib/store';
import ProfileCard from '../components/ProfileCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { UserPlus, Copy, Trash2, Search } from 'lucide-react';
import type { Page } from '../App';
import { EMPTY_PROFILE, type Profile } from '../lib/types';
import { allocateProfileId } from '../lib/db';

interface Props {
  go: (page: Page, params?: Record<string, unknown>) => void;
  initialDeleteId?: string;
}

export default function Profiles({ go, initialDeleteId }: Props) {
  const { profiles, removeProfile, addProfile, toast } = useApp();
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(initialDeleteId ?? null);

  useEffect(() => {
    if (initialDeleteId) setDeleteId(initialDeleteId);
  }, [initialDeleteId]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return profiles.filter((p) => {
      if (gender && p.gender !== gender) return false;
      if (!t) return true;
      return (
        p.fullName.toLowerCase().includes(t) ||
        p.id.toLowerCase().includes(t) ||
        p.city.toLowerCase().includes(t) ||
        p.caste.toLowerCase().includes(t) ||
        p.profession.toLowerCase().includes(t) ||
        p.education.toLowerCase().includes(t)
      );
    });
  }, [profiles, q, gender]);

  const duplicate = async (id: string) => {
    const src = profiles.find((p) => p.id === id);
    if (!src) return;
    const newId = await allocateProfileId();
    const copy: Profile = {
      ...EMPTY_PROFILE(),
      ...src,
      id: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: src.photos.map((ph) => ({ ...ph, id: ph.id + '-d' })),
      fullName: src.fullName + ' (Copy)',
    };
    await addProfile(copy);
    toast('Profile duplicated');
    go('edit', { id: newId });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await removeProfile(deleteId);
    setDeleteId(null);
    toast('Profile deleted', 'info');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-maroon-800">All Profiles</h1>
        <button
          onClick={() => go('add')}
          className="px-4 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-sm font-semibold transition flex items-center gap-1.5"
        >
          <UserPlus size={16} /> Add Profile
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-soft flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ID, city, caste…"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <span className="text-sm text-gray-500 font-medium">{filtered.length} profiles</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-soft">
          <p className="text-gray-400">No profiles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5">
              <ProfileCard
                profile={p}
                onView={() => go('view', { id: p.id })}
                onEdit={() => go('edit', { id: p.id })}
                onDelete={() => setDeleteId(p.id)}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => duplicate(p.id)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 transition flex items-center justify-center gap-1"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Profile?"
        message="This will permanently remove the profile and its photos. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
