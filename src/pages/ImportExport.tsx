import { useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { importFile, exportProfilesCSV, exportProfilesXLSX, exportProfilesJSON } from '../lib/importExport';
import { exportBackup, importBackup, type BackupFile } from '../lib/db';
import { downloadBlob } from '../lib/utils';
import {
  exportProfileJson,
  exportFullJsonBackup,
  parseJsonBackupFile,
  prepareRestoredProfile,
  prepareRestoredBackup,
  clearStorageForReplace,
  type JsonProfileFile,
  type JsonBackupFile,
} from '../lib/jsonBackup';
import type { Profile } from '../lib/types';
import { Upload, Download, FileSpreadsheet, FileJson, FileText, DatabaseBackup, FileUp, AlertCircle, CheckCircle2, Package, PackageOpen } from 'lucide-react';
import type { Page } from '../App';

interface Props {
  go: (page: Page, params?: Record<string, unknown>) => void;
  onRestoreProfile: (p: Profile) => void;
}

export default function ImportExport({ go, onRestoreProfile }: Props) {
  const { profiles, settings, bulkAdd, reload, toast } = useApp();
  const importRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);
  const jsonProfileExportRef = useRef<HTMLInputElement>(null);
  const jsonFullExportRef = useRef<HTMLInputElement>(null);
  const jsonProfileImportRef = useRef<HTMLInputElement>(null);
  const jsonFullImportRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [jsonBusy, setJsonBusy] = useState(false);

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

  // ---------- JSON Backup & Restore (self-contained, Base64 embedded) ----------

  const handleJsonProfileExport = async () => {
    if (profiles.length === 0) {
      toast('No profiles to export', 'error');
      return;
    }
    setJsonBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const file = await exportProfileJson(profiles[0]);
      downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `almshaadi-profile-${profiles[0].id}-${stamp}.json`);
      toast(`Profile ${profiles[0].id} exported (self-contained)`);
    } catch {
      toast('Failed to export profile JSON', 'error');
    }
    setJsonBusy(false);
  };

  const handleJsonFullExport = async () => {
    if (profiles.length === 0) {
      toast('No profiles to export', 'error');
      return;
    }
    setJsonBusy(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const file = await exportFullJsonBackup(profiles, settings);
      downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `almshaadi-full-backup-${stamp}.json`);
      toast(`Full backup exported: ${profiles.length} profiles (self-contained)`);
    } catch {
      toast('Failed to export full backup', 'error');
    }
    setJsonBusy(false);
  };

  const handleJsonProfileImport = async (file: File) => {
    setJsonBusy(true);
    try {
      const text = await file.text();
      const parsed = await parseJsonBackupFile(text);
      if (parsed.kind !== 'single-profile') {
        toast('This is a full backup file, not a single profile. Use Full Restore instead.', 'error');
        setJsonBusy(false);
        return;
      }
      const profile = prepareRestoredProfile(parsed as JsonProfileFile);
      onRestoreProfile(profile);
      go('restore-profile');
      toast('Profile loaded — review and click Save to restore');
    } catch (e) {
      toast((e as Error).message || 'Invalid profile JSON', 'error');
    }
    setJsonBusy(false);
  };

  const handleJsonFullImport = async (file: File) => {
    setJsonBusy(true);
    try {
      const text = await file.text();
      const parsed = await parseJsonBackupFile(text);
      if (parsed.kind !== 'full-backup') {
        toast('This is a single profile file, not a full backup. Use Profile Restore instead.', 'error');
        setJsonBusy(false);
        return;
      }
      const backup = parsed as JsonBackupFile;
      const mode = confirm('OK = Replace ALL data (deletes existing profiles first)\nCancel = Merge with existing profiles') ? 'replace' : 'merge';
      if (mode === 'replace') {
        await clearStorageForReplace();
      }
      const restored = prepareRestoredBackup(backup);
      await bulkAdd(restored);
      await reload();
      toast(`Full restore complete: ${restored.length} profiles ${mode === 'replace' ? 'restored' : 'merged'}`);
    } catch (e) {
      toast((e as Error).message || 'Invalid backup JSON', 'error');
    }
    setJsonBusy(false);
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

        {/* JSON Backup & Restore (self-contained, Base64 embedded) */}
        <section className="bg-white rounded-2xl p-5 shadow-soft md:col-span-2 border-l-4 border-gold-400">
          <h2 className="font-bold text-maroon-800 flex items-center gap-2 mb-1">
            <Package size={18} className="text-gold-600" /> JSON Backup &amp; Restore
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Self-contained backups with every photo embedded as Base64 inside the JSON file.
            No internet connection needed to restore. Does not affect existing Share, PDF, Card, or Upload features.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Profile JSON */}
            <div className="rounded-xl border border-cream-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-maroon-700 flex items-center gap-1.5">
                <Package size={15} /> Single Profile JSON
              </h3>
              <p className="text-xs text-gray-500">Export one profile with all photos embedded, or restore a profile JSON into the form for review.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleJsonProfileExport}
                  disabled={jsonBusy}
                  className="py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download size={14} /> Export Profile
                </button>
                <button
                  onClick={() => jsonProfileImportRef.current?.click()}
                  disabled={jsonBusy}
                  className="py-2.5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PackageOpen size={14} /> Restore Profile
                </button>
                <input
                  ref={jsonProfileImportRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleJsonProfileImport(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Full CRM JSON */}
            <div className="rounded-xl border border-cream-200 p-4 space-y-3">
              <h3 className="text-sm font-bold text-maroon-700 flex items-center gap-1.5">
                <DatabaseBackup size={15} /> Full CRM Backup
              </h3>
              <p className="text-xs text-gray-500">Export every profile and every photo as one self-contained JSON file, or restore the entire CRM.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleJsonFullExport}
                  disabled={jsonBusy}
                  className="py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download size={14} /> Export Full Backup
                </button>
                <button
                  onClick={() => jsonFullImportRef.current?.click()}
                  disabled={jsonBusy}
                  className="py-2.5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PackageOpen size={14} /> Restore Full Backup
                </button>
                <input
                  ref={jsonFullImportRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleJsonFullImport(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              <strong>Restore</strong> reuses your existing save flow — photos are uploaded to Storage and profiles are saved exactly as if you created them manually.
              <strong> Replace</strong> mode deletes existing profiles first; <strong>Merge</strong> keeps existing profiles and updates matching IDs.
            </p>
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
