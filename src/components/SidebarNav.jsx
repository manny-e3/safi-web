import React from 'react';
import {
  LayoutGrid,
  Landmark,
  Shield,
  Receipt,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

/**
 * Reusable Sidebar Navigation Component for Meridian Bank
 * Supports dynamic active state, SAFI third-party configuration status,
 * and responsive mobile off-canvas drawer navigation.
 */
export default function SidebarNav({
  activeNav = 'dashboard',
  isSafiConfigured = false,
  safiConfig = null,
  isOpen = false,
  onClose = () => { },
  onNavigate = () => { },
  onOpenTransfer = () => { },
  onLogout = () => { },
}) {
  const isConfigured = Boolean(isSafiConfigured || (safiConfig && safiConfig.accountNumber));

  const handleNavClick = (view) => {
    onNavigate(view);
    if (onClose) onClose();
  };

  const handleTransferClick = () => {
    onOpenTransfer();
    if (onClose) onClose();
  };

  const handleLogoutClick = () => {
    if (onClose) onClose();
    if (onLogout) onLogout();
    else onNavigate('login');
  };

  return (
    <>
      {/* Mobile Semi-Transparent Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
        <div>
          {/* Brand Header */}
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h10M4 18h16" stroke="#0B132B" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="brand-text">
              <h2>Meridian Bank</h2>
              <p>Institutional Digital</p>
            </div>
            {/* Mobile Close Button */}
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-link ${activeNav === 'dashboard' || activeNav === 'meridian' ? 'active-meridian' : ''}`}
              onClick={() => handleNavClick('meridian')}
              title="Institutional Treasury Dashboard"
            >
              <LayoutGrid size={18} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeNav === 'accounts' ? 'active-meridian' : ''}`}
              onClick={() => handleNavClick('meridian')}
              title="Overview of Institutional Accounts"
            >
              <Landmark size={18} />
              <span>Accounts</span>
            </button>

            {/* <button
              type="button"
              className={`sidebar-link ${activeNav === 'safi' || activeNav === 'safi_dashboard' ? 'active-meridian' : ''}`}
              onClick={() => handleNavClick(isConfigured ? 'safi_dashboard' : 'wizard')}
              title={isConfigured ? 'Open SAFI Protection Governance Portal' : 'Configure Optional SAFI Protection'}
            >
              <Shield size={18} />
              <span>SAFI Protection</span>
              {!isConfigured && (
                <span
                  style={{
                    fontSize: '10px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginLeft: 'auto',
                    fontWeight: 600,
                  }}
                >
                  Optional
                </span>
              )}
            </button> */}

            <button
              type="button"
              className={`sidebar-link ${activeNav === 'payments' ? 'active-meridian' : ''}`}
              onClick={handleTransferClick}
              title="Send Outbound Wire Transfer"
            >
              <Receipt size={18} />
              <span>Payments</span>
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeNav === 'statements' || activeNav === 'transactions' ? 'active-meridian' : ''}`}
              onClick={() => handleNavClick('transactions')}
              title="Comprehensive Transaction Ledger & Statements"
            >
              <FileText size={18} />
              <span>Statements</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className={`sidebar-link ${activeNav === 'settings' ? 'active-meridian' : ''}`}
            onClick={() => handleNavClick('wizard')}
            title="Institutional Rules & Parameters"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          {/* SAFI Protocol Status Card in Sidebar */}
          <div
            className="sidebar-protocol-card"
            style={{
              background: isConfigured ? 'rgba(13, 148, 136, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: isConfigured ? 'rgba(13, 148, 136, 0.22)' : 'rgba(255, 255, 255, 0.08)',
              cursor: isConfigured ? 'default' : 'pointer',
            }}
            onClick={!isConfigured ? () => handleNavClick('wizard') : undefined}
            title={!isConfigured ? 'Click to configure optional SAFI protection' : undefined}
          >
            <div
              className="sidebar-protocol-icon"
              style={{
                background: isConfigured ? 'rgba(13, 148, 136, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                color: isConfigured ? '#2DD4BF' : '#94A3B8',
              }}
            >
              <Shield size={16} />
            </div>
            <div className="sidebar-protocol-info">
              <span className="sidebar-protocol-title" style={{ color: isConfigured ? '#2DD4BF' : '#E2E8F0' }}>
                SAFI Protocol
              </span>
              <span className="sidebar-protocol-status">
                {isConfigured ? 'Active • Monitored' : 'Optional • Inactive'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogoutClick}
            title="Sign Out of Session"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
