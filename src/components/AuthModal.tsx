import React, { useState } from 'react';
import { X, Cloud, ShieldCheck, Sparkles, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signInWithGoogle, 
    signInWithApple, 
    authError, 
    clearAuthError 
  } = useAuth();

  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isLoggingInApple, setIsLoggingInApple] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogle = async () => {
    try {
      setIsLoggingInGoogle(true);
      await signInWithGoogle();
    } catch {
      // Error handled in context
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleApple = async () => {
    try {
      setIsLoggingInApple(true);
      await signInWithApple();
    } catch {
      // Error handled in context
    } finally {
      setIsLoggingInApple(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner dark:bg-indigo-950/80 dark:text-indigo-400 mb-3.5">
            <Cloud className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Sign In to MakeQR Cloud
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Save and synchronize all your customized QR codes, brand palettes, and designs safely in the cloud.
          </p>
        </div>

        {/* Cloud Features List */}
        <div className="my-5 space-y-2.5 rounded-xl bg-slate-50 p-3.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Automatic cloud backup &amp; multi-device synchronization</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Restore all high-res framed designs on any device</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
            <Cloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Export and re-download vectors and print sheets anytime</span>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{authError}</p>
              {authError.includes('Authentication > Sign-in method') && (
                <a
                  href="https://console.firebase.google.com/project/makebytechd/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 font-bold underline hover:text-rose-900 dark:hover:text-rose-200"
                >
                  Open Firebase Auth Console <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <button 
              type="button" 
              onClick={clearAuthError}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Social Sign-In Buttons */}
        <div className="space-y-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isLoggingInGoogle || isLoggingInApple}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-750"
          >
            {isLoggingInGoogle ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google G SVG */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={handleApple}
            disabled={isLoggingInGoogle || isLoggingInApple}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-black py-2.5 px-4 text-sm font-semibold text-white shadow-xs hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:opacity-60 transition-all dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          >
            {isLoggingInApple ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting with Apple...</span>
              </>
            ) : (
              <>
                {/* Official Apple Silhouette SVG */}
                <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.89-14.24-7.29-11.08-12.92-23.9-16.88-38.45-3.96-14.56-5.94-27.42-5.94-38.58 0-14.86 3.7-27.05 11.1-36.56 7.4-9.51 16.71-14.34 27.93-14.49 4.35 0 9.29 1.16 14.82 3.49 5.53 2.33 9.47 3.53 11.82 3.6 2.57 0 6.69-1.28 12.37-3.85 5.68-2.57 10.74-3.73 15.17-3.48 11.52.48 20.93 4.67 28.24 12.56 7.31 7.89 12.01 17.51 14.1 28.87-10.45 6.32-15.62 14.89-15.51 25.7.11 8.91 3.54 16.51 10.29 22.8 6.75 6.29 14.74 9.94 23.97 10.95-2.07 6.42-4.58 13.37-7.53 20.84zM119.22 31.84c0-7.39 2.65-14.51 7.96-21.36 5.3-6.85 11.95-10.48 19.93-10.48.22 1.09.33 2.18.33 3.27 0 7.39-2.77 14.46-8.31 21.21-5.54 6.75-12.18 10.38-19.91 10.91z" />
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
          By signing in, your QR codes will be securely stored in your private Firebase Firestore database space.
        </p>
      </div>
    </div>
  );
};
