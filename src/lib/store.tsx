import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Profile, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';
import * as db from './db';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  profiles: Profile[];
  settings: Settings;
  loading: boolean;
  toasts: Toast[];
  reload: () => Promise<void>;
  addProfile: (p: Profile) => Promise<void>;
  updateProfile: (p: Profile) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  bulkAdd: (list: Profile[]) => Promise<void>;
  clearAll: () => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
  repairDatabase: () => Promise<{ repaired: number; removed: number; total: number }>;
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const reload = useCallback(async () => {
    const [p, s] = await Promise.all([db.getAllProfiles(), db.getSettings()]);
    setProfiles(p);
    setSettings(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await db.performOneTimeReset();
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const addProfile = useCallback(async (p: Profile) => {
    await db.putProfile(p);
    setProfiles((prev) => [p, ...prev]);
  }, []);

  const updateProfile = useCallback(async (p: Profile) => {
    await db.putProfile(p);
    setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }, []);

  const removeProfile = useCallback(async (id: string) => {
    await db.deleteProfile(id);
    setProfiles((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const bulkAdd = useCallback(async (list: Profile[]) => {
    await db.bulkPutProfiles(list);
    await reload();
  }, [reload]);

  const clearAll = useCallback(async () => {
    await db.clearAllProfiles();
    setProfiles([]);
  }, []);

  const saveSettings = useCallback(async (s: Settings) => {
    await db.saveSettings(s);
    setSettings(s);
  }, []);

  const repairDatabase = useCallback(async () => {
    const result = await db.repairDatabase();
    await reload();
    return result;
  }, [reload]);

  const value = useMemo<AppState>(
    () => ({
      profiles,
      settings,
      loading,
      toasts,
      reload,
      addProfile,
      updateProfile,
      removeProfile,
      bulkAdd,
      clearAll,
      saveSettings,
      repairDatabase,
      toast,
      dismissToast,
    }),
    [profiles, settings, loading, toasts, reload, addProfile, updateProfile, removeProfile, bulkAdd, clearAll, saveSettings, repairDatabase, toast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
