'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Eye, EyeOff, Loader2, Lock, Mail, User, CheckCircle2, XCircle, UserPlus, ArrowRight, Home, Clock
} from 'lucide-react';
import AnimatedAsclepiaLogo from '@/components/AnimatedAsclepiaLogo';
import DnaBackground from '@/components/ui/DnaBackground';

function PasswordRequirement({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-[#7DFDF0]' : 'text-slate-500'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />}
      <span>{label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isAuthenticated, isLoading, admin } = useAuth();
  const router = useRouter();

  // Real-time password criteria
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };
  const allValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number digit.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await authApi.register({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      if (data.success) {
        setIsSuccess(true);
        toast.success(data.message || 'Assistant registration submitted successfully.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
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
            href="/login"
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
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Center Registration Modal / Card ── */}
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
            maxWidth: '450px',
            backgroundColor: 'rgba(11, 21, 31, 0.95)',
            border: '1px solid rgba(165, 236, 235, 0.2)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(165, 236, 235, 0.06)',
            backdropFilter: 'blur(20px)',
            boxSizing: 'border-box',
          }}
        >
          {isAuthenticated && !isSuccess ? (
            /* ── ALREADY SIGNED IN NOTICE ── */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0fdfa', margin: '0 0 8px' }}>
                You are already signed in
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>
                Signed in as <span style={{ color: '#A5ECEB', fontWeight: 600 }}>{admin?.email}</span>.
                Sign out to register a new assistant account.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  id="register-signout"
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('dt_token');
                    localStorage.removeItem('dt_admin');
                    window.location.replace('/register');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#070d14',
                    backgroundColor: '#A5ECEB',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign out and register
                </button>
                <button
                  id="register-go-dashboard"
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#f0fdfa',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(165, 236, 235, 0.25)',
                    cursor: 'pointer',
                  }}
                >
                  Back to dashboard
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* ── SUCCESS STATE: APPROVAL PENDING ── */
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(165, 236, 235, 0.12)',
                  border: '1px solid rgba(165, 236, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#A5ECEB',
                }}
              >
                <Clock className="w-8 h-8" />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(165, 236, 235, 0.12)',
                  border: '1px solid rgba(165, 236, 235, 0.3)',
                  color: '#A5ECEB',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span>Assistant status: Pending</span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0fdfa', margin: '0 0 8px' }}>
                Signup Request Pending
              </h2>

              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>
                Awaiting admin approval.
              </p>

              <Link
                href="/login?pending=1"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#070d14',
                  backgroundColor: '#A5ECEB',
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(165, 236, 235, 0.25)',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* ── REGISTRATION FORM ── */
            <>
              {/* Form Header */}
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(165, 236, 235, 0.15)',
                      border: '1px solid rgba(165, 236, 235, 0.3)',
                      color: '#A5ECEB',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Role: Assistant
                  </span>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f0fdfa', margin: 0 }}>
                  Assistant Registration
                </h1>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Create assistant account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label htmlFor="reg-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User
                      className="w-4 h-4 text-[#A5ECEB]"
                      style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      placeholder="e.g. Sarah Jenkins"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail
                      className="w-4 h-4 text-[#A5ECEB]"
                      style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <input
                      id="reg-email"
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
                      placeholder="assistant@hospital.org"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock
                      className="w-4 h-4 text-[#A5ECEB]"
                      style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <input
                      id="reg-password"
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
                      autoComplete="new-password"
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

                <div>
                  <label htmlFor="reg-confirm-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock
                      className="w-4 h-4 text-[#A5ECEB]"
                      style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }}
                    />
                    <input
                      id="reg-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
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
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Validation Checklist */}
                {password.length > 0 && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(7, 13, 20, 0.7)',
                      border: '1px solid rgba(165, 236, 235, 0.12)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '6px 12px',
                      marginTop: '-4px',
                    }}
                  >
                    <PasswordRequirement ok={rules.length} label="8+ characters" />
                    <PasswordRequirement ok={rules.uppercase} label="Uppercase letter" />
                    <PasswordRequirement ok={rules.number} label="Number digit" />
                    <PasswordRequirement ok={rules.match} label="Passwords match" />
                  </div>
                )}

                <button
                  id="register-submit"
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
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" strokeWidth={2.5} />
                      <span>Request Assistant Access</span>
                    </>
                  )}
                </button>
              </form>

              {/* Form Footer */}
              <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid rgba(165, 236, 235, 0.1)' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Already have an approved account?{' '}
                  <Link
                    href="/login"
                    style={{ color: '#A5ECEB', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          width: '100%',
          textAlign: 'center',
          padding: '18px 24px',
          boxSizing: 'border-box',
          fontSize: '11px',
          color: '#64748b',
          zIndex: 10,
        }}
      >
        <span>Asclepia Healthcare Systems &bull; Clinical Operations Platform</span>
      </footer>
    </div>
  );
}
