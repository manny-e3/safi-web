import React from 'react';
import { Shield, Check, ArrowRight } from 'lucide-react';

export default function SafiSuccessScreen({
  totalBalance,
  spendAllocation,
  cycleFrequency,
  governanceMode,
  cardBehaviour,
  onNavigate,
}) {
  const totalInc = Math.max(0, Math.floor(totalBalance || 0));
  const safeSpendAllocation = Math.min(totalInc, Math.max(0, spendAllocation));
  const protectedSum = Math.max(0, totalInc - safeSpendAllocation);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        {/* Shield Outline Checkmark Icon */}
        <div className="safi-success-icon-wrap">
          <div className="safi-shield-badge">
            <Shield size={42} color="#10B981" />
            <div className="safi-shield-check-small">
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </div>
          </div>
        </div>

        <h1 className="safi-serif-title" style={{ textAlign: 'center', fontSize: '26px' }}>
          🎉 Welcome to SAFI
        </h1>
        <p className="safi-screen-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
          Your Financial Cycle has started.
        </p>

        {/* Your Setup Card */}
        <div className="safi-card-box">
          <div className="safi-card-box-header">YOUR SETUP</div>

          <div className="safi-setup-table-row">
            <span className="safi-setup-label">Financial Cycle</span>
            <span className="safi-setup-val">{cycleFrequency || 'Monthly'}</span>
          </div>

          <div className="safi-setup-table-row">
            <span className="safi-setup-label">Spend Pool</span>
            <span className="safi-setup-val">₦{safeSpendAllocation.toLocaleString()}</span>
          </div>

          <div className="safi-setup-table-row">
            <span className="safi-setup-label">Reserve</span>
            <span className="safi-setup-val" style={{ color: '#10B981', fontWeight: 'bold' }}>
              ₦{protectedSum.toLocaleString()}
            </span>
          </div>

          <div className="safi-setup-table-row">
            <span className="safi-setup-label">Mode</span>
            <span className="safi-setup-val">{governanceMode || 'Flexible'} Mode</span>
          </div>

          <div className="safi-setup-table-row">
            <span className="safi-setup-label">Card Protection</span>
            <span className="safi-setup-val">{cardBehaviour || 'Hard Decline'}</span>
          </div>
        </div>

        {/* What's Next? Card */}
        <div className="safi-card-box">
          <div className="safi-card-box-header">WHAT'S NEXT?</div>

          <div className="safi-bullet-item">
            <span className="safi-green-dot">•</span>
            <span>Track your Safe Spend.</span>
          </div>

          <div className="safi-bullet-item">
            <span className="safi-green-dot">•</span>
            <span>Monitor your Spend Pace.</span>
          </div>

          <div className="safi-bullet-item">
            <span className="safi-green-dot">•</span>
            <span>Complete your Financial Cycle.</span>
          </div>

          <div className="safi-bullet-item">
            <span className="safi-green-dot">•</span>
            <span>Build your Behaviour Score.</span>
          </div>
        </div>
      </div>

      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={() => onNavigate('dashboard')}
          id="safi-goto-dashboard-btn"
        >
          <span>Go to Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
