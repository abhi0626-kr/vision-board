import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(user: FirebaseUser): AppUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth changed:', firebaseUser);

      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!auth) return { error: new Error('Firebase not configured') };

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: mapFirebaseAuthError(error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) return { error: new Error('Firebase not configured') };

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: mapFirebaseAuthError(error) };
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider)
      return { error: new Error('Firebase not configured') };

    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      console.log('Google Success:');
      console.log(result.user);

      // Update local user state immediately instead of waiting for auth listener
      setUser(mapFirebaseUser(result.user));

      setLoading(false);

      return { error: null };
    } catch (error) {
      console.error('Google Error:', error);
      setLoading(false);
      return { error: mapFirebaseAuthError(error) };
    }
  };

  function mapFirebaseAuthError(error: unknown) {
    const anyErr = error as any;
    const code = anyErr && anyErr.code ? String(anyErr.code) : undefined;

    switch (code) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return new Error('Invalid email or password.');
      case 'auth/invalid-email':
        return new Error('Invalid email address.');
      case 'auth/user-disabled':
        return new Error('This account has been disabled.');
      case 'auth/email-already-in-use':
        return new Error('Email is already in use.');
      case 'auth/popup-closed-by-user':
        return new Error('Sign-in popup closed before completing sign-in.');
      default:
        return error instanceof Error ? error : new Error('Authentication failed.');
    }
  }

  return (
    <AuthContext.Provider value={{ user, session: null, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
