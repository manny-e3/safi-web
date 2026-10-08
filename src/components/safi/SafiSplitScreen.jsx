import React, { useRef } from 'react';
import { ArrowRight, Calendar } from 'lucide-react';

export default function SafiSplitScreen({
  totalBalance,
  spendAllocation,
  setSpendAllocation,
  cycleFrequency,
  customDays,
  onNavigate,
}) {
  const totalInc = Math.max(0, Math.floor(totalBalance || 0));
  const safeSpendAllocation = Math.min(totalInc, Math.max(0, spendAllocation));
  const protectedSum = Math.max(0, totalInc - safeSpendAllocation);

  const getCycleDays = () => {
    switch (cycleFrequency) {
      case 'Weekly': return 7;
      case 'Biweekly': return 14;
      case 'Monthly': return 30;
      case 'Custom': return Math.max(1, parseInt(customDays, 10) || 1);
      default: return 30;
    }
  };

  const days = getCycleDays();
  const dailyRate = Math.round(safeSpendAllocation / days);
  const pct = totalInc > 0 ? (safeSpendAllocation / totalInc) * 100 : 50;

  const trackRef = useRef(null);

  const handleTrackClick = (e) => {
    if (!trackRef.current || totalInc <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(1, clickX / rect.width));
    const rawVal = newPct * totalInc;
    const rounded = Math.round(rawVal / 1000) * 1000;
    setSpendAllocation(Math.min(totalInc, Math.max(0, rounded)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <h1 className="safi-serif-title" style={{ fontSize: '24px' }}>
          How much do you plan to spend this Financial Cycle?
        </h1>
        <p className="safi-screen-subtitle">
          Available Balance: <strong style={{ color: '#FFFFFF' }}>₦{totalInc.toLocaleString()}</strong>
        </p>

        {/* Side-by-side Cards */}
        <div className="safi-split-cards-row">
          <div className="safi-split-card-allocated">
            <div className="safi-split-card-label">SPEND POOL</div>
            <div className="safi-split-card-val">₦{safeSpendAllocation.toLocaleString()}</div>
          </div>
          <div className="safi-split-card-protected">
            <div className="safi-split-card-label" style={{ color: '#10B981' }}>RESERVE</div>
            <div className="safi-split-card-val" style={{ color: '#10B981' }}>
              ₦{protectedSum.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dual Color Slider */}
        <div className="safi-slider-container">
          <div
            ref={trackRef}
            className="safi-dual-track"
            onClick={handleTrackClick}
          >
            <div
              className="safi-track-fill-blue"
              style={{ width: `${pct}%` }}
            />
            <div
              className="safi-track-fill-green"
              style={{ left: `${pct}%`, width: `${100 - pct}%` }}
            />
            <div
              className="safi-slider-thumb"
              style={{ left: `${Math.min(96, Math.max(4, pct))}%` }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: '#081426' }} />
            </div>
          </div>

          <div className="safi-slider-labels-row">
            <span>₦0</span>
            <span style={{ color: '#10B981', fontWeight: 'bold' }}>{Math.round(pct)}% Spendable</span>
            <span>₦{totalInc.toLocaleString()}</span>
          </div>
        </div>

        {/* Native range input for accessible dragging */}
        <input
          type="range"
          min="0"
          max={totalInc}
          step="500"
          value={safeSpendAllocation}
          onChange={(e) => setSpendAllocation(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#10B981',
            cursor: 'pointer',
            marginTop: '-10px',
            marginBottom: '16px',
            opacity: 0.8,
          }}
        />

        {/* Daily rate info box */}
        <div className="safi-advice-card">
          <Calendar size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            Your Safe Spend is approximately{' '}
            <strong style={{ color: '#FFFFFF' }}>₦{dailyRate.toLocaleString()} per day</strong> for
            this Financial Cycle ({days} days).
          </div>
        </div>
      </div>

      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={() => onNavigate('safi_mode')}
          id="safi-split-next-btn"
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
