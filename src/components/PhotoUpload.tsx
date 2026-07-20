import { useRef } from 'react';
import { Upload, X, ImagePlus } from 'lucide-react';
import type { ProfilePhoto } from '../lib/types';
import { compressImage, readFileAsDataURL, uid } from '../lib/utils';

interface Props {
  photos: ProfilePhoto[];
  onChange: (photos: ProfilePhoto[]) => void;
  max?: number;
}

export default function PhotoUpload({ photos, onChange, max = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = max - photos.length;
    const toAdd = Array.from(files).slice(0, Math.max(0, remaining));
    const newPhotos: ProfilePhoto[] = [];
    for (const f of toAdd) {
      if (!f.type.startsWith('image/')) continue;
      const raw = await readFileAsDataURL(f);
      const compressed = await compressImage(raw, 1200, 0.85);
      newPhotos.push({ id: uid(), dataUrl: compressed, name: f.name, addedAt: Date.now() });
    }
    onChange([...photos, ...newPhotos]);
  };

  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));

  const setPrimary = (id: string) => {
    const p = photos.find((x) => x.id === id);
    if (!p) return;
    onChange([p, ...photos.filter((x) => x.id !== id)]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="relative group w-28 h-36 rounded-lg border-2 border-cream-300 bg-cream-100 overflow-hidden shadow-soft"
          >
            <img src={p.dataUrl} alt={p.name} className="portrait-photo" />
            {i === 0 && (
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gold-500 text-white text-[10px] font-bold">
                MAIN
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => setPrimary(p.id)}
                  className="p-1.5 rounded-full bg-white/90 text-maroon-700 hover:bg-white"
                  title="Set as main"
                >
                  <ImagePlus size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="p-1.5 rounded-full bg-white/90 text-red-600 hover:bg-white"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-28 h-36 rounded-lg border-2 border-dashed border-cream-400 hover:border-gold-400 hover:bg-cream-50 flex flex-col items-center justify-center gap-1.5 text-maroon-400 hover:text-gold-600 transition"
          >
            <Upload size={22} />
            <span className="text-xs font-semibold">Add Photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <p className="mt-2 text-xs text-gray-400">
        Portrait photos. Original aspect ratio preserved (object-fit: contain). Up to {max} photos.
      </p>
    </div>
  );
}
