import { useState } from 'react';
import type { Profile, Settings } from '../lib/types';
import { generateShareText, generateShareImage, generateSharePDF } from '../lib/shareCard';
import { downloadBlob, shareText, shareImage, dataURLToBlob } from '../lib/utils';
import { X, Copy, Image as ImageIcon, FileText, Loader2, Printer, User, Camera } from 'lucide-react';
import { useApp } from '../lib/store';

interface Props {
  profile: Profile;
  settings: Settings;
  onClose: () => void;
}

export default function ShareModal({ profile, settings, onClose }: Props) {
  const { toast } = useApp();
  const [busy, setBusy] = useState<'text' | 'photo' | 'img' | 'pdf' | null>(null);
  const text = generateShareText(profile, settings);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Profile text copied to clipboard');
    } catch {
      toast('Copy failed', 'error');
    }
  };

  // Button 1: Share Profile Only — complete profile text via WhatsApp
  const shareProfileOnly = async () => {
    setBusy('text');
    try {
      const ok = await shareText(text, `${profile.fullName} — ${settings.bureauName}`);
      if (!ok) {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
      toast('Opening WhatsApp with profile summary');
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      toast('Opening WhatsApp with profile summary');
    } finally {
      setBusy(null);
    }
  };

  // Button 2: Share Profile + Photo — original uploaded photo + text, one click
  const shareProfileWithPhoto = async () => {
    setBusy('photo');
    try {
      const photo = profile.photos?.[0];
      if (!photo) {
        // No photo — fall back to text-only WhatsApp share
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        toast('No photo on profile — sharing text only');
        return;
      }

      // Use the ORIGINAL uploaded photo bytes — no card, no crop, no poster
      const blob = await dataURLToBlob(photo.dataUrl);
      const ext = (photo.name.split('.').pop() || 'png').toLowerCase();
      const filename = `${profile.id || profile.fullName || 'profile'}.${ext}`;

      // Try native share with the original photo file + profile text together
      const ok = await shareImage(blob, filename, text);
      if (ok) {
        toast('Profile photo + summary shared');
        return;
      }

      // Fallback: download original photo, copy text, open WhatsApp with text
      try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
      downloadBlob(blob, filename);
      toast('Photo downloaded & summary copied. Opening WhatsApp…');
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch {
      // Last resort: text only
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      toast('Sharing profile summary via WhatsApp');
    } finally {
      setBusy(null);
    }
  };

  const dlImage = async () => {
    setBusy('img');
    try {
      const blob = await generateShareImage(profile, settings);
      downloadBlob(blob, `${profile.id || profile.fullName}-card.png`);
      toast('Profile card downloaded');
    } catch {
      toast('Image generation failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const dlPdf = async () => {
    setBusy('pdf');
    try {
      const blob = await generateSharePDF(profile, settings);
      downloadBlob(blob, `${profile.id || profile.fullName}-card.pdf`);
      toast('Profile PDF downloaded');
    } catch {
      toast('PDF generation failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  const hasPhoto = !!(profile.photos && profile.photos.length > 0);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-card max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200" style={{ backgroundColor: 'var(--theme-primary)' }}>
          <h3 className="text-white font-bold">Share Profile</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {/* Two main share buttons */}
          <div className="space-y-3">
            {/* Button 1: Share Profile Only */}
            <button
              onClick={shareProfileOnly}
              disabled={!!busy}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white transition disabled:opacity-60"
            >
              {busy === 'text' ? <Loader2 size={24} className="animate-spin" /> : <User size={24} />}
              <div className="text-left flex-1">
                <p className="text-sm font-bold">Share Profile Only</p>
                <p className="text-xs text-white/70">Complete profile summary text via WhatsApp</p>
              </div>
            </button>

            {/* Button 2: Share Profile + Photo */}
            <button
              onClick={shareProfileWithPhoto}
              disabled={!!busy}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-60"
            >
              {busy === 'photo' ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
              <div className="text-left flex-1">
                <p className="text-sm font-bold">Share Profile + Photo</p>
                <p className="text-xs text-white/70">
                  {hasPhoto ? 'Original photo + full profile text, one click' : 'No photo on profile — will share text only'}
                </p>
              </div>
            </button>
          </div>

          {/* Preview of text */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Profile Summary Preview</p>
            <div className="bg-cream-50 border border-cream-200 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-gray-800 font-mono leading-relaxed">{text}</div>
          </div>

          {/* Secondary actions */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <button onClick={copy} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-maroon-800 transition">
              <Copy size={20} /><span className="text-xs font-semibold">Copy Text</span>
            </button>
            <button onClick={dlImage} disabled={!!busy} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-maroon-800 transition disabled:opacity-60">
              {busy === 'img' ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
              <span className="text-xs font-semibold">Card</span>
            </button>
            <button onClick={dlPdf} disabled={!!busy} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-maroon-800 transition disabled:opacity-60">
              {busy === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
              <span className="text-xs font-semibold">PDF</span>
            </button>
            <button onClick={() => window.print()} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 hover:bg-cream-200 text-maroon-800 transition">
              <Printer size={20} /><span className="text-xs font-semibold">Print</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400 text-center">
            "Share Profile Only" sends the complete profile text. "Share Profile + Photo" sends the original uploaded photo together with the profile text in one step.
          </p>
        </div>
      </div>
    </div>
  );
}
