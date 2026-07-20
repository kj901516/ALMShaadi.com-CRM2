import { useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { DEFAULT_SETTINGS, type Settings } from '../lib/types';
import { Save, RotateCcw, Settings as SettingsIcon, Shield, Database, Upload, Download, Image as ImageIcon, MapPin, Wrench, Loader2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { getStorageEstimate, exportSettingsBackup, importSettingsBackup } from '../lib/db';
import { downloadBlob, compressImage, readFileAsDataURL } from '../lib/utils';

const THEME_COLORS = [
  { id: 'maroon', label: 'Maroon', color: '#7a1f2b' },
  { id: 'navy', label: 'Navy', color: '#1e3a5f' },
  { id: 'emerald', label: 'Emerald', color: '#0f6e4f' },
  { id: 'charcoal', label: 'Charcoal', color: '#2c2c2c' },
];

export default function SettingsPage() {
  const { settings, saveSettings, repairDatabase, toast } = useApp();
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const settingsImportRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(form);
    setSaving(false);
    toast('Settings saved');
  };

  const handleReset = async () => {
    setForm({ ...DEFAULT_SETTINGS });
    await saveSettings({ ...DEFAULT_SETTINGS });
    setResetOpen(false);
    toast('Settings reset to defaults', 'info');
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
      await repairDatabase();
      toast('Database repaired successfully.');
    } catch {
      toast('Database repair failed', 'error');
    } finally {
      setRepairing(false);
    }
  };

  const checkStorage = async () => {
    const est = await getStorageEstimate();
    setStorage(est);
  };

  const handleLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }
    const raw = await readFileAsDataURL(file);
    const compressed = await compressImage(raw, 400, 0.9);
    setForm({ ...form, bureauLogo: compressed });
    toast('Logo loaded — click Save to keep');
  };

  const handleExportSettings = async () => {
    const blob = await exportSettingsBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `almshaadi-settings-${stamp}.json`);
    toast('Settings backup exported');
  };

  const handleImportSettings = async (file: File) => {
    try {
      const merged = await importSettingsBackup(file);
      setForm(merged);
      toast('Settings imported — click Save to apply');
    } catch {
      toast('Invalid settings file', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      <h1 className="text-2xl font-bold text-maroon-800 flex items-center gap-2">
        <SettingsIcon size={22} /> Settings
      </h1>

      <section className="bg-white rounded-2xl p-5 shadow-soft space-y-4">
        <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide border-b border-cream-200 pb-2">Bureau Information</h2>
        <Field label="Marriage Bureau Name">
          <input
            value={form.bureauName}
            onChange={(e) => setForm({ ...form, bureauName: e.target.value })}
            className={inputCls}
            placeholder="ALMShaadi.com Marriage Bureau"
          />
        </Field>
        <Field label="Bureau WhatsApp Number" hint="Used by the 'Bureau WhatsApp' button on profiles">
          <input
            value={form.myWhatsAppNumber}
            onChange={(e) => setForm({ ...form, myWhatsAppNumber: e.target.value })}
            className={inputCls}
            placeholder="e.g. 03001234567"
          />
        </Field>
        <Field label="Bureau Address">
          <textarea
            value={form.bureauAddress}
            onChange={(e) => setForm({ ...form, bureauAddress: e.target.value })}
            className={`${inputCls} resize-y min-h-[70px]`}
            placeholder="Office address"
          />
        </Field>

        {/* Logo */}
        <div>
          <span className="text-xs font-semibold text-maroon-800 uppercase tracking-wide">Bureau Logo</span>
          <div className="mt-1.5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-cream-100 border border-cream-300 overflow-hidden flex items-center justify-center">
              {form.bureauLogo ? (
                <img src={form.bureauLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon size={28} className="text-maroon-200" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-maroon-800 bg-cream-100 hover:bg-cream-200 transition flex items-center gap-1.5"
              >
                <Upload size={14} /> Upload Logo
              </button>
              {form.bureauLogo && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, bureauLogo: '' })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogo(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Theme color */}
        <div>
          <span className="text-xs font-semibold text-maroon-800 uppercase tracking-wide">Default Theme Color</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {THEME_COLORS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm({ ...form, themeColor: t.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition ${
                  form.themeColor === t.id ? 'border-maroon-700 bg-maroon-50' : 'border-cream-300 hover:border-gold-400'
                }`}
                style={form.themeColor === t.id ? { borderColor: t.color, backgroundColor: t.color + '15' } : {}}
              >
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-sm font-semibold text-maroon-800">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Default City">
            <input value={form.defaultCity} onChange={(e) => setForm({ ...form, defaultCity: e.target.value })} className={inputCls} placeholder="Karachi" />
          </Field>
          <Field label="Default Nationality">
            <input
              value={form.defaultNationality}
              onChange={(e) => setForm({ ...form, defaultNationality: e.target.value })}
              className={inputCls}
              placeholder="Pakistani"
            />
          </Field>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-soft">
        <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-cream-200 pb-2 mb-4">
          <Shield size={16} /> Admin Mode
        </h2>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-700">
            Show "Entered By" staff field
            <span className="block text-xs text-gray-400">When enabled, staff can see who entered each profile. Hidden from public profile view.</span>
          </span>
          <button
            type="button"
            onClick={() => setForm({ ...form, adminMode: !form.adminMode })}
            className={`relative w-12 h-6 rounded-full transition ${form.adminMode ? 'bg-maroon-700' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${form.adminMode ? 'translate-x-6' : ''}`} />
          </button>
        </label>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow-soft">
        <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-cream-200 pb-2 mb-4">
          <Database size={16} /> Storage
        </h2>
        <button onClick={checkStorage} className="text-sm font-semibold text-maroon-700 hover:text-maroon-900">
          Check storage usage
        </button>
        {storage && (
          <div className="mt-3 text-sm text-gray-600">
            <p>
              Used: <span className="font-semibold">{(storage.usage / 1024 / 1024).toFixed(2)} MB</span>
              {storage.quota > 0 && <> of {(storage.quota / 1024 / 1024).toFixed(0)} MB available</>}
            </p>
            <p className="text-xs text-gray-400 mt-1">All data is stored locally in your browser via IndexedDB.</p>
          </div>
        )}
      </section>

      {/* Database repair */}
      <section className="bg-white rounded-2xl p-5 shadow-soft">
        <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-cream-200 pb-2 mb-4">
          <Wrench size={16} /> Database Repair
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Fix broken profile IDs, remove orphan records, and repair legacy duplicate profiles that cannot be deleted. This preserves all valid profiles and settings.
        </p>
        <button
          onClick={handleRepair}
          disabled={repairing}
          className="px-4 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-sm font-bold transition flex items-center gap-2 disabled:opacity-60"
        >
          {repairing ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
          Repair Database
        </button>
      </section>

      {/* Settings backup */}
      <section className="bg-white rounded-2xl p-5 shadow-soft">
        <h2 className="font-bold text-maroon-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-cream-200 pb-2 mb-4">
          <MapPin size={16} /> Settings Backup
        </h2>
        <p className="text-sm text-gray-500 mb-3">Export your bureau settings to a file, or import settings from a previous backup.</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportSettings}
            className="py-3 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold transition flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} /> Export Settings
          </button>
          <button
            onClick={() => settingsImportRef.current?.click()}
            className="py-3 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-semibold transition flex items-center justify-center gap-2 text-sm"
          >
            <Upload size={16} /> Import Settings
          </button>
          <input
            ref={settingsImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportSettings(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setResetOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
        >
          <RotateCcw size={16} /> Reset Settings
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-maroon-700 hover:bg-maroon-800 transition flex items-center gap-1.5 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Reset Settings?"
        message="All settings will return to their default values. Your profiles will not be affected."
        confirmLabel="Reset"
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-cream-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-400';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-maroon-800 uppercase tracking-wide">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}
