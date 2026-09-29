'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Logo from '@/components/ui/Logo';
import TerminalWindow from '@/components/ui/TerminalWindow';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useStore();
  // /login?mode=register opens straight into account creation.
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <TerminalWindow
        title={isRegister ? 'init_protocol.sh' : 'auth_gateway.sh'}
        className="w-full max-w-md animate-fade-in"
        bodyClassName="p-8"
      >
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
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
                <label htmlFor="login-username" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
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
              <label htmlFor="login-password" className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
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
      </TerminalWindow>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
