import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';

export default function SafiWelcomeScreen({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        {/* Title & Description */}
        <h1 className="safi-serif-title">
          Plan this<br />Financial <span className="italic-green">Cycle.</span>
        </h1>
        <p className="safi-screen-subtitle">
          Choose how much you plan to spend. SAFI helps you complete your Financial Cycle without touching your Reserve.
        </p>

        {/* Split visualization boxes */}
        <div className="safi-visual-boxes-row">
          <div className="safi-visual-box-allocated">
            <div className="safi-visual-box-value">Spend Pool</div>
            <div className="safi-visual-box-subtext">Money you plan to spend.</div>
          </div>
          <span className="safi-visual-box-plus">+</span>
          <div className="safi-visual-box-protected">
            <div className="safi-visual-box-value" style={{ color: '#10B981' }}>Reserve</div>
            <div className="safi-visual-box-subtext">Money you want to protect.</div>
          </div>
        </div>

        {/* Reassurance Badge */}
        <div className="safi-reassurance-box">
          <Lock size={16} color="#10B981" />
          <span>Your money always stays in your bank account.</span>
        </div>
      </div>

      {/* Bottom Get Started Button */}
      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={() => onNavigate('safi_frequency')}
          id="safi-welcome-next-btn"
        >
          <span>Build My Spend Pool</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
