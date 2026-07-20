import type { Profile, Settings } from '../lib/types';
import { SectionTitle } from './Form';
import { familySummary, formatDate, waLink, shareText } from '../lib/utils';
import { generateShareText } from '../lib/shareCard';
import {
  User, GraduationCap, Briefcase, BookOpen, Home, Users, Heart,
  MessageCircle, Share2, Printer, Pencil, ArrowLeft, Image as ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import ImageViewer from './ImageViewer';

interface Props {
  profile: Profile;
  settings: Settings;
  onBack: () => void;
  onEdit: () => void;
  onShare: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-cream-200 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-maroon-900 font-semibold text-right">{value || '-'}</span>
    </div>
  );
}

function arrDisplay(arr: string[]) {
  if (!arr || arr.length === 0) return '';
  return arr.join(', ');
}

export default function ProfileView({ profile: p, settings, onBack, onEdit, onShare }: Props) {
  const [viewer, setViewer] = useState<string | null>(null);
  const mainPhoto = p.photos?.[0]?.dataUrl;
  const clientWa = waLink(p.whatsappNumber);
  const myWa = waLink(settings.myWhatsAppNumber);

  const shareViaWhatsApp = async () => {
    const text = generateShareText(p, settings);
    const ok = await shareText(text, `${p.fullName} — ${settings.bureauName}`);
    if (!ok) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20" id="print-area">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-maroon-700 hover:text-maroon-900 transition">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={onShare} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-gold-600 hover:bg-gold-700 transition flex items-center gap-1.5">
            <Share2 size={16} /> Share Card
          </button>
          <button onClick={() => window.print()} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-maroon-800 bg-cream-200 hover:bg-cream-300 transition flex items-center gap-1.5">
            <Printer size={16} /> Print
          </button>
          <button onClick={onEdit} className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-maroon-700 hover:bg-maroon-800 transition flex items-center gap-1.5">
            <Pencil size={16} /> Edit
          </button>
        </div>
      </div>

      {/* Large photo on top */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="relative w-full bg-cream-100 flex items-center justify-center cursor-zoom-in" style={{ height: 'min(70vh, 560px)' }} onClick={() => mainPhoto && setViewer(mainPhoto)}>
          {mainPhoto ? (
            <img src={mainPhoto} alt={p.fullName} className="portrait-photo" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-maroon-300">
              <ImageIcon size={64} />
              <span className="text-sm">No photo</span>
            </div>
          )}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-maroon-700/90 text-white text-xs font-bold backdrop-blur">{p.id}</div>
        </div>
        {p.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-cream-50">
            {p.photos.map((ph) => (
              <button key={ph.id} onClick={() => setViewer(ph.dataUrl)} className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 border-cream-300 hover:border-gold-400 transition">
                <img src={ph.dataUrl} alt="" className="portrait-photo" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-maroon-800 font-serif">{p.fullName || '—'}</h1>
        <p className="text-sm text-gold-600 font-semibold mt-1">{p.id}</p>
      </div>

      {/* WhatsApp buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-8 print:hidden">
        {clientWa && (
          <a href={clientWa} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition flex items-center gap-2">
            <MessageCircle size={18} /> Client WhatsApp
          </a>
        )}
        {myWa && (
          <a href={myWa} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-maroon-700 hover:bg-maroon-800 transition flex items-center gap-2">
            <MessageCircle size={18} /> Bureau WhatsApp
          </a>
        )}
        <button onClick={shareViaWhatsApp} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gold-600 hover:bg-gold-700 transition flex items-center gap-2">
          <Share2 size={18} /> Share Profile
        </button>
      </div>

      {/* Sections */}
      <div className="grid md:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<User size={18} />}>1. Personal Information</SectionTitle>
          <Row label="Full Name" value={p.fullName} />
          <Row label="Father / Mother Name" value={p.fatherMotherName} />
          <Row label="Gender" value={p.gender} />
          <Row label="Age" value={p.age != null ? `${p.age} years` : ''} />
          <Row label="Height" value={p.height} />
          <Row label="Marital Status" value={p.maritalStatus} />
          <Row label="Disability Status" value={p.disabilityStatus && p.disabilityStatus !== 'None' ? p.disabilityStatus : 'None'} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<GraduationCap size={18} />}>2. Education Details</SectionTitle>
          <Row label="Qualification" value={p.education} />
          <Row label="College / University" value={p.collegeUniversity} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<Briefcase size={18} />}>3. Occupation Details</SectionTitle>
          <Row label="Profession Type" value={p.professionType} />
          <Row label="Job / Business Details" value={p.profession} />
          <Row label="Monthly Income" value={p.monthlyIncome} />
          <Row label="WhatsApp Number" value={p.whatsappNumber} />
          <Row label="Contact Person Name" value={p.contactPersonName} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<BookOpen size={18} />}>4. Religion Details</SectionTitle>
          <Row label="Maslak" value={p.sectMaslak} />
          <Row label="Caste" value={p.caste} />
          <Row label="Sub Caste" value={p.subCaste} />
          <Row label="Local / Migrated" value={p.localMuhajir} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft md:col-span-2">
          <SectionTitle icon={<Home size={18} />}>5. Residence Details</SectionTitle>
          <div className="grid md:grid-cols-2 gap-x-8">
            <div>
              <Row label="Residence Type" value={p.residenceType} />
              <Row label="House Size" value={p.houseSize} />
              <Row label="City" value={p.city} />
              <Row label="Village" value={p.village} />
            </div>
            <div>
              <Row label="Nationality" value={p.nationality} />
              <Row label="Address" value={p.address} />
              <Row label="Property Details" value={p.propertyDetails} />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <SectionTitle icon={<Users size={18} />}>6. Family Details</SectionTitle>
          <Row label="Father Occupation" value={p.fatherOccupation} />
          <Row label="Mother Occupation" value={p.motherOccupation} />
          <Row label="Brothers" value={p.brothers} />
          <Row label="Married Brothers" value={p.marriedBrothers} />
          <Row label="Sisters" value={p.sisters} />
          <Row label="Married Sisters" value={p.marriedSisters} />
          <Row label="Family Summary" value={familySummary(p)} />
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-soft md:col-span-2">
          <SectionTitle icon={<Heart size={18} />}>7. Partner Requirements</SectionTitle>
          <div className="grid md:grid-cols-2 gap-x-8">
            <div>
              <Row label="Preferred Age" value={p.prefAgeFrom != null || p.prefAgeTo != null ? `${p.prefAgeFrom ?? '?'} - ${p.prefAgeTo ?? '?'}` : ''} />
              <Row label="Preferred Height" value={p.prefHeightFrom || p.prefHeightTo ? `${p.prefHeightFrom || '?'} - ${p.prefHeightTo || '?'}` : ''} />
              <Row label="Preferred City" value={arrDisplay(p.prefCity)} />
              <Row label="Preferred Caste" value={arrDisplay(p.prefCaste)} />
              <Row label="Preferred Maslak" value={arrDisplay(p.prefMaslak)} />
              <Row label="Preferred Nationality / Country" value={arrDisplay(p.prefNationality)} />
              <Row label="Preferred Marital Status" value={arrDisplay(p.prefMaritalStatus)} />
            </div>
            <div>
              <Row label="Preferred Education" value={arrDisplay(p.prefEducation)} />
              <Row label="Preferred Profession" value={arrDisplay(p.prefProfession)} />
              <Row label="Preferred Disability" value={p.prefDisabilityStatus || 'Any'} />
              <Row label="Added On" value={formatDate(p.createdAt)} />
            </div>
          </div>
        </section>
      </div>

      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}
