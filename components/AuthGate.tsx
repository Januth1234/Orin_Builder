import React, { useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useBuilderStore } from '../services/builderStore';
import { APP_CONFIG } from '../config';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authLoading, setUser, setAuthLoading } = useBuilderStore();
  const [loginError, setLoginError] = React.useState<string | null>(null);

  useEffect(() => {
    let resolved = false;
    const clearLoading = () => {
      if (resolved) return;
      resolved = true;
      setAuthLoading(false);
    };

    // Register auth listener first so startup never blocks on SSO exchange.
    const unsub = firebaseService.onAuthChanged(async (fbUser) => {
      if (fbUser) {
        const account = await firebaseService.upsertUser(fbUser).catch(() => ({
          id: fbUser.uid, name: fbUser.displayName ?? 'User',
          email: fbUser.email ?? '', avatar: fbUser.photoURL ?? undefined,
          tier: 'Free' as const, dailyUsage: { text:0, images:0, videos:0 },
        })) as any;
        setUser(account);
        // Apply preferences inherited from main Orin AI app
        if (account.preferences) {
          const p = account.preferences;
          // Language: stored as 'sinhala'|'tamil'|'english' in main app
          if (p.language && typeof p.language === 'string') {
            document.documentElement.setAttribute('data-lang', p.language);
          }
          // Theme: main app uses 'dark'|'light'|'auto'
          const theme = p.theme ?? p.colorTheme ?? 'dark';
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
        }
        // Mark window so main app can detect builder is loaded
        (window as any).__orinUser = { id: fbUser.uid, name: fbUser.displayName };
      } else {
        setUser(null);
      }
      clearLoading();
    });

    const startupTimeout = window.setTimeout(() => {
      clearLoading();
      setLoginError('Session check timed out. Please sign in manually.');
    }, 8000);

    // Run SSO exchange in background. Listener above will react if sign-in succeeds.
    firebaseService.attemptSSOFromUrl().catch(() => {
      /* no-op; login screen remains available */
    });

    return () => {
      window.clearTimeout(startupTimeout);
      unsub?.();
    };
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try { await firebaseService.loginWithGoogle(); }
    catch (e: any) { setLoginError(e?.message ?? 'Login failed. Try again.'); }
  };

  if (authLoading) return <Spinner />;
  if (!user) return <LoginScreen onLogin={handleLogin} error={loginError} />;
  return <>{children}</>;
};

const Spinner = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-b-bg">
    <div className="flex flex-col items-center gap-3">
      <BuilderIcon />
      <div className="h-5 w-5 rounded-full border-2 border-b-accent/30 border-t-b-accent animate-spin-slow" />
      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-b-muted">
        Checking session…
      </span>
    </div>
  </div>
);

const LoginScreen: React.FC<{ onLogin: () => void; error: string | null }> = ({ onLogin, error }) => (
  <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-b-bg gap-8 p-6 overflow-hidden">
    {/* Ambient orbs matching orinai.org */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-b-accent/8 blur-[100px]" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-b-blue/8 blur-[100px]" />
    </div>

    {/* Ecosystem breadcrumb */}
    <div className="relative flex items-center gap-2 text-[11px] text-b-dim">
      <a href={APP_CONFIG.mainAppUrl} className="hover:text-b-accent transition-colors font-medium">
        <span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span>
      </a>
      <span>›</span>
      <span className="text-b-muted font-semibold">Builder</span>
    </div>

    {/* Logo + title */}
    <div className="relative flex flex-col items-center gap-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-b-accent/20 blur-xl scale-150" />
        <BuilderIcon size={56} />
      </div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-b-accent">Orin</span><span className="text-b-blue">AI</span>
          <span className="text-white ml-2">Builder</span>
        </h1>
        <p className="text-sm text-b-muted mt-1 max-w-xs leading-relaxed">
          AI website generator — describe it, get the full stack.
        </p>
      </div>
    </div>

    {/* Card */}
    <div className="relative w-full max-w-[380px] rounded-2xl border border-b-border bg-b-surf/80 backdrop-blur p-7 flex flex-col gap-4 shadow-2xl shadow-black/40">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-b-accent/8 border border-b-accent/20">
        <div className="w-7 h-7 rounded-lg bg-b-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 4.5H13l-3.75 2.75 1.5 4.5L7 10l-3.75 2.75 1.5-4.5L1 5.5h4.5L7 1z" fill="#22c892"/>
          </svg>
        </div>
        <p className="text-[11px] text-b-muted leading-relaxed">
          <span className="text-b-accent font-semibold">Same account as Orin AI.</span>{' '}
          Sign in with the same Google account — your plan, preferences, and history carry over automatically.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-800/40 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={onLogin}
        className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3 px-4 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-black/20"
      >
        <GoogleSvg />
        Continue with Google
      </button>

      <p className="text-center text-[10px] text-b-dim leading-relaxed">
        By signing in you agree to Orin AI's{' '}
        <a href={`${APP_CONFIG.mainAppUrl}/#terms`} target="_blank" rel="noreferrer" className="text-b-blue hover:underline underline-offset-2">Terms</a>
        {' '}&{' '}
        <a href={`${APP_CONFIG.mainAppUrl}/#privacy`} target="_blank" rel="noreferrer" className="text-b-blue hover:underline underline-offset-2">Privacy</a>
      </p>
    </div>

    <a href={APP_CONFIG.mainAppUrl} className="relative text-[11px] text-b-dim hover:text-b-muted transition-colors flex items-center gap-1.5">
      <span>←</span> Back to Orin AI
    </a>
  </div>
);

const BuilderIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#22c892" fillOpacity="0.12"/>
    <path d="M9 16h14M16 9v14" stroke="#22c892" strokeWidth="2" strokeLinecap="round"/>
    <rect x="6" y="6" width="20" height="20" rx="4" stroke="#22c892" strokeWidth="1.5" strokeOpacity="0.4"/>
  </svg>
);

const GoogleSvg = () => (
  <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.638-.057-1.252-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.121 17.64 11.855 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
);

export default AuthGate;
