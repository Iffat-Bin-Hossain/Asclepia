'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Lock, Mail, LogIn, ArrowRight, Home, AlertTriangle, Clock } from 'lucide-react';
import AnimatedAsclepiaLogo from '@/components/AnimatedAsclepiaLogo';
import DnaBackground from '@/components/ui/DnaBackground';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') || searchParams.get('pending')) {
      setPendingNotice('Your assistant registration was submitted. Please wait for administrator approval before signing in.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setPendingNotice(null);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back to Asclepia');
    } catch (error: any) {
      const errMsg = getErrorMessage(error);
      if (
        errMsg.toLowerCase().includes('pending') ||
        errMsg.toLowerCase().includes('approval') ||
        error?.response?.status === 403
      ) {
        setPendingNotice('Signup request pending.');
        toast.error('Signup request pending.');
      } else {
        toast.error(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#A5ECEB] animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#070d14',
        color: '#f0fdfa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <DnaBackground opacity={0.12} />

      {/* ── Top Header / Navbar: Animated Logo & Actions ── */}
      <header
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          boxSizing: 'border-box',
          zIndex: 20,
        }}
      >
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
          aria-label="Asclepia Home"
        >
          <div
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <AnimatedAsclepiaLogo compact={true} width={40} height={40} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.24em', color: '#A5ECEB', textTransform: 'uppercase', lineHeight: 1 }}>
              Asclepia
            </span>
            <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(165,236,235,0.5)', fontWeight: 500, textTransform: 'uppercase', marginTop: '4px' }}>
              Clinical Portal
            </span>
          </div>
        </Link>

        {/* Top-right quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#f0fdfa',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(165, 236, 235, 0.25)',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5 text-[#A5ECEB]" />
            <span>Home</span>
          </Link>

          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#070d14',
              backgroundColor: '#A5ECEB',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>Sign Up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Center Login Modal / Card ── */}
      <main
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'rgba(11, 21, 31, 0.95)',
            border: '1px solid rgba(165, 236, 235, 0.2)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(165, 236, 235, 0.06)',
            backdropFilter: 'blur(20px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Form Header */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0fdfa', margin: 0 }}>
              Sign In
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Sign in to continue.
            </p>
          </div>

          {/* Pending / Approval Notice Banner */}
          {pendingNotice && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(165, 236, 235, 0.08)',
                border: '1px solid rgba(165, 236, 235, 0.3)',
                color: '#f0fdfa',
                fontSize: '12px',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ marginTop: '2px', color: '#A5ECEB' }} />
              <div>
                <strong style={{ display: 'block', color: '#A5ECEB', marginBottom: '2px' }}>
                  Assistant status: Pending
                </strong>
                <span style={{ color: '#cbd5e1' }}>{pendingNotice}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  className="w-4 h-4 text-[#A5ECEB]"
                  style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070d14',
                    border: '1px solid rgba(165, 236, 235, 0.25)',
                    borderRadius: '12px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    color: '#f0fdfa',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  placeholder="name@hospital.org"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label htmlFor="login-password" style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  className="w-4 h-4 text-[#A5ECEB]"
                  style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070d14',
                    border: '1px solid rgba(165, 236, 235, 0.25)',
                    borderRadius: '12px',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '14px',
                    color: '#f0fdfa',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#070d14',
                backgroundColor: '#A5ECEB',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                boxShadow: '0 0 20px rgba(165, 236, 235, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" strokeWidth={2.5} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom redirection */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(165, 236, 235, 0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                style={{ color: '#A5ECEB', fontWeight: 600, textDecoration: 'none', marginLeft: '4px' }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── Minimal Footer ── */}
      <footer style={{ width: '100%', textAlign: 'center', zIndex: 10, padding: '16px', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, margin: 0 }}>
          Asclepia Medical Systems &bull; Secure Encrypted Access
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070d14] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#A5ECEB] animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

