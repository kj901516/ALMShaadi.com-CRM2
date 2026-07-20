import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { downloadBlob } from '../lib/utils';

interface Props {
  src: string;
  onClose: () => void;
}

export default function ImageViewer({ src, onClose }: Props) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z + 0.25));
      if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(0.5, z - 0.25));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const downloadImage = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      downloadBlob(blob, `profile-photo-${Date.now()}.png`);
    } catch {
      // fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <button
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(4, z + 0.25));
          }}
        >
          <ZoomIn size={22} />
        </button>
        <span className="px-4 py-3 rounded-full bg-white/10 text-white text-sm font-medium">{Math.round(zoom * 100)}%</span>
        <button
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(0.5, z - 0.25));
          }}
        >
          <ZoomOut size={22} />
        </button>
        <button
          className="p-3 rounded-full bg-gold-600 hover:bg-gold-700 text-white transition"
          onClick={(e) => {
            e.stopPropagation();
            downloadImage();
          }}
          aria-label="Download image"
        >
          <Download size={22} />
        </button>
      </div>
      <img
        src={src}
        alt="Full view"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
        className="max-w-[92vw] max-h-[88vh] object-contain"
      />
    </div>
  );
}
