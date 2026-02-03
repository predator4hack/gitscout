/**
 * Full-page authentication component with Firebase auth
 * Supports Google OAuth and email/password authentication
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../contexts/AuthContext';
import { NoiseOverlay } from '../components/landing/NoiseOverlay';

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get redirect destination from URL params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate(redirectTo, { replace: true });
    }
  }, [currentUser, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || undefined);
      }
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      if (err.message !== 'Sign in cancelled') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#030303] relative">
      <NoiseOverlay />

      {/* Fixed Header with Logo */}
      <nav className="fixed top-0 w-full z-50 nav-glass transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
              <Icon icon="solar:code-scan-bold" className="text-sm" />
            </div>
            <span className="font-medium tracking-tight text-sm text-white/90">
              GitScout
            </span>
          </Link>
        </div>
      </nav>

      {/* Centered Auth Form */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-14">
        <div className="w-full max-w-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 relative">
            {/* Header */}
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-[#888888] mb-6">
              {mode === 'signin'
                ? 'Sign in to access your saved searches and candidates'
                : 'Sign up to save searches and star candidates'}
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="logos:google-icon" className="w-5 h-5" />
                <span className="font-medium text-sm text-white/90">
                  Continue with Google
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0A0A0A] text-[#888888]">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-white/90 mb-1">
                    Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-md focus:outline-none focus:border-white/30 text-white placeholder-[#444444] transition-colors"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-md focus:outline-none focus:border-white/30 text-white placeholder-[#444444] transition-colors"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/[0.02] border border-white/10 rounded-md focus:outline-none focus:border-white/30 text-white placeholder-[#444444] transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#EDEDED] hover:bg-white text-black py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign in' : 'Create account'
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p className="mt-6 text-center text-sm text-[#888888]">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={switchMode}
                disabled={loading}
                className="text-white hover:text-white/80 font-medium disabled:opacity-50 transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
