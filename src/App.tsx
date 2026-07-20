import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './lib/store';
import Toaster from './components/Toaster';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import SearchPage from './pages/SearchPage';
import Matches from './pages/Matches';
import ImportExport from './pages/ImportExport';
import SettingsPage from './pages/SettingsPage';
import ProfileForm from './components/ProfileForm';
import ProfileView from './components/ProfileView';
import ShareModal from './components/ShareModal';
import ConfirmDialog from './components/ConfirmDialog';
import { LayoutDashboard, Users, Search, Heart, ArrowLeftRight, Settings as SettingsIcon, Menu, X, Heart as HeartIcon } from 'lucide-react';

export type Page = 'dashboard' | 'profiles' | 'search' | 'matches' | 'import-export' | 'settings' | 'add' | 'edit' | 'view';

interface NavState {
  page: Page;
  params?: Record<string, unknown>;
}

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'profiles', label: 'Profiles', icon: <Users size={20} /> },
  { id: 'search', label: 'Search', icon: <Search size={20} /> },
  { id: 'matches', label: 'Matches', icon: <Heart size={20} /> },
  { id: 'import-export', label: 'Import / Export', icon: <ArrowLeftRight size={20} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
];

const THEME_VARS: Record<string, { primary: string; dark: string; darker: string; light: string; fifty: string; hundred: string }> = {
  maroon: { primary: '#7a1f2b', dark: '#5e1822', darker: '#4a141c', light: '#9d2f44', fifty: '#fbf3f4', hundred: '#f7e6e8' },
  navy: { primary: '#1e3a5f', dark: '#162d4a', darker: '#0f1f33', light: '#2c5282', fifty: '#f0f4f8', hundred: '#dae5f0' },
  emerald: { primary: '#0f6e4f', dark: '#0a5640', darker: '#073d2e', light: '#159169', fifty: '#f0faf6', hundred: '#d4f0e4' },
  charcoal: { primary: '#2c2c2c', dark: '#1f1f1f', darker: '#141414', light: '#444444', fifty: '#f7f7f7', hundred: '#e8e8e8' },
};

function Shell() {
  const { profiles, settings, addProfile, updateProfile, removeProfile, toast } = useApp();
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Apply theme color via CSS variables
  useEffect(() => {
    const theme = THEME_VARS[settings.themeColor] || THEME_VARS.maroon;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-dark', theme.dark);
    root.style.setProperty('--theme-primary-darker', theme.darker);
    root.style.setProperty('--theme-primary-light', theme.light);
    root.style.setProperty('--theme-primary-50', theme.fifty);
    root.style.setProperty('--theme-primary-100', theme.hundred);
  }, [settings.themeColor]);

  const go = (page: Page, params?: Record<string, unknown>) => {
    setNav({ page, params });
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const currentProfile = (nav.params?.id as string) || '';
  const editingProfile = profiles.find((p) => p.id === currentProfile) || null;
  const shareProfile = profiles.find((p) => p.id === shareId) || null;
  const deleteProfile = profiles.find((p) => p.id === deleteId) || null;

  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard': return <Dashboard go={go} />;
      case 'profiles': return <Profiles go={go} initialDeleteId={(nav.params?.deleteId as string) || undefined} />;
      case 'search': return <SearchPage go={go} />;
      case 'matches': return <Matches go={go} />;
      case 'import-export': return <ImportExport />;
      case 'settings': return <SettingsPage />;
      case 'add':
        return (
          <ProfileForm settings={settings} onSave={async (p) => { await addProfile(p); toast('Profile added'); go('view', { id: p.id }); }} onCancel={() => go('dashboard')} />
        );
      case 'edit':
        return (
          <ProfileForm initial={editingProfile} settings={settings} onSave={async (p) => { await updateProfile(p); toast('Profile updated'); go('view', { id: p.id }); }} onCancel={() => go('profiles')} />
        );
      case 'view':
        if (!editingProfile) {
          return (
            <div className="text-center py-20">
              <p className="text-gray-500">Profile not found.</p>
              <button onClick={() => go('profiles')} className="mt-4 text-maroon-700 font-semibold">Back to Profiles</button>
            </div>
          );
        }
        return (
          <ProfileView profile={editingProfile} settings={settings} onBack={() => go('profiles')} onEdit={() => go('edit', { id: editingProfile.id })} onShare={() => setShareId(editingProfile.id)} />
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {/* Header — theme-colored */}
      <header className="sticky top-0 z-40 text-white shadow-card" style={{ backgroundColor: 'var(--theme-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go('dashboard')} className="flex items-center gap-2.5">
            {settings.bureauLogo ? (
              <img src={settings.bureauLogo} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white/10" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center">
                <HeartIcon size={20} className="text-maroon-900" fill="currentColor" />
              </span>
            )}
            <div className="text-left leading-tight">
              <p className="font-serif font-bold text-base">ALMShaadi.com</p>
              <p className="text-[10px] text-cream-200/80 uppercase tracking-widest">Marriage Bureau CRM</p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  nav.page === n.id || (n.id === 'profiles' && (nav.page === 'add' || nav.page === 'edit' || nav.page === 'view'))
                    ? 'bg-white/15 text-white'
                    : 'text-cream-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
          <button onClick={() => setMenuOpen((s) => !s)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t px-3 py-2 flex flex-col gap-1 animate-fadeIn" style={{ backgroundColor: 'var(--theme-primary-darker)' }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition flex items-center gap-2.5 ${
                  nav.page === n.id ? 'bg-white/15 text-white' : 'text-cream-200/80 hover:bg-white/10'
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">{renderPage()}</main>

      <footer className="text-cream-200/60 text-center text-xs py-3 px-4" style={{ backgroundColor: 'var(--theme-primary-darker)' }}>
        {settings.bureauName} · Marriage Bureau CRM · Data stored locally in your browser
      </footer>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-cream-200 grid grid-cols-5 shadow-card">
        {NAV.slice(0, 5).map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className="py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={nav.page === n.id ? { color: 'var(--theme-primary)' } : { color: '#9ca3af' }}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>

      {shareProfile && <ShareModal profile={shareProfile} settings={settings} onClose={() => setShareId(null)} />}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Profile?"
        message={`Delete "${deleteProfile?.fullName || ''}" (${deleteProfile?.id || ''})? This cannot be undone.`}
        onConfirm={async () => {
          if (deleteId) {
            await removeProfile(deleteId);
            toast('Profile deleted', 'info');
            setDeleteId(null);
            go('profiles');
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <AppProvider>
      <Shell />
      <Toaster />
    </AppProvider>
  );
}
