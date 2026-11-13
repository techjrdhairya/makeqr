import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle as fbSignInWithGoogle, 
  signInWithApple as fbSignInWithApple, 
  logOut as fbLogOut,
  syncUserProfile,
  syncLocalHistoryToCloud
} from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
        } catch (e) {
          console.warn('Failed to sync user profile doc', e);
        }

        // Auto-sync any existing local QR codes to Firestore cloud database
        try {
          const keys = ['makeqr_saved_codes', 'qr_brand_studio_history_v1'];
          for (const key of keys) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                await syncLocalHistoryToCloud(parsed, currentUser.uid);
              }
            }
          }
        } catch (syncErr) {
          console.warn('Auto-sync local history on sign-in note:', syncErr);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      await fbSignInWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google login failed', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled by user.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups for this site.');
      } else {
        setAuthError(err?.message || 'Failed to sign in with Google.');
      }
      throw err;
    }
  };

  const signInWithApple = async () => {
    try {
      setAuthError(null);
      await fbSignInWithApple();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Apple login failed', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled by user.');
      } else if (
        err?.code === 'auth/operation-not-allowed' || 
        err?.code === 'auth/configuration-not-found' ||
        err?.message?.includes('operation-not-allowed')
      ) {
        setAuthError(
          'Apple Sign-In is not enabled yet in your Firebase console. Go to Authentication > Sign-in method in the Firebase Console to enable Apple.'
        );
      } else {
        setAuthError(err?.message || 'Failed to sign in with Apple.');
      }
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await fbLogOut();
    } catch (err: any) {
      console.error('Sign out error', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithApple,
        signOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
