'use client';

import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

// ─── Inline animated recreation of the Asclepia logo ─────────────────────────
function AsclepiaLogo() {
  const C = '#A5ECEB';   // brand teal (matches the actual logo color)
  const BG = '#080c10';  // page background (used for the notch mask)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ambient glow behind logo */}
      <div style={{
        position: 'absolute',
        width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(165,236,235,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'glowPulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <svg
        viewBox="0 0 330 400"
        width="300"
        height="364"
        style={{
          animation: 'logoFloat 4s ease-in-out infinite',
          filter: 'drop-shadow(0 0 18px rgba(165,236,235,0.22))',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Phone frame ── */}
        <rect
          x="88" y="22" width="148" height="252"
          rx="23" ry="23"
          fill="none"
          stroke={C} strokeWidth="6.5"
          filter="url(#glow)"
        />

        {/* Notch mask — hides top edge stroke to carve out space */}
        <rect x="124" y="15" width="76" height="18" fill={BG} />

        {/* Notch pill */}
        <rect
          x="132" y="17" width="60" height="14"
          rx="7" ry="7"
          fill="none"
          stroke={C} strokeWidth="4.5"
          filter="url(#glow)"
        />

        {/* ── ECG / Heartbeat line ──
            Enters left of phone, QRS spike inside phone, exits to heart on right */}
        <path
          d="M 32,147  L 112,147  L 126,114  L 148,183  L 166,108  L 183,147  L 260,147"
          fill="none"
          stroke={C}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#strongGlow)"
          pathLength="1"
          style={{
            strokeDasharray: '1',
            strokeDashoffset: '1',
            animation: 'ecgDraw 3s ease-in-out infinite',
          }}
        />

        {/* Node dot — left anchor of ECG */}
        <circle
          cx="32" cy="147" r="7.5"
          fill={C}
          filter="url(#strongGlow)"
          style={{ animation: 'nodeBlink 3s ease-in-out infinite' }}
        />

        {/* ── Heart — right end of ECG ──
            Using transform-box + transform-origin on a <g> for proper center-scale */}
        <g
          filter="url(#strongGlow)"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: 'heartbeat 1.8s ease-in-out infinite',
          }}
        >
          {/* Standard cubic-bezier heart, centered at (268, 137), size ~17px radius */}
          <path
            transform="translate(268, 137)"
            d="
              M 0,-10
              C 0,-10  8,-18  17,-11
              C 26,-4   17,9    0,22
              C -17,9  -26,-4  -17,-11
              C -8,-18   0,-10  0,-10
              Z
            "
            fill={C}
          />
        </g>

        {/* ── ASCLEPIA text ── */}
        <text
          x="162" y="328"
          textAnchor="middle"
          fill={C}
          fontSize="25"
          fontWeight="700"
          letterSpacing="10"
          fontFamily="'Inter', 'Plus Jakarta Sans', system-ui, sans-serif"
          filter="url(#glow)"
          style={{ animation: 'fadeInText 1.2s 0.3s ease-out both' }}
        >
          ASCLEPIA
        </text>
      </svg>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c10',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Very subtle background radial */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(165,236,235,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* ── Centered content ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0', position: 'relative', zIndex: 1,
        animation: 'fadeInUp 0.6s ease-out both',
      }}>

        {/* Animated logo */}
        <AsclepiaLogo />

        {/* Tagline — small, under logo */}
        <p style={{
          fontSize: '11px',
          color: 'rgba(165,236,235,0.4)',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          marginTop: '-12px',
          marginBottom: '40px',
          animation: 'fadeInUp 0.6s 0.4s ease-out both',
          fontWeight: 500,
        }}>
          Clinical Operations Portal
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: '12px',
          animation: 'fadeInUp 0.6s 0.6s ease-out both',
        }}>
          <Link
            href="/login"
            id="hero-signin-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 30px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 600,
              color: '#080c10',
              background: '#A5ECEB',
              textDecoration: 'none',
              border: '1px solid transparent',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(165,236,235,0.45)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <LogIn size={15} strokeWidth={2.5} />
            Sign In
          </Link>

          <Link
            href="/register"
            id="hero-signup-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 30px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 600,
              color: '#A5ECEB',
              background: 'transparent',
              textDecoration: 'none',
              border: '1.5px solid rgba(165,236,235,0.3)',
              transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(165,236,235,0.7)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(165,236,235,0.06)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(165,236,235,0.3)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <UserPlus size={15} strokeWidth={2.5} />
            Sign Up
          </Link>
        </div>
      </div>

      {/* ── All keyframe animations ── */}
      <style>{`
        /* Logo gentle float */
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }

        /* ECG line draws left→right, holds, fades, resets */
        @keyframes ecgDraw {
          0%        { stroke-dashoffset: 1; opacity: 0; }
          4%        { opacity: 1; }
          58%       { stroke-dashoffset: 0; opacity: 1; }
          78%       { stroke-dashoffset: 0; opacity: 1; }
          88%       { stroke-dashoffset: 0; opacity: 0; }
          93%       { stroke-dashoffset: 1; opacity: 0; }
          100%      { stroke-dashoffset: 1; opacity: 0; }
        }

        /* Heart double-beat  */
        @keyframes heartbeat {
          0%,  100% { transform: scale(1);    }
          14%        { transform: scale(1.32); }
          28%        { transform: scale(0.96); }
          42%        { transform: scale(1.22); }
          58%        { transform: scale(1);    }
        }

        /* Node dot blinks in sync with ECG reset */
        @keyframes nodeBlink {
          0%, 87% { opacity: 1; }
          90%, 95% { opacity: 0; }
          100%     { opacity: 1; }
        }

        /* Background glow breathes */
        @keyframes glowPulse {
          0%, 100% { opacity: 0.7; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.12); }
        }

        /* Text fade in */
        @keyframes fadeInText {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Page entry */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
