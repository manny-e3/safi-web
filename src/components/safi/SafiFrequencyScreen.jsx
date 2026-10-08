import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function SafiFrequencyScreen({
  cycleFrequency,
  setCycleFrequency,
  customDays,
  setCustomDays,
  totalBalance,
  setSpendAllocation,
  onNavigate,
}) {
  const options = ['Weekly', 'Biweekly', 'Monthly', 'Custom'];

  const handleContinue = () => {
    if (cycleFrequency === 'Custom') {
      const days = parseInt(customDays, 10);
      if (!days || days < 1) {
        alert('Please enter a valid number of days (at least 1 day) for your custom cycle.');
        return;
      }
    }
    const val = Math.floor(totalBalance || 0);
    // As in Nova: default spend allocation is 65% of available balance
    setSpendAllocation(Math.round(val * 0.65));
    onNavigate('safi_split');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <h1 className="safi-serif-title" style={{ fontSize: '26px' }}>
          Choose your Financial Cycle.
        </h1>
        <p className="safi-screen-subtitle">
          This determines how often SAFI resets your Spend Pool and tracks your progress.
        </p>

        {/* 2x2 Grid of Frequency Options */}
        <div className="safi-grid-2x2">
          {options.map((opt) => {
            const isActive = cycleFrequency === opt;
            return (
              <button
                key={opt}
                className={`safi-option-card-btn ${isActive ? 'active' : ''}`}
                onClick={() => setCycleFrequency(opt)}
                type="button"
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Custom Days Input field */}
        {cycleFrequency === 'Custom' && (
          <div className="safi-custom-days-wrapper">
            <div className="safi-custom-days-label">Enter cycle duration (in days):</div>
            <div className="safi-custom-input-box">
              <input
                className="safi-custom-input"
                type="number"
                min="1"
                max="365"
                value={customDays || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setCustomDays(val ? parseInt(val, 10) : '');
                }}
                placeholder="e.g. 15"
              />
              <span className="safi-input-suffix">Days</span>
            </div>
          </div>
        )}
      </div>

      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={handleContinue}
          id="safi-frequency-next-btn"
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
