'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createClient } from '@/utils/supabase/client';
import Logo from '@/components/ui/Logo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth-callback-failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, username, password);
      } else {
        await login(email, password);
      }
      router.push('/today');
    } catch (err) {
      if ((err as Error).message.includes('Check your email')) {
        setMessage('Registration successful! Please check your email for the confirmation link.');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Terminal Window Header */}
        <div className="bg-surface-container-low rounded-t-md px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-error/60"></div>
            <div className="w-3 h-3 rounded-full bg-tertiary/60"></div>
            <div className="w-3 h-3 rounded-full bg-primary/60"></div>
          </div>
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
            {isRegister ? 'init_protocol.sh' : 'auth_gateway.sh'}
          </span>
        </div>

        {/* Terminal Body */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 border-t-0 rounded-b-md p-8">
          {/* Logo */}
          <div className="text-center mb-8 flex flex-col items-center">
            <Logo size="lg" />
            <p className="font-mono text-xs text-on-surface-variant mt-6 tracking-wide">
              {isRegister ? '> system/register --new-user' : '> system/authenticate --login'}
            </p>
          </div>

          {/* Terminal Log */}
          <div className="mb-6 font-mono text-xs space-y-1">
            <div className="text-on-surface-variant">
              <span className="text-outline">[sys]</span>{' '}
              <span className="text-secondary">STATUS:</span>{' '}
              Awaiting credentials...
            </div>
            {error && (
              <div className="text-error animate-fade-in">
                <span className="text-outline">[err]</span>{' '}
                <span className="text-error">DENIED:</span>{' '}
                {error}
              </div>
            )}
            {message && (
              <div className="text-primary animate-fade-in">
                <span className="text-outline">[sys]</span>{' '}
                <span className="text-primary">INFO:</span>{' '}
                {message}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                &gt; EMAIL_ADDRESS
              </label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                <span className="text-primary font-mono text-sm">&gt;</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                  placeholder="operator@sovereign.sys"
                  required
                  id="login-email"
                />
              </div>
            </div>

            {/* Username Field (Register only) */}
            {isRegister && (
              <div className="animate-fade-in">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  &gt; USERNAME_ALIAS
                </label>
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                  <span className="text-primary font-mono text-sm">&gt;</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                    placeholder="root_user"
                    required={isRegister}
                    id="login-username"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                &gt; ACCESS_KEY
              </label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                <span className="text-primary font-mono text-sm">&gt;</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                  placeholder="••••••••••"
                  required
                  minLength={6}
                  id="login-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-scanline-gradient text-on-primary font-headline font-bold py-3 px-4 rounded-sm hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-blink">▊</span> Processing...
                </span>
              ) : (
                isRegister ? 'INITIALIZE ACCOUNT ↵' : 'AUTHENTICATE ↵'
              )}
            </button>
          </form>

          {/* Google OAuth Button */}
          <div className="mt-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-surface-container-high text-on-surface font-headline font-bold py-3 px-4 rounded-sm hover:bg-surface-container-highest transition-all disabled:opacity-50 uppercase tracking-wider text-sm flex items-center justify-center gap-2 border border-outline-variant/30"
              type="button"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              AUTHENTICATE VIA GOOGLE
            </button>
          </div>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors"
              id="toggle-auth-mode"
            >
              {isRegister ? (
                <>&gt; Existing operator? <span className="text-primary underline">Login here</span></>
              ) : (
                <>&gt; New operator? <span className="text-primary underline">Register here</span></>
              )}
            </button>
          </div>

          {/* Terminal footer */}
          <div className="mt-8 pt-4 border-t border-outline-variant/10">
            <div className="font-mono text-[10px] text-outline flex justify-between">
              <span>SYSTEM_VERSION: v1.0.0-stable</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4 text-primary font-mono text-xs animate-pulse">Loading system protocols...</div>}>
      <LoginContent />
    </Suspense>
  );
}
