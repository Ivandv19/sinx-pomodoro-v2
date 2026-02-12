/** @jsxImportSource react */
import React, { useState, useRef } from 'react';
import { signIn, signUp, turnstileToken as globalTurnstileToken } from '../../lib/auth-client';
import { Turnstile } from '@marsidev/react-turnstile';

interface Props {
  translations: {
    loginTitle: string;
    signupTitle: string;
    loginSubtitle: string;
    signupSubtitle: string;
    toggleLogin: string;
    toggleSignup: string;
    btnLogin: string;
    btnSignup: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    genericError: string;
    loading: string;
  };
  redirectPath: string;
}

export default function AuthForm({ translations, redirectPath }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const turnstileRef = useRef<any>(null);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setTurnstileToken(null);
    globalTurnstileToken.current = null;
    turnstileRef.current?.reset();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError('Please complete the security verification');
      return;
    }

    globalTurnstileToken.current = turnstileToken;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        const { error } = await signIn.email({ email, password });
        if (error) throw new Error(error.message || translations.genericError);
      } else {
        const { error } = await signUp.email({
          email,
          password,
          name: email.split('@')[0] || 'User',
        });
        if (error) throw new Error(error.message || translations.genericError);
      }
      window.location.href = redirectPath;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setTurnstileToken(null);
      globalTurnstileToken.current = null;
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-base-100/50 backdrop-blur-sm border border-base-200 p-10 rounded-3xl shadow-2xl animate-fade-in transition-all duration-300">

      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black bg-linear-to-r from-(--auth-title-from) to-(--auth-title-to) bg-clip-text text-transparent font-[Outfit] tracking-tight py-1">
          {isLogin ? translations.loginTitle : translations.signupTitle}
        </h2>
        <p className="text-sm text-(--auth-text-secondary) font-medium">
          {isLogin ? translations.loginSubtitle : translations.signupSubtitle}{' '}
          <button
            onClick={toggleMode}
            type="button"
            className="text-[var(--auth-accent)] hover:text-[var(--auth-accent-hover)] underline underline-offset-4 transition-all cursor-pointer font-bold"
          >
            {isLogin ? translations.toggleSignup : translations.toggleLogin}
          </button>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="group">
            <label htmlFor="email-address" className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1">
              {translations.emailLabel}
            </label>
            <div className="relative group-focus-within:scale-[1.01] transition-transform">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-(--auth-accent)/40 focus:border-(--auth-accent)/40 focus:z-10 sm:text-sm transition-all"
                placeholder={translations.emailPlaceholder}
              />
              <span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </span>
            </div>
          </div>

          <div className="group">
            <label htmlFor="password" ext-id="password-label" className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1">
              {translations.passwordLabel}
            </label>
            <div className="relative group-focus-within:scale-[1.01] transition-transform">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-(--auth-accent)/40 focus:border-(--auth-accent)/40 focus:z-10 sm:text-sm transition-all"
                placeholder={translations.passwordPlaceholder}
              />
              <span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 inset-y-0 flex items-center pr-4 text-(--auth-placeholder) hover:text-(--auth-accent) transition-colors cursor-pointer z-20"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 shadow-md text-xs font-bold text-center animate-bounce bg-red-100 dark:bg-red-400/10 py-2.5 px-4 rounded-xl border border-red-300 dark:border-red-400/20">
            {error}
          </div>
        )}

        <div className="w-full flex justify-center py-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
            options={{
              theme: 'auto',
              size: 'flexible',
            }}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => {
              setTurnstileToken(null);
              setError('Security verification failed. Please try again.');
            }}
            onExpire={() => {
              setTurnstileToken(null);
              setError('Security verification expired. Please try again.');
            }}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-14 text-sm font-black rounded-2xl border-none shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{translations.loading}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:rotate-12 transition-transform" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                <span>{isLogin ? translations.btnLogin : translations.btnSignup}</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}