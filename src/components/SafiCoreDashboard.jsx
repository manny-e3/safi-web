import React, { useState, useEffect } from 'react';
import SidebarNav from './SidebarNav';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  LayoutGrid,
  Landmark,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  PiggyBank,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Lock,
  Search,
  Wallet,
  Sliders,
  Download,
  Info,
  Pencil,
  ArrowRight,
  LogOut,
  Pause,
  Play,
  Clock,
  Loader2,
  Calendar,
  AlertCircle,
  PlusCircle,
  Menu,
} from 'lucide-react';
import safiConfigService from '../services/safiConfigService';

export default function SafiCoreDashboard({
  onNavigate,
  totalBalance = 0,
  protectedFunds = 0,
  spendableFunds = 0,
  currentUser = null,
  wallet = null,
  safiConfig = null,
  onConfigChanged,
  onLogout,
}) {
  const [config, setConfig] = useState(safiConfig);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const accountNumber = wallet?.accountNumber;

  // Refresh config from backend
  const refreshConfig = async () => {
    if (!accountNumber) return;
    try {
      const [cfg, dash] = await Promise.all([
        safiConfigService.getConfig(accountNumber).catch(() => null),
        safiConfigService.getDashboard(accountNumber).catch(() => null),
      ]);
      setConfig(cfg);
      setDashboardData(dash);
      if (onConfigChanged && cfg) {
        onConfigChanged(cfg);
      }
    } catch (err) {
      console.warn('Error fetching SAFI dashboard:', err);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, [accountNumber]);

  // Sync prop changes
  useEffect(() => {
    if (safiConfig) {
      setConfig(safiConfig);
    }
  }, [safiConfig]);

  // Handle Pause / Resume toggle
  const handleTogglePause = async () => {
    if (!accountNumber || !config) return;
    setIsTogglingPause(true);
    setActionMessage('');

    try {
      if (config.isPaused) {
        await safiConfigService.resumeConfig(accountNumber);
        setActionMessage('SAFI Protocol Resumed. Rule enforcement is now active.');
      } else {
        await safiConfigService.pauseConfig(accountNumber);
        setActionMessage('SAFI Protocol Paused. Rule enforcement is temporarily suspended.');
      }
      await refreshConfig();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update protocol status.');
    } finally {
      setIsTogglingPause(false);
    }
  };

  const isConfigured = !!config;
  const isPaused = config?.isPaused || false;

  // Computed values
  const totalFunds = totalBalance;
  const rawIncome = config ? Number(config.income) : totalBalance;
  const rawProtected = config ? Number(config.protectedSum) : protectedFunds;
  const spendPool = Math.max(0, rawIncome - rawProtected);

  const protectedPercent = totalFunds > 0 ? (rawProtected / totalFunds) * 100 : 0;
  const spendablePercent = totalFunds > 0 ? (Math.max(0, totalFunds - rawProtected) / totalFunds) * 100 : 0;

  const modeDisplay = config?.governanceMode
    ? config.governanceMode.charAt(0).toUpperCase() + config.governanceMode.slice(1)
    : 'Flexible';

  const freqDisplay = config?.frequency
    ? config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)
    : 'Monthly';

  const cardPolicyDisplay = config?.cardBehaviour
    ? config.cardBehaviour === 'auto_cover'
      ? 'Auto Cover'
      : config.cardBehaviour === 'buffer'
      ? `Buffer (₦${Number(config.bufferAmount || 0).toLocaleString()})`
      : 'Hard Decline'
    : 'Hard Decline';

  const daysRemaining = dashboardData?.daysRemaining || 24;
  const safeDailySpend = dashboardData?.dailyRate
    ? Number(dashboardData.dailyRate)
    : Math.round(spendPool / (config?.customDays || 30));

  return (
    <div className="app-container">
      {/* Reusable Sidebar Navigation with Mobile Drawer */}
      <SidebarNav
        activeNav="safi"
        isSafiConfigured={isConfigured}
        safiConfig={config}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="top-header-title">SAFI Core Decision Layer</div>
          </div>
          <div className="header-actions">
            <div className="header-user-pill" title={currentUser?.email || 'Corporate Account'}>
              <div className="header-user-avatar">
                {(currentUser?.name || 'Alexander').charAt(0).toUpperCase()}
              </div>
              <div className="header-user-details">
                <span className="header-user-name">
                  {currentUser?.name || 'Alexander Wright'}
                </span>
                <span className="header-user-role">Institutional Tier</span>
              </div>
            </div>
            <button
              className="header-icon-btn"
              onClick={onLogout || (() => onNavigate('login'))}
              title="Sign Out of Session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {/* SAFI Header Section */}
          <div className="safi-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="safi-title-group">
              <Shield size={28} color="#0F172A" />
              <div className="safi-title-text">
                <h1>SAFI Governance</h1>
                <p>Deterministic mathematical control at the transaction source.</p>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isConfigured ? (
                <>
                  <div className={isPaused ? 'safi-active-badge paused' : 'safi-active-badge'} style={{ background: isPaused ? '#FEF3C7' : '#DCFCE7', color: isPaused ? '#B45309' : '#15803D' }}>
                    <span className="dot" style={{ background: isPaused ? '#F59E0B' : '#10B981' }}></span>
                    <span>{isPaused ? 'PROTOCOL PAUSED' : 'SAFI ACTIVE'}</span>
                  </div>

                  <button
                    onClick={handleTogglePause}
                    disabled={isTogglingPause}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isPaused ? '#059669' : '#D97706',
                      cursor: 'pointer',
                    }}
                  >
                    {isTogglingPause ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : isPaused ? (
                      <Play size={15} />
                    ) : (
                      <Pause size={15} />
                    )}
                    <span>{isPaused ? 'Resume Protocol' : 'Pause Protocol'}</span>
                  </button>

                  <button
                    onClick={() => onNavigate('wizard')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Sliders size={15} />
                    <span>Reconfigure</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigate('wizard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <PlusCircle size={18} />
                  <span>Configure SAFI Protocol</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Notification Alert */}
          {actionMessage && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#166534',
                fontSize: '13.5px',
                marginTop: '16px',
              }}
            >
              <ShieldCheck size={18} />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* If NOT Configured Banner */}
          {!isConfigured && (
            <div
              style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                border: '1.5px dashed #93C5FD',
                borderRadius: '16px',
                padding: '28px 32px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: '640px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D4ED8', fontWeight: 800, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <Shield size={16} />
                  <span>PROTECTION NOT ACTIVE</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  Your account currently operates without SAFI mathematical reserve protection.
                </h3>
                <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                  Activate SAFI to set your safe spend pool, lock in protected reserves, and prevent account balance depletion with automatic velocity assertions.
                </p>
              </div>
              <button
                onClick={() => onNavigate('wizard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>Launch Configuration Wizard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* 4-Metrics Row */}
          <div className="safi-metrics-row" style={{ marginTop: '24px' }}>
            {/* Spend Allocation / Spend Pool */}
            <div className="safi-card">
              <div className="safi-card-header">
                <span className="safi-card-label">SPEND POOL</span>
                <Wallet size={18} className="safi-card-icon" />
              </div>
              <div className="safi-card-body">
                <div className="safi-card-amount">₦ {spendPool.toLocaleString()}</div>
                <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  {freqDisplay} cycle allocation
                </span>
              </div>
            </div>

            {/* Protected Sum / Reserve */}
            <div className="safi-card dark-theme">
              <div className="safi-card-header">
                <span className="safi-card-label">PROTECTED RESERVE</span>
                <Lock size={18} className="safi-card-icon" />
              </div>
              <div className="safi-card-body">
                <div className="safi-card-amount">₦ {rawProtected.toLocaleString()}</div>
                <div className="protected-badge">
                  <Shield size={12} />
                  <span>Enforced</span>
                </div>
              </div>
            </div>

            {/* Safe Daily Spend Velocity */}
            <div className="safi-card">
              <div className="safi-card-header">
                <span className="safi-card-label">SAFE DAILY VELOCITY</span>
                <Clock size={18} className="safi-card-icon" />
              </div>
              <div className="safi-card-body">
                <div className="safi-card-amount" style={{ color: '#0F766E' }}>
                  ₦ {safeDailySpend.toLocaleString()}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}> / day</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  Recommended daily spend rate
                </span>
              </div>
            </div>

            {/* Protection Policy */}
            <div className="safi-card">
              <div className="safi-card-header">
                <span className="safi-card-label">GOVERNANCE & POLICY</span>
                <Sliders size={18} className="safi-card-icon" />
              </div>
              <div className="safi-card-body">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <div className="safi-card-amount" style={{ fontSize: '18px' }}>
                      {modeDisplay} Mode
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                      Policy: {cardPolicyDisplay}
                    </span>
                  </div>
                  <button
                    className="configure-link"
                    onClick={() => onNavigate('wizard')}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Allocation Visual Card */}
          <div className="current-allocation-card" style={{ marginTop: '24px' }}>
            <div className="current-allocation-header">
              <div className="allocation-card-title">Live Capital Segmentation</div>
              <div className="governance-label">
                <Info size={15} />
                <span>
                  {isConfigured ? (isPaused ? 'Enforcement Paused' : 'Deterministic Layer Active') : 'Unsegmented'}
                </span>
              </div>
            </div>

            <div className="allocation-meters-layout">
              <div className="total-funds-box">
                <span className="total-funds-label">TOTAL CAPITAL</span>
                <span className="total-funds-val">₦{totalFunds.toLocaleString()}.00</span>
                {accountNumber && (
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                    ACCT: {accountNumber}
                  </span>
                )}
              </div>

              <div className="flow-divider">
                <span>—</span>
                <ArrowRight size={20} style={{ margin: '0 4px' }} />
                <span>—</span>
              </div>

              <div className="segment-meters">
                <div className="segment-item">
                  <div className="segment-labels">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#059669" /> Protected Reserve Segment
                    </span>
                    <strong style={{ color: '#059669' }}>₦{rawProtected.toLocaleString()}</strong>
                  </div>
                  <div className="segment-bar-track">
                    <div
                      className="segment-bar-fill-protected"
                      style={{ width: `${Math.min(100, Math.max(5, protectedPercent))}%` }}
                    ></div>
                  </div>
                </div>

                <div className="segment-item">
                  <div className="segment-labels">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={14} /> Spendable Segment
                    </span>
                    <strong>₦{Math.max(0, totalFunds - rawProtected).toLocaleString()}</strong>
                  </div>
                  <div className="segment-bar-track">
                    <div
                      className="segment-bar-fill-spendable"
                      style={{ width: `${Math.min(100, Math.max(5, spendablePercent))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SAFI Activity / Policy Log */}
          <div className="activity-log-card" style={{ marginTop: '24px' }}>
            <div className="activity-header">
              <div className="allocation-card-title">SAFI Governance & Audit Trail</div>
              <button className="export-btn" onClick={() => alert('Exporting audit compliance certificate...')}>
                <Download size={14} />
                <span>Export Audit</span>
              </button>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ACTIVITY / RULE</th>
                  <th>PROTECTED IMPACT</th>
                  <th>GOVERNANCE POLICY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {isConfigured ? (
                  <>
                    <tr>
                      <td>Today</td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={15} color="#059669" /> SAFI Cycle Enforced
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>₦{rawProtected.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{modeDisplay} • {cardPolicyDisplay}</td>
                      <td>
                        <span className="badge-executed">
                          {isPaused ? 'Paused' : 'Active Enforced'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Cycle Start</td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders size={15} color="#2563EB" /> Configuration Baseline Locked
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₦{rawIncome.toLocaleString()} Working Funds</td>
                      <td style={{ color: 'var(--text-muted)' }}>{freqDisplay} Reset Interval</td>
                      <td>
                        <span className="badge-executed">Committed</span>
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                      No active SAFI configuration detected. Launch the configuration wizard to initiate governance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
