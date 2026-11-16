import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, Loader2, User } from 'lucide-react';
import { apiLogin, apiRegister, AuthUser } from '../lib/authClient';
import { useModalA11y } from '../hooks/useModalA11y';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  defaultMode?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setBusy(false);
      setPassword('');
    }
  }, [isOpen, defaultMode]);

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const mail = email.trim().toLowerCase();
    if (!mail || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setBusy(true);
    try {
      const user = mode === 'login'
        ? await apiLogin(mail, password)
        : await apiRegister(mail, password, name.trim());
      onSuccess(user);
    } catch (err: any) {
      const msg = String(err?.message || 'Gagal memproses.');
      setError(msg);
      // Akun belum ada -> arahkan ke daftar, jangan bingungkan user
      if (mode === 'login' && /belum terdaftar/i.test(msg)) {
        setMode('register');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#F9F6F0]/88 backdrop-blur-xl" onClick={onClose} />

      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Masuk atau daftar Bunda Journal" className="relative w-full max-w-[390px] bg-white rounded-[20px] border border-[#EDE8DF] shadow-[0_18px_50px_rgba(0,0,0,0.14)] p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="text-[10px] tracking-[2px] uppercase text-[#6B655C] font-semibold">
            Bunda Journal
          </div>
          <h2 className="font-serif text-[22px] font-bold text-[#111] mt-1">
            {mode === 'login' ? 'Masuk ke Akun Bunda' : 'Buat Akun Bunda'}
          </h2>
          <p className="text-[12px] text-[#6B655C] mt-1 italic font-serif">
            {mode === 'login'
              ? 'Data jurnal Bunda tersimpan per email.'
              : 'Sekali daftar, jurnal Bunda bisa dibuka di HP, tablet, dan laptop.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#6B655C] font-semibold block mb-1">
                Nama Bunda
              </label>
              <div className="flex items-center gap-2 border border-[#EDE8DF] rounded-xl px-3 h-[42px] focus-within:border-[#556B2F] bg-[#FAFAF9]">
                <User className="w-4 h-4 text-[#7A7468]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Bunda"
                  autoComplete="name"
                  className="flex-1 bg-transparent outline-none text-[13px] text-[#111] placeholder:text-[#7A7468]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#6B655C] font-semibold block mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 border border-[#EDE8DF] rounded-xl px-3 h-[42px] focus-within:border-[#556B2F] bg-[#FAFAF9]">
              <Mail className="w-4 h-4 text-[#7A7468]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                className="flex-1 bg-transparent outline-none text-[13px] text-[#111] placeholder:text-[#7A7468]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#6B655C] font-semibold block mb-1">
              Password
            </label>
            <div className="flex items-center gap-2 border border-[#EDE8DF] rounded-xl px-3 h-[42px] focus-within:border-[#556B2F] bg-[#FAFAF9]">
              <Lock className="w-4 h-4 text-[#7A7468]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Password Bunda'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="flex-1 bg-transparent outline-none text-[13px] text-[#111] placeholder:text-[#7A7468]"
              />
            </div>
          </div>

          {error && (
            <p className="text-[11.5px] text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            id="btn-login-google"
            onClick={() => { window.location.href = '/api/auth/google'; }}
            className="w-full h-[44px] rounded-xl border border-[#EDE8DF] bg-white text-[#292524] text-[13px] font-semibold flex items-center justify-center gap-2.5 hover:bg-[#FAFAF9] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Lanjut dengan Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-[#EDE8DF]"></div>
            <span className="shrink mx-2 text-[10px] text-[#7A7468] font-medium uppercase">atau email</span>
            <div className="grow border-t border-[#EDE8DF]"></div>
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            disabled={busy}
            className="w-full h-[44px] rounded-xl bg-[#556B2F] hover:bg-[#465926] disabled:opacity-60 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'login' ? 'Masuk' : 'Daftar & Masuk'}
          </button>
        </form>

        <div className="mt-4 text-center text-[12px] text-[#6B655C]">
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className="text-[#556B2F] font-bold underline cursor-pointer"
              >
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-[#556B2F] font-bold underline cursor-pointer"
              >
                Masuk
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
