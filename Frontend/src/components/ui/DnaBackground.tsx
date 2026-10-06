'use client';

import Image from 'next/image';

interface DnaBackgroundProps {
  opacity?: number;
  className?: string;
}

export default function DnaBackground({
  opacity = 0.14,
  className = '',
}: DnaBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* ── ELEMENT 1: DNA HELIX (Spans Upper-Right across Top & Right Screen) ── */}
      <div
        className="dna-traverse-animated absolute top-[-2%] right-[5%] w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] lg:w-[540px] lg:h-[540px]"
        style={{ opacity }}
      >
        <Image
          src="/dna-helix.png"
          alt="Asclepia DNA Helix Background Animation"
          width={540}
          height={540}
          priority
          className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(165,236,235,0.4)]"
        />
      </div>

      {/* ── ELEMENT 2: CELLULAR / VIRUS SPHERE (Spans Lower-Left across Bottom & Left Screen) ── */}
      <div
        className="cell-traverse-animated absolute bottom-[-4%] left-[2%] w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px]"
        style={{
          opacity: opacity * 1.1,
          WebkitMaskImage: 'radial-gradient(circle, black 40%, rgba(0,0,0,0.65) 58%, transparent 72%)',
          maskImage: 'radial-gradient(circle, black 40%, rgba(0,0,0,0.65) 58%, transparent 72%)',
        }}
      >
        <Image
          src="/cell-microscope.jpg"
          alt="Asclepia Microscopic Cellular Background Animation"
          width={500}
          height={500}
          priority
          className="w-full h-full object-cover rounded-full filter drop-shadow-[0_0_40px_rgba(165,236,235,0.45)]"
        />
      </div>

      {/* Soft Ambient Radial Light Accents */}
      <div
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(165,236,235,0.035) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(125,253,240,0.03) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

