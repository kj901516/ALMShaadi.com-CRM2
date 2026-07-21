import type { Profile, Settings } from './types';
import { jsPDF } from 'jspdf';

const MAROON = '#7a1f2b';
const GOLD = '#b8841a';
const CREAM = '#fffdf8';
const DARK = '#2c0a10';
const LIGHT = '#f7e6e8';

function arrStr(arr: string[]) {
  if (!arr || arr.length === 0) return '';
  return arr.join(', ');
}

export function generateShareText(p: Profile, settings: Settings): string {
  const L: string[] = [];
  const line = (label: string, val: unknown) => {
    const v = val === null || val === undefined || val === '' ? '' : String(val);
    if (v) L.push(`*${label}:* ${v}`);
  };
  const section = (title: string) => {
    L.push('');
    L.push(`*${title}*`);
    L.push('━━━━━━━━━━━━━━━');
  };

  L.push(`*${settings.bureauName || 'ALMShaadi.com'}*`);
  L.push('━━━━━━━━━━━━━━━');

  section('PERSONAL INFORMATION');
  line('Profile ID', p.id);
  line('Name', p.fullName);
  line('Father / Mother Name', p.fatherMotherName);
  line('Gender', p.gender);
  line('Age', p.age != null ? `${p.age} years` : '');
  line('Height', p.height);
  line('Marital Status', p.maritalStatus);
  line('Disability Status', p.disabilityStatus || 'None');
  line('Qualification', p.education);
  line('College / University', p.collegeUniversity);
  line('Profession Type', p.professionType);
  line('Job / Business Details', p.profession);
  line('Monthly Income', p.monthlyIncome);

  section('EDUCATION DETAILS');
  line('Qualification', p.education);
  line('College / University', p.collegeUniversity);

  section('OCCUPATION DETAILS');
  line('Profession Type', p.professionType);
  line('Job / Business Details', p.profession);
  line('Monthly Income', p.monthlyIncome);

  section('RELIGION DETAILS');
  line('Maslak', p.sectMaslak);
  line('Caste', p.caste);
  line('Sub Caste', p.subCaste);
  line('Local / Migrated', p.localMuhajir);

  section('RESIDENCE DETAILS');
  line('Residence Type', p.residenceType);
  line('House Size', p.houseSize);
  line('City', p.city);
  line('Village', p.village);
  line('Nationality', p.nationality);
  line('Address', p.address);
  line('Property Details', p.propertyDetails);

  section('FAMILY DETAILS');
  line('Father Occupation', p.fatherOccupation);
  line('Mother Occupation', p.motherOccupation);
  line('Brothers', p.brothers);
  line('Married Brothers', p.marriedBrothers);
  line('Sisters', p.sisters);
  line('Married Sisters', p.marriedSisters);

  section('PARTNER REQUIREMENTS');
  if (p.prefAgeFrom != null || p.prefAgeTo != null) L.push(`*Preferred Age:* ${p.prefAgeFrom ?? '?'} - ${p.prefAgeTo ?? '?'}`);
  if (p.prefHeightFrom || p.prefHeightTo) L.push(`*Preferred Height:* ${p.prefHeightFrom || '?'} - ${p.prefHeightTo || '?'}`);
  line('Preferred City', arrStr(p.prefCity));
  line('Preferred Caste', arrStr(p.prefCaste));
  if (p.prefMaslak.length) line('Preferred Maslak', arrStr(p.prefMaslak));
  if (p.prefNationality.length) line('Preferred Nationality / Country', arrStr(p.prefNationality));
  if (p.prefMaritalStatus.length) line('Preferred Marital Status', arrStr(p.prefMaritalStatus));
  if (p.prefEducation.length) line('Preferred Education', arrStr(p.prefEducation));
  if (p.prefProfession.length) line('Preferred Profession', arrStr(p.prefProfession));
  line('Preferred Disability Status', p.prefDisabilityStatus || 'Any');

  L.push('');
  L.push('━━━━━━━━━━━━━━━');
  if (settings.myWhatsAppNumber) L.push(`*Contact:* ${settings.myWhatsAppNumber}`);
  if (settings.bureauAddress) L.push(`*Address:* ${settings.bureauAddress}`);
  L.push(`_${settings.bureauName || 'ALMShaadi.com'}_`);
  return L.join('\n');
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Request CORS-enabled fetch so remote images can be used in canvas without tainting
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface DrawOpts {
  p: Profile;
  settings: Settings;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
}

/**
 * Clean portrait-style biodata card.
 * Layout: Header (logo + bureau name) → Photo (contain, no crop) → Profile details → Footer.
 * Canvas height is computed dynamically so nothing is ever cut off.
 */
function drawCard(canvas: HTMLCanvasElement, opts: DrawOpts) {
  const W = 1080;
  const PAD = 60;
  const FONT = '"Plus Jakarta Sans", "Segoe UI", sans-serif';

  // First pass: measure all content to compute total height
  let y = 0;

  // Header height
  const headerH = 170;
  y = headerH + 30;

  // Photo area
  const photoMaxW = 560;
  const photoMaxH = 640;
  let photoW = 0;
  let photoH = 0;
  if (opts.photo) {
    const scale = Math.min(photoMaxW / opts.photo.width, photoMaxH / opts.photo.height);
    photoW = opts.photo.width * scale;
    photoH = opts.photo.height * scale;
  } else {
    photoW = 400;
    photoH = 400;
  }
  // Photo frame with padding
  const frameH = Math.max(photoH, 400) + 24;
  y += frameH + 30;

  // Profile details
  const fields: Array<[string, string]> = [
    ['Profile ID', opts.p.id],
    ['Name', opts.p.fullName],
    ['Father / Mother', opts.p.fatherMotherName],
    ['Gender', opts.p.gender],
    ['Age', opts.p.age != null ? `${opts.p.age} years` : ''],
    ['Height', opts.p.height],
    ['Marital Status', opts.p.maritalStatus],
    ['Qualification', opts.p.education],
    ['College / University', opts.p.collegeUniversity],
    ['Profession Type', opts.p.professionType],
    ['Job / Business', opts.p.profession],
    ['Monthly Income', opts.p.monthlyIncome],
    ['WhatsApp', opts.p.whatsappNumber],
    ['Contact Person', opts.p.contactPersonName],
    ['Maslak', opts.p.sectMaslak],
    ['Caste', opts.p.caste],
    ['Sub Caste', opts.p.subCaste],
    ['City', opts.p.city],
  ];

  const rowH = 56;
  const visibleFields = fields.filter(([, v]) => v);
  const detailsH = visibleFields.length * rowH + 20;
  y += detailsH;

  // Footer
  const footerH = 100;
  y += footerH + 20;

  const H = Math.max(y, 1200);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, CREAM);
  bg.addColorStop(1, '#faf0d6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ---- Header ----
  ctx.fillStyle = MAROON;
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, headerH, W, 5);

  // Logo
  if (opts.logo) {
    const logoSize = 80;
    const logoX = PAD + 10;
    const logoY = (headerH - logoSize) / 2;
    // Draw logo with contain
    const ls = Math.min(logoSize / opts.logo.width, logoSize / opts.logo.height);
    const lw = opts.logo.width * ls;
    const lh = opts.logo.height * ls;
    ctx.drawImage(opts.logo, logoX + (logoSize - lw) / 2, logoY + (logoSize - lh) / 2, lw, lh);
  }

  ctx.fillStyle = '#fff';
  ctx.font = `700 42px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(opts.settings.bureauName || 'ALMShaadi.com', W / 2, 80);
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = '#f4e6a8';
  ctx.fillText('Marriage Bureau Profile', W / 2, 125);

  // ---- Photo (object-fit: contain, never crop) ----
  let cy = headerH + 30;
  const frameX = (W - Math.max(photoW, 400) - 24) / 2;
  const frameW = Math.max(photoW, 400) + 24;

  // Photo background frame
  ctx.fillStyle = LIGHT;
  ctx.fillRect(frameX, cy, frameW, frameH);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(frameX, cy, frameW, frameH);

  if (opts.photo) {
    // Contain: fit entire image inside frame, centered
    ctx.drawImage(
      opts.photo,
      frameX + (frameW - photoW) / 2,
      cy + (frameH - photoH) / 2,
      photoW,
      photoH,
    );
  } else {
    ctx.fillStyle = '#9d2f44';
    ctx.font = `600 28px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('No Photo', W / 2, cy + frameH / 2);
  }
  cy += frameH + 30;

  // ---- Profile details ----
  // Section title
  ctx.fillStyle = GOLD;
  ctx.fillRect(PAD, cy, W - PAD * 2, 3);
  ctx.fillStyle = MAROON;
  ctx.font = `700 28px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('PROFILE DETAILS', PAD, cy + 35);
  cy += 60;

  // Two-column layout for fields
  const colW = (W - PAD * 2 - 40) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + 40;
  const labelColor = MAROON;
  const valueColor = DARK;

  let col = 0;
  let rowY = cy;
  for (const [label, value] of visibleFields) {
    const x = col === 0 ? leftX : rightX;
    // Label
    ctx.fillStyle = labelColor;
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(label + ':', x, rowY + 28);
    // Value (with wrapping)
    ctx.fillStyle = valueColor;
    ctx.font = `500 24px ${FONT}`;
    const valStr = String(value);
    const maxValW = colW - 160;
    if (ctx.measureText(valStr).width > maxValW) {
      const words = valStr.split(' ');
      let line = '';
      let lineY = rowY + 28;
      for (const w of words) {
        if (ctx.measureText(line + ' ' + w).width > maxValW && line) {
          ctx.fillText(line, x + 160, lineY);
          lineY += 32;
          line = w;
        } else {
          line = line ? line + ' ' + w : w;
        }
      }
      if (line) ctx.fillText(line, x + 160, lineY);
    } else {
      ctx.fillText(valStr, x + 160, rowY + 28);
    }
    // Underline
    ctx.strokeStyle = '#e8d5b0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, rowY + rowH - 8);
    ctx.lineTo(x + colW, rowY + rowH - 8);
    ctx.stroke();

    col = col === 0 ? 1 : 0;
    if (col === 0) rowY += rowH;
  }
  if (col === 1) rowY += rowH; // last odd row
  cy = rowY + 10;

  // ---- Footer ----
  const footerY = H - footerH;
  ctx.fillStyle = MAROON;
  ctx.fillRect(0, footerY, W, footerH);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, footerY, W, 4);
  ctx.fillStyle = '#fff';
  ctx.font = `700 28px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(opts.settings.bureauName || 'ALMShaadi.com Marriage Bureau', W / 2, footerY + 42);
  if (opts.settings.myWhatsAppNumber) {
    ctx.font = `600 24px ${FONT}`;
    ctx.fillStyle = '#f4e6a8';
    ctx.fillText(`WhatsApp: ${opts.settings.myWhatsAppNumber}`, W / 2, footerY + 78);
  }
}

export async function generateShareImage(p: Profile, settings: Settings): Promise<Blob> {
  const canvas = document.createElement('canvas');
  let photo: HTMLImageElement | null = null;
  let logo: HTMLImageElement | null = null;
  const first = p.photos?.[0];
  if (first) {
    try { photo = await loadImage(first.dataUrl); } catch { photo = null; }
  }
  if (settings.bureauLogo) {
    try { logo = await loadImage(settings.bureauLogo); } catch { logo = null; }
  }
  drawCard(canvas, { p, settings, photo, logo });
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png', 0.95));
}

export async function generateSharePDF(p: Profile, settings: Settings): Promise<Blob> {
  const blob = await generateShareImage(p, settings);
  const dataUrl = await blobToDataURL(blob);
  const img = await loadImage(dataUrl);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const scale = Math.min(pageW / img.width, pageH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  pdf.addImage(dataUrl, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
  return pdf.output('blob');
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
