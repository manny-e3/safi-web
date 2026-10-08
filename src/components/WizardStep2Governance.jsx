import React from 'react';
import {
  Shield,
  X,
  Check,
  CheckCircle2,
  Clock,
  Sliders,
  Info,
} from 'lucide-react';

export default function WizardStep2Governance({
  selectedMode,
  setSelectedMode,
  onNavigate,
}) {
  const steps = [
    { num: 1, title: 'Step 1', subtitle: 'Basic Details', status: 'completed' },
    { num: 2, title: 'Step 2', subtitle: 'Governance Mode', status: 'active' },
    { num: 3, title: 'Step 3', subtitle: 'Approval Chains', status: 'inactive' },
    { num: 4, title: 'Step 4', subtitle: 'Review & Deploy', status: 'inactive' },
  ];

  const handleComplete = () => {
    // Return to SAFI Core dashboard with updated mode
    onNavigate('safi_dashboard');
  };

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
          <div className="stepper-header">CONFIGURATION WIZARD</div>
          <div className="stepper-timeline">
            {steps.map((s) => (
              <div key={s.num} className="stepper-step">
                <div
                  className={`step-indicator ${
                    s.status === 'completed'
                      ? 'completed'
                      : s.status === 'active'
                      ? 'active'
                      : 'inactive'
                  }`}
                >
                  {s.status === 'completed' ? (
                    <Check size={14} strokeWidth={3} />
                  ) : s.status === 'active' ? (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'block',
                      }}
                    ></span>
                  ) : (
                    ''
                  )}
                </div>
                <div className="step-text">
                  <div
                    className={`step-title ${
                      s.status === 'inactive' ? 'inactive' : ''
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="step-subtitle">{s.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Column */}
        <div className="wizard-content-col">
          <h1 className="wizard-main-heading" style={{ fontSize: '26px' }}>
            Select your allocation governance mode
          </h1>
          <p className="wizard-subtitle">
            Configures how allocation rules are enforced at the transaction layer.
          </p>

          {/* Selectable Governance Cards */}
          <div className="governance-cards-container">
            {/* Card 1: Flexible */}
            <div
              className={`gov-card ${selectedMode === 'Flexible' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('Flexible')}
            >
              {selectedMode === 'Flexible' && (
                <div className="gov-card-check">
                  <CheckCircle2 size={22} color="#0F172A" />
                </div>
              )}
              <div className="gov-card-top">
                <div className="gov-icon-box">
                  <Clock size={20} />
                </div>
                <div className="gov-card-info">
                  <div className="gov-card-title-row">
                    <span className="gov-card-title">Flexible</span>
                  </div>
                  <p className="gov-card-desc">
                    A 5-second pause before accessing protected funds. Best for most people.
                  </p>
                  <div className="gov-notice-box">
                    <Info size={15} />
                    <span>Standard velocity checks apply.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Strict */}
            <div
              className={`gov-card ${selectedMode === 'Strict' ? 'selected' : ''}`}
              onClick={() => setSelectedMode('Strict')}
            >
              {selectedMode === 'Strict' && (
                <div className="gov-card-check">
                  <CheckCircle2 size={22} color="#0F172A" />
                </div>
              )}
              <div className="gov-card-top">
                <div className="gov-icon-box teal">
                  <Sliders size={20} />
                </div>
                <div className="gov-card-info">
                  <div className="gov-card-title-row">
                    <span className="gov-card-title">Strict</span>
                    <span className="badge-max-protection">Maximum Protection</span>
                  </div>
                  <p className="gov-card-desc">
                    Daily sub-limits within cycle total. Hard limits per day. Maximum enforcement.
                  </p>
                  <div className="gov-metrics-split">
                    <div className="gov-metric-item">
                      <span className="gov-metric-label">Max Daily Limit</span>
                      <span className="gov-metric-value">$50,000</span>
                    </div>
                    <div className="gov-metric-item">
                      <span className="gov-metric-label">Approval Reqs</span>
                      <span className="gov-metric-value">Multi-party</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="wizard-bottom-bar">
            <button
              className="btn-wizard-back"
              onClick={() => onNavigate('wizard_step1')}
            >
              Back
            </button>
            <button
              className="btn-wizard-next"
              onClick={handleComplete}
            >
              Continue to Step 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
