import { useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { importFile, exportProfilesCSV, exportProfilesXLSX, exportProfilesJSON } from '../lib/importExport';
import { exportBackup, importBackup, type BackupFile } from '../lib/db';
import { downloadBlob } from '../lib/utils';
import { Upload, Download, FileSpreadsheet, FileJson, FileText, DatabaseBackup, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ImportExport() {
  const { profiles, settings, bulkAdd, reload, toast } = useApp();
  const importRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleImport = async (file: File) => {
    setBusy(true);
    const r = await importFile(file, settings);
    if (r.errors.length) {
      setResult(r);
      toast(r.errors[0], 'error');
    } else {
      setResult(r);
      await bulkAdd(r.profiles);
      toast(`${r.count} profiles imported successfully`);
    }
    setBusy(false);
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (profiles.length === 0) {
      toast('No profiles to export', 'error');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') downloadBlob(exportProfilesCSV(profiles), `almshaadi-profiles-${stamp}.csv`);
    if (format === 'xlsx') downloadBlob(exportProfilesXLSX(profiles), `almshaadi-profiles-${stamp}.xlsx`);
    if (format === 'json') downloadBlob(exportProfilesJSON(profiles), `almshaadi-profiles-${stamp}.json`);
    toast(`Exported ${profiles.length} profiles as ${format.toUpperCase()}`);
  };

  const handleBackupExport = async () => {
    const data = await exportBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `almshaadi-backup-${stamp}.json`);
    toast('Full backup exported');
  };

  const handleBackupImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupFile;
      const mode = confirm('OK = Replace all data\nCancel = Merge with existing') ? 'replace' : 'merge';
      const r = await importBackup(data, mode as 'replace' | 'merge');
      await reload();
      toast(`Backup restored: ${r.added} added, ${r.updated} updated`);
    } catch {
      toast('Invalid backup file', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon-800">Import / Export & Backup</h1>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Import */}
        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <h2 className="font-bold text-maroon-800 flex items-center gap-2 mb-3">
            <FileUp size={18} className="text-gold-600" /> Import Profiles
          </h2>
          <p className="text-sm text-gray-500 mb-4">Import profiles from CSV or Excel (XLSX). Columns are mapped automatically.</p>
          <button
            onClick={() => importRef.current?.click()}
            disabled={busy}
            className="w-full py-8 rounded-xl border-2 border-dashed border-cream-400 hover:border-gold-400 hover:bg-cream-50 transition flex flex-col items-center gap-2 text-maroon-500"
          >
            <Upload size={28} />
            <span className="text-sm font-semibold">{busy ? 'Importing…' : 'Choose CSV or XLSX file'}</span>
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          {result && (
            <div className="mt-4 space-y-2">
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${result.errors.length ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {result.errors.length ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                {result.errors.length ? result.errors[0] : `${result.count} records imported`}
              </div>
            </div>
          )}
        </section>

        {/* Export */}
        <section className="bg-white rounded-2xl p-5 shadow-soft">
          <h2 className="font-bold text-maroon-800 flex items-center gap-2 mb-3">
            <Download size={18} className="text-gold-600" /> Export Profiles
          </h2>
          <p className="text-sm text-gray-500 mb-4">Export {profiles.length} profiles in your preferred format.</p>
          <div className="grid grid-cols-3 gap-2">
            <ExportBtn onClick={() => handleExport('csv')} icon={<FileText size={20} />} label="CSV" />
            <ExportBtn onClick={() => handleExport('xlsx')} icon={<FileSpreadsheet size={20} />} label="Excel" />
            <ExportBtn onClick={() => handleExport('json')} icon={<FileJson size={20} />} label="JSON" />
          </div>
          <p className="mt-3 text-xs text-gray-400">JSON export includes all profile fields and photo references.</p>
        </section>

        {/* Backup */}
        <section className="bg-white rounded-2xl p-5 shadow-soft md:col-span-2">
          <h2 className="font-bold text-maroon-800 flex items-center gap-2 mb-3">
            <DatabaseBackup size={18} className="text-gold-600" /> Full Backup & Restore
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Full backup includes all profiles, all photos, and all settings. Use this to move data between devices or restore after a browser reset.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={handleBackupExport}
              className="py-4 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <Download size={18} /> Export Full Backup
            </button>
            <button
              onClick={() => backupRef.current?.click()}
              className="py-4 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Import Full Backup
            </button>
            <input
              ref={backupRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBackupImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ExportBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-4 rounded-xl bg-cream-100 hover:bg-cream-200 text-maroon-800 transition"
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
