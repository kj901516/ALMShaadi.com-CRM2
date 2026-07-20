import type { Profile } from './types';

/** Parse a height string like "5'9\"" or "5ft 9in" into total inches. */
export function heightToInches(h: string): number | null {
  if (!h) return null;
  const s = String(h).toLowerCase().trim();
  let feet = 0;
  let inches = 0;
  const ftMatch = s.match(/(\d+)\s*(?:'|ft|feet)/);
  const inMatch = s.match(/(\d+)\s*(?:"|in|inch|inches)/);
  if (ftMatch) feet = parseInt(ftMatch[1], 10);
  if (inMatch) inches = parseInt(inMatch[1], 10);
  if (!ftMatch && !inMatch) {
    const n = parseFloat(s);
    if (!isNaN(n)) {
      // assume cm if > 100, else feet
      if (n > 100) return Math.round(n / 2.54);
      return Math.round(n * 12);
    }
  }
  const total = feet * 12 + inches;
  return total > 0 ? total : null;
}

export function inchesToHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

export function formatHeight(h: string): string {
  return h || '-';
}

/** Normalize phone to wa.me format (digits only, strip leading 0, default +92). */
export function normalizePhone(raw: string, defaultCountryCode = '92'): string {
  if (!raw) return '';
  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith(defaultCountryCode) && digits.length === 10) {
    digits = defaultCountryCode + digits;
  }
  return digits;
}

export function waLink(raw: string, defaultCountryCode = '92'): string {
  const n = normalizePhone(raw, defaultCountryCode);
  return n ? `https://wa.me/${n}` : '';
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

/** Downscale an image data URL to keep storage small while preserving aspect ratio. */
export async function compressImage(dataUrl: string, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function profileSummaryLine(p: Profile): string {
  const parts = [p.age ? `${p.age} yrs` : '', p.height, p.city, p.education, p.profession].filter(Boolean);
  return parts.join(' • ');
}

export function familySummary(p: Profile): string {
  const b = p.brothers ?? null;
  const s = p.sisters ?? null;
  const mb = p.marriedBrothers ?? null;
  const ms = p.marriedSisters ?? null;
  const bits: string[] = [];
  if (b !== null) bits.push(`Brothers: ${b}${mb !== null ? ` (${mb} married)` : ''}`);
  if (s !== null) bits.push(`Sisters: ${s}${ms !== null ? ` (${ms} married)` : ''}`);
  return bits.join(' • ') || '-';
}

/** Share text via the Web Share API (opens WhatsApp/contact picker on supported devices). */
export async function shareText(text: string, title = 'ALMShaadi.com Profile'): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Share an image file via the Web Share API. */
export async function shareImage(blob: Blob, filename: string, text?: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Convert a data URL string to a Blob, preserving the original image bytes.
 *  Backwards-compatible: if given an http(s) URL, fetch it and return its Blob. */
export async function dataURLToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl) throw new Error('Empty image URL');
  if (dataUrl.startsWith('data:')) {
    const [meta, base64] = dataUrl.split(',');
    const mime = /:(.*?);/.exec(meta)?.[1] || 'image/png';
    const bin = atob(base64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  // Otherwise assume it's a remote URL — fetch it and return the blob.
  // Note: fetch may fail if the remote host blocks cross-origin requests.
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return await res.blob();
}
