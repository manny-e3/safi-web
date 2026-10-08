import React from 'react';
import { Layers, CheckCircle2, ArrowLeftRight, Plus } from 'lucide-react';

export default function NavigationBanner({
  currentView,
  setCurrentView,
  onOpenTransfer,
  onOpenFund,
}) {
  const views = [
    { id: 'meridian', label: '1. Meridian Dashboard' },
    { id: 'safi_dashboard', label: '2. SAFI Core' },
    { id: 'wizard_step1', label: '3. Allocation Wizard' },
    { id: 'wizard_step2', label: '4. Governance Mode' },
    { id: 'transactions', label: '5. Transactions Page' },
    { id: 'auth', label: '6. Auth Pages (Login/Register)' },
  ];

  const isAuthActive = ['auth', 'login', 'register', 'forgot_password', 'reset_password'].includes(currentView);

  return (
    <div className="demo-switcher-banner">
      <div className="demo-title">
        <Layers size={16} color="#2DD4BF" />
        <span>Meridian & SAFI Suite</span>
        <span className="badge">Active SPA</span>
      </div>

      <div className="demo-nav-tabs">
        {views.map((v) => {
          const isActive = v.id === 'auth' ? isAuthActive : currentView === v.id;
          return (
            <button
              key={v.id}
              className={`demo-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(v.id === 'auth' ? 'auth' : v.id)}
            >
              {isActive && <CheckCircle2 size={13} />}
              {v.label}
            </button>
          );
        })}

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }}></div>

        {/* Instant Action Triggers */}
        <button
          className="demo-action-btn"
          onClick={onOpenFund}
          title="Open Fund Account modal"
        >
          <Plus size={14} />
          <span>Fund Account</span>
        </button>
        <button
          className="demo-action-btn secondary"
          onClick={onOpenTransfer}
          title="Open Transfer Funds modal"
        >
          <ArrowLeftRight size={14} />
          <span>Transfer Funds</span>
        </button>
      </div>
    </div>
  );
}
