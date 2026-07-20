import type { Profile } from '../lib/types';
import { Eye, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import ImageViewer from './ImageViewer';

interface Props {
  profile: Profile;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProfileCard({ profile: p, onView, onEdit, onDelete }: Props) {
  const [viewer, setViewer] = useState(false);
  const photo = p.photos?.[0]?.dataUrl;

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-card transition overflow-hidden flex flex-col group">
      <div
        className="relative w-full bg-cream-100 cursor-zoom-in"
        style={{ height: '180px' }}
        onClick={(e) => {
          e.stopPropagation();
          if (photo) setViewer(true);
        }}
      >
        {photo ? (
          <img src={photo} alt={p.fullName} className="portrait-photo" />
        ) : (
          <div className="flex items-center justify-center h-full text-maroon-200">
            <ImageIcon size={40} />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-maroon-700/90 text-white text-[10px] font-bold backdrop-blur">
          {p.id}
        </span>
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur ${
            p.gender === 'Male' ? 'bg-blue-600/90 text-white' : p.gender === 'Female' ? 'bg-pink-600/90 text-white' : 'bg-gray-500/90 text-white'
          }`}
        >
          {p.gender || '—'}
        </span>
      </div>

      <div className="p-3.5 flex-1 flex flex-col">
        <h3 className="font-bold text-maroon-900 text-sm truncate">{p.fullName || '—'}</h3>
        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
          <p>{[p.age != null ? `${p.age} yrs` : '', p.city].filter(Boolean).join(' • ') || '-'}</p>
          <p className="truncate">{p.caste || '-'}</p>
          <p className="truncate text-gray-500">{p.education || '-'}</p>
        </div>
      </div>

      <div className="flex border-t border-cream-200">
        <button
          onClick={onView}
          className="flex-1 py-2.5 text-xs font-semibold text-maroon-700 hover:bg-maroon-50 transition flex items-center justify-center gap-1"
        >
          <Eye size={14} /> View
        </button>
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-xs font-semibold text-gold-700 hover:bg-gold-50 transition flex items-center justify-center gap-1 border-l border-cream-200"
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-1 border-l border-cream-200"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {viewer && photo && <ImageViewer src={photo} onClose={() => setViewer(false)} />}
    </div>
  );
}
