import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { BACKEND_URL } from '../../config/api';

interface CreditScoreFactor {
  score: number;
  weight: number;
  label: string;
}

interface CreditScoreData {
  score: number;
  factors: {
    repaymentHistory: CreditScoreFactor;
    creditUtilization: CreditScoreFactor;
    accountAge: CreditScoreFactor;
  };
  breakdown: string;
}

interface CreditScoreRingProps {
  wallet: string;
  size?: number;
}

function scoreToColor(score: number): string {
  if (score < 30) return '#ef4444';
  if (score < 50) return '#f97316';
  if (score < 65) return '#facc15';
  if (score < 80) return '#84cc16';
  return '#22c55e';
}

function scoreLabel(score: number): string {
  if (score < 30) return 'Poor';
  if (score < 50) return 'Fair';
  if (score < 65) return 'Good';
  if (score < 80) return 'Very Good';
  return 'Excellent';
}

const FACTOR_ICONS: Record<string, React.ReactNode> = {
  repaymentHistory: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  creditUtilization: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  accountAge: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

const FACTOR_NAMES: Record<string, string> = {
  repaymentHistory: 'Repayment',
  creditUtilization: 'Utilization',
  accountAge: 'Account Age',
};

interface TooltipPortalProps {
  anchorRef: React.RefObject<HTMLDivElement>;
  data: CreditScoreData;
  score: number;
  color: string;
  onClose: () => void;
}

const TooltipPortal: React.FC<TooltipPortalProps> = ({ anchorRef, data, score, color, onClose }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.top + window.scrollY - 8,   // above the ring
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  const panel = (
    <div
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(5, 12, 28, 0.98)',
        border: `1px solid ${color}55`,
        borderRadius: '14px',
        padding: '1rem',
        width: '230px',
        zIndex: 99999,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${color}22`,
        animation: 'slideUp 0.15s ease-out',
        pointerEvents: 'auto',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: '12px',
        height: '12px',
        background: 'rgba(5, 12, 28, 0.98)',
        border: `1px solid ${color}55`,
        borderTop: 'none',
        borderLeft: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Credo Score
          </p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1 }}>
            {score} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/ 100</span>
          </p>
        </div>
        <span style={{
          background: `${color}1a`,
          border: `1px solid ${color}44`,
          color,
          borderRadius: '8px',
          padding: '4px 10px',
          fontSize: '0.7rem',
          fontWeight: 700,
        }}>
          {scoreLabel(score)}
        </span>
      </div>

      {/* Factor bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {Object.entries(data.factors).map(([key, factor]) => {
          const fc = scoreToColor(factor.score);
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 600 }}>
                  <span style={{ color: fc }}>{FACTOR_ICONS[key]}</span>
                  {FACTOR_NAMES[key]}
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>({Math.round(factor.weight * 100)}%)</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: fc }}>{factor.score}</span>
              </div>
              <div style={{ height: '4px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${factor.score}%`,
                  borderRadius: '100px',
                  background: fc,
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{factor.label}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown */}
      <p style={{
        margin: '0.75rem 0 0',
        paddingTop: '0.625rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.62rem',
        color: 'rgba(255,255,255,0.28)',
        lineHeight: 1.5,
      }}>
        {data.breakdown}
      </p>
    </div>
  );

  return ReactDOM.createPortal(panel, document.body);
};

// ─────────────────────────────────────────────────────────────────────────────

const CreditScoreRing: React.FC<CreditScoreRingProps> = ({ wallet, size = 72 }) => {
  const [data, setData] = useState<CreditScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    fetch(`${BACKEND_URL}/credit-score/${wallet}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        let start = 0;
        const end = d.score;
        const step = Math.max(1, Math.ceil(end / 30));
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setAnimatedScore(end); clearInterval(timer); }
          else setAnimatedScore(start);
        }, 30);
        return () => clearInterval(timer);
      })
      .catch(() => setLoading(false));
  }, [wallet]);

  if (!wallet) return null;

  const radius = (size - 10) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.1;
  const circumference = 2 * Math.PI * radius;
  const score = data?.score ?? 0;
  const color = scoreToColor(score);
  const dashOffset = circumference * (1 - score / 100);

  if (loading) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: size * 0.45, height: size * 0.45,
          border: '2px solid rgba(255,255,255,0.08)',
          borderTop: '2px solid rgba(255,255,255,0.35)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div ref={ringRef} style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
      onClick={() => setShowTooltip(v => !v)}
      title={`Credit Score: ${score}/100 — click for details`}
    >
      {/* SVG Ring */}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease',
            filter: `drop-shadow(0 0 ${Math.round(size * 0.07)}px ${color}88)`,
          }}
        />
      </svg>

      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{animatedScore}</span>
        <span style={{ fontSize: size * 0.13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>/ 100</span>
      </div>

      {/* Portal tooltip — renders at document.body so it's never clipped */}
      {showTooltip && data && (
        <TooltipPortal
          anchorRef={ringRef}
          data={data}
          score={score}
          color={color}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  );
};

export default CreditScoreRing;
