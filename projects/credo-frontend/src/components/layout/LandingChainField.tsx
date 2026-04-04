import React from 'react';

function ChainLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M14 12c-3.3 0-6 2.7-6 6v4c0 3.3 2.7 6 6 6h2M26 12c3.3 0 6 2.7 6 6v4c0 3.3-2.7 6-6 6h-2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M18 20h4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="28" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="28" r="3.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BlockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="10" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="2" opacity="0.9" />
      <path d="M10 16h16M10 22h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <circle cx="28" cy="8" r="2" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

type WanderClass = `landing-float--w${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

interface Floater {
  wander: WanderClass;
  style: React.CSSProperties;
  kind: 'chain' | 'algo' | 'block' | 'txn';
  label?: string;
}

const FLOATERS: Floater[] = [
  { kind: 'algo', wander: 'landing-float--w1', style: { left: '4%', top: '6%', fontSize: 'clamp(0.65rem, 1.5vw, 0.95rem)' } },
  { kind: 'chain', wander: 'landing-float--w2', style: { left: '12%', top: '72%', width: 'clamp(28px, 4vw, 44px)' } },
  { kind: 'block', wander: 'landing-float--w3', style: { left: '78%', top: '8%', width: 'clamp(26px, 3.5vw, 40px)' } },
  { kind: 'algo', wander: 'landing-float--w4', style: { left: '88%', top: '42%', fontSize: 'clamp(0.6rem, 1.3vw, 0.85rem)' } },
  { kind: 'chain', wander: 'landing-float--w5', style: { left: '52%', top: '3%', width: 'clamp(24px, 3vw, 36px)' } },
  { kind: 'txn', wander: 'landing-float--w6', style: { left: '22%', top: '38%', fontSize: 'clamp(0.55rem, 1.1vw, 0.75rem)' } },
  { kind: 'block', wander: 'landing-float--w7', style: { left: '65%', top: '68%', width: 'clamp(30px, 4vw, 46px)' } },
  { kind: 'algo', wander: 'landing-float--w8', style: { left: '35%', top: '88%', fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)' } },
  { kind: 'chain', wander: 'landing-float--w1', style: { left: '92%', top: '78%', width: 'clamp(22px, 2.8vw, 34px)' } },
  { kind: 'txn', wander: 'landing-float--w3', style: { left: '6%', top: '48%', fontSize: 'clamp(0.5rem, 1vw, 0.7rem)' } },
  { kind: 'block', wander: 'landing-float--w5', style: { left: '44%', top: '52%', width: 'clamp(20px, 2.5vw, 32px)' } },
  { kind: 'algo', wander: 'landing-float--w7', style: { left: '70%', top: '28%', fontSize: 'clamp(0.62rem, 1.2vw, 0.8rem)' } },
  { kind: 'chain', wander: 'landing-float--w4', style: { left: '18%', top: '18%', width: 'clamp(26px, 3.2vw, 38px)' } },
  { kind: 'txn', wander: 'landing-float--w2', style: { left: '58%', top: '92%', fontSize: 'clamp(0.52rem, 1vw, 0.72rem)' } },
  { kind: 'algo', wander: 'landing-float--w6', style: { left: '48%', top: '22%', fontSize: 'clamp(0.58rem, 1.15vw, 0.78rem)' } },
  { kind: 'chain', wander: 'landing-float--w8', style: { left: '82%', top: '58%', width: 'clamp(28px, 3.6vw, 42px)' } },
];

const LandingChainField: React.FC = () => {
  return (
    <div className="landing-chain-field" aria-hidden>
      {FLOATERS.map((f, i) => {
        const base = `landing-float landing-float--base ${f.wander}`;
        if (f.kind === 'algo') {
          return (
            <span key={i} className={`${base} landing-float--algo`} style={f.style}>
              ALGO
            </span>
          );
        }
        if (f.kind === 'txn') {
          return (
            <span key={i} className={`${base} landing-float--txn`} style={f.style}>
              TX
            </span>
          );
        }
        if (f.kind === 'block') {
          return (
            <span key={i} className={`${base} landing-float--icon`} style={f.style}>
              <BlockIcon className="landing-float-svg" />
            </span>
          );
        }
        return (
          <span key={i} className={`${base} landing-float--icon`} style={f.style}>
            <ChainLinkIcon className="landing-float-svg" />
          </span>
        );
      })}
    </div>
  );
};

export default LandingChainField;
