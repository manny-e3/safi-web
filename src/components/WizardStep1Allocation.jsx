import React from 'react';
import { Shield, ShieldCheck, X, ArrowRight } from 'lucide-react';

export default function WizardStep1Allocation({
  spendAmount,
  setSpendAmount,
  onNavigate,
}) {
  const maxFunds = 247850;
  const protectedSum = maxFunds - spendAmount;
  const isSafe = spendAmount <= maxFunds * 0.8;

  const handleSliderChange = (e) => {
    setSpendAmount(Number(e.target.value));
  };

  const steps = [
    { num: 1, title: 'Allocation', subtitle: 'Set spend limits', active: true },
    { num: 2, title: 'Governance Mode', subtitle: '', active: false },
    { num: 3, title: 'Card Behaviour', subtitle: '', active: false },
    { num: 4, title: 'Cycle', subtitle: '', active: false },
    { num: 5, title: 'Review', subtitle: '', active: false },
    { num: 6, title: 'Activate', subtitle: '', active: false },
  ];

  return (
    <div className="wizard-page">
      {/* Top Header */}
      <div className="wizard-top-bar">
        <div className="wizard-brand">
          <Shield size={20} color="#0F172A" />
          <span>SAFI Core</span>
        </div>
        <button
          className="save-exit-btn"
          onClick={() => onNavigate('safi_dashboard')}
        >
          <span>Save & Exit</span>
          <X size={16} />
        </button>
      </div>

      {/* Main Wizard Area */}
      <div className="wizard-body">
        {/* Left Stepper */}
        <div className="wizard-stepper-col">
          <div className="stepper-header">CONFIGURATION SETUP</div>
          <div className="stepper-timeline">
            {steps.map((s) => (
              <div key={s.num} className="stepper-step">
                <div
                  className={`step-indicator ${
                    s.active ? 'active' : 'inactive'
                  }`}
                >
                  {s.num}
                </div>
                <div className="step-text">
                  <div className={`step-title ${!s.active ? 'inactive' : ''}`}>
                    {s.title}
                  </div>
                  {s.subtitle && (
                    <div className="step-subtitle">{s.subtitle}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Column */}
        <div className="wizard-content-col">
          <span className="wizard-step-label">Step 1 of 6</span>
          <h1 className="wizard-main-heading">
            How much do you want to spend this cycle?
          </h1>

          <div className="wizard-pill-banner">
            <Shield size={15} />
            <span>Everything else is protected automatically</span>
          </div>

          {/* Interactive Card */}
          <div className="wizard-box-card">
            {/* Currency and Amount */}
            <div className="interactive-spend-display">
              <span className="currency-symbol">₦</span>
              <span className="spend-amount-number">
                {spendAmount.toLocaleString()}
              </span>
            </div>

            {/* Slider */}
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max={maxFunds}
                step="500"
                value={spendAmount}
                onChange={handleSliderChange}
                className="spend-range-input"
                style={{
                  background: `linear-gradient(to right, #0F172A 0%, #0F172A ${
                    (spendAmount / maxFunds) * 100
                  }%, #E2E8F0 ${(spendAmount / maxFunds) * 100}%, #E2E8F0 100%)`,
                }}
              />
              <div className="slider-labels-row">
                <span>₦0</span>
                <span>₦{maxFunds.toLocaleString()} MAX</span>
              </div>
            </div>

            <div className="divider-line"></div>

            {/* 2 Summary Columns */}
            <div className="allocation-summary-cols">
              <div className="summary-col">
                <span className="summary-col-label">SPEND ALLOCATION</span>
                <span className="summary-col-val">
                  ₦{spendAmount.toLocaleString()}
                </span>
              </div>

              <div className="summary-col highlight-green">
                <span className="summary-col-label">PROTECTED SUM</span>
                <span className="summary-col-val">
                  ₦{protectedSum.toLocaleString()}
                </span>
                <Shield size={54} className="watermark-shield" />
              </div>
            </div>

            {/* Status Alert */}
            <div className="status-safe-card">
              <div className="status-icon-circle">
                <ShieldCheck size={20} />
              </div>
              <div className="status-text">
                <h4>Status: {isSafe ? 'Safe' : 'Caution - High Allocation'}</h4>
                <p>
                  {isSafe
                    ? 'This allocation aligns with your enterprise governance policies.'
                    : 'Spend allocation exceeds 80% threshold. Multi-party review will be requested.'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="wizard-bottom-bar">
            <button
              className="btn-wizard-cancel"
              onClick={() => onNavigate('safi_dashboard')}
            >
              Cancel
            </button>
            <button
              className="btn-wizard-next"
              onClick={() => onNavigate('wizard_step2')}
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
