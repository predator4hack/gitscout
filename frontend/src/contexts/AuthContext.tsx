/**
 * Authentication context provider using Firebase Auth
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';

// Auth context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in with email and password
  async function signIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string, displayName?: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  }

  // Sign in with Google OAuth
  async function signInWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      // User cancelled popup
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled');
      }
      throw new Error(getAuthErrorMessage(error));
    }
  }

  // Sign in with GitHub OAuth
  async function signInWithGitHub(): Promise<void> {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      // User cancelled popup
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled');
      }
      throw new Error(getAuthErrorMessage(error));
    }
  }

  // Sign out
  async function signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Send password reset email
  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  }

  // Update user profile
  async function updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateProfile(currentUser, {
        displayName,
        ...(photoURL && { photoURL }),
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  // Get Firebase ID token for API authentication
  async function getIdToken(): Promise<string | null> {
    if (!currentUser) {
      return null;
    }

    try {
      const token = await currentUser.getIdToken();
      return token;
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    resetPassword,
    updateUserProfile,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error: any): string {
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}
