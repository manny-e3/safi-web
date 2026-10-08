import React, { useState, useMemo } from 'react';
import SidebarNav from './SidebarNav';
import {
  LayoutGrid,
  Landmark,
  Shield,
  Receipt,
  FileText,
  Settings,
  Search,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  LogOut,
  Lock,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  ChevronRight,
  PieChart,
  BarChart3,
  Calendar,
  AlertCircle,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Zap,
  Menu,
} from 'lucide-react';

export default function MeridianDashboard({
  totalBalance = 0,
  protectedFunds = 0,
  spendableFunds = 0,
  transactions = [],
  currentUser = null,
  wallet = null,
  safiConfig = null,
  safiDashboard = null,
  safiHistory = null,
  isLoadingBanking = false,
  onRefreshBanking = null,
  onNavigate,
  onOpenTransfer,
  onOpenFund,
  onLogout,
}) {
  // SAFI IS OPTIONAL: Only activate SAFI widgets if the user has an active configuration
  const isSafiConfigured = Boolean(safiConfig && safiConfig.accountNumber);

  // Interactive UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('split'); // 'split' | 'categories' | 'weekly'
  const [txFilter, setTxFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [txSearch, setTxSearch] = useState('');
  const [copiedAcct, setCopiedAcct] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // SVG Donut metrics (Only used if SAFI is configured)
  const circumference = 439.82;
  const safeTotal = totalBalance > 0 ? totalBalance : 1;
  const protectedPercent = isSafiConfigured ? Math.round((protectedFunds / safeTotal) * 100) : 0;
  const spendablePercent = isSafiConfigured ? Math.max(0, 100 - protectedPercent) : 100;
  const protectedStroke = isSafiConfigured ? (protectedFunds / safeTotal) * circumference : 0;
  const spendableStroke = isSafiConfigured ? Math.max(0, circumference - protectedStroke) : circumference;

  // Real financial cash-flow metrics derived from live ledger
  const { monthlyInflow, monthlyOutflow, netCashFlow, todayDebits, creditCount, debitCount } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let todaySpent = 0;
    let credits = 0;
    let debits = 0;
    const todayStr = new Date().toDateString();

    transactions.forEach((tx) => {
      const isSuccessful = tx.status === 'Completed' || tx.status === 'successful';
      if (!isSuccessful) return;

      const amt = Number(tx.amount) || 0;
      if (tx.isCredit) {
        inflow += amt;
        credits++;
      } else {
        outflow += amt;
        debits++;
        const txDate = tx.raw?.createdAt ? new Date(tx.raw.createdAt) : new Date(tx.date);
        if (txDate.toDateString() === todayStr) {
          todaySpent += amt;
        }
      }
    });

    return {
      monthlyInflow: inflow,
      monthlyOutflow: outflow,
      netCashFlow: inflow - outflow,
      todayDebits: todaySpent,
      creditCount: credits,
      debitCount: debits,
    };
  }, [transactions]);

  // Real institutional daily velocity limits
  const dailyLimit = 50000000; // ₦50M institutional tier
  const remainingDailyLimit = Math.max(0, dailyLimit - todayDebits);
  const dailyLimitUsagePercent = Math.min(100, (todayDebits / dailyLimit) * 100);

  // Real SAFI Cycle parameters derived from live backend (Only if configured)
  const cycleInfo = useMemo(() => {
    if (!isSafiConfigured) return null;

    const cycle = safiDashboard?.cycle;
    const day = cycle?.day || 1;
    const totalDays = cycle?.totalDays || 31;
    const daysLeft = cycle?.daysLeft || (totalDays - day);
    const progressPercent = Math.min(100, Math.round((day / totalDays) * 100));

    const allocation = Number(safiDashboard?.spend?.allocation || (spendableFunds + todayDebits));
    const used = Number(safiDashboard?.spend?.used || todayDebits);
    const remaining = Number(safiDashboard?.remaining?.amount || spendableFunds);
    const safeDaily = Number(safiDashboard?.safeDaily || (daysLeft > 0 ? Math.round(remaining / daysLeft) : remaining));
    const dailyRate = Number(safiDashboard?.dailyRate || 0);

    const complianceScore = safiDashboard?.complianceScore !== undefined ? safiDashboard.complianceScore : 100;
    const streakDays = safiDashboard?.rulesMaintainedDays !== undefined ? safiDashboard.rulesMaintainedDays : (safiHistory?.complianceStreakDays || 1);
    const spendPace = safiDashboard?.spendPace || 'On Track';
    const status = safiDashboard?.status || 'Protected';

    return {
      label: cycle?.label || 'OCTOBER CYCLE',
      day,
      totalDays,
      daysLeft,
      progressPercent,
      allocation,
      used,
      remaining,
      safeDaily,
      dailyRate,
      complianceScore,
      streakDays,
      spendPace,
      status,
      categories: safiDashboard?.categories || [],
      weeklySpend: safiDashboard?.weeklySpend || [],
    };
  }, [isSafiConfigured, safiDashboard, safiHistory, spendableFunds, todayDebits]);

  // Filtered live transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (txFilter === 'credit' && !tx.isCredit) return false;
      if (txFilter === 'debit' && tx.isCredit) return false;

      // Search query
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const desc = (tx.description || '').toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const amt = (tx.amount || '').toString();
        if (!desc.includes(q) && !ref.includes(q) && !cat.includes(q) && !amt.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, txFilter, txSearch]);

  // Copy account number handler
  const handleCopyAccount = (e) => {
    e.stopPropagation();
    if (wallet?.accountNumber) {
      navigator.clipboard?.writeText(wallet.accountNumber);
      setCopiedAcct(true);
      setTimeout(() => setCopiedAcct(false), 2000);
    }
  };

  // Copy reference handler
  const handleCopyRef = (ref, e) => {
    e.stopPropagation();
    if (ref) {
      navigator.clipboard?.writeText(ref);
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 2000);
    }
  };

  // Live Refresh handler
  const handleSyncClick = async () => {
    if (onRefreshBanking) {
      setIsManualSyncing(true);
      try {
        await onRefreshBanking();
      } finally {
        setTimeout(() => setIsManualSyncing(false), 500);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Reusable Sidebar Navigation with Mobile Drawer */}
      <SidebarNav
        activeNav="dashboard"
        isSafiConfigured={isSafiConfigured}
        safiConfig={safiConfig}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={onNavigate}
        onOpenTransfer={onOpenTransfer}
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
            <div className="top-header-title">Digital Banking & Core Ledger</div>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search transactions, reference..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
            <div className="header-user-pill" title={currentUser?.email || 'Institutional Account'}>
              <div className="header-user-avatar">
                {(currentUser?.name || 'Alexander').charAt(0).toUpperCase()}
              </div>
              <div className="header-user-details">
                <span className="header-user-name">
                  {currentUser?.name || 'Alexander Wright'}
                </span>
                <span className="header-user-role">Institutional Tier 1</span>
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

        {/* Page Content Container */}
        <div className="page-content">
          {/* Executive Header Banner */}
          <div className="dashboard-executive-header">
            <div className="dashboard-title-group">
              <h1> Dashboard</h1>
              <div className="dashboard-subtitle">
                <span>Account ready for <strong>{currentUser?.email || 'Enterprise'}</strong></span>
                <span>•</span>
                {/* <span>
                  {isSafiConfigured
                    ? 'Real-time Core Banking & SAFI Reserve Protocol'
                    : 'Meridian Institutional Core Banking'}
                </span> */}
              </div>
            </div>

            <div className="dashboard-header-badges">
              {/* <button
                type="button"
                className="live-sync-btn"
                onClick={handleSyncClick}
                disabled={isLoadingBanking || isManualSyncing}
                title="Sync live account metrics from banking core"
              >
                <RefreshCw
                  size={14}
                  className={(isLoadingBanking || isManualSyncing) ? 'animate-spin' : ''}
                />
                <span>{(isLoadingBanking || isManualSyncing) ? 'Syncing...' : 'Live Sync'}</span>
              </button>

              <div className="live-status-pill">
                <span className="pulsing-green-dot"></span>
                <span>Live Core Active</span>
              </div> */}
            </div>
          </div>

          {/* 4-Card Executive Metric Grid */}
          <div className="metric-cards-grid-4">
            {/* Card 1: Total Liquid Capital (Common to both modes) */}
            <div className="executive-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">TOTAL VAULT CAPITAL</span>
                <div className="stat-icon-bubble blue">
                  <Landmark size={18} />
                </div>
              </div>
              <div>
                <div className="stat-card-main-val">
                  ₦{totalBalance.toLocaleString()}.00
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Available across sovereign institutional vault
                </div>
              </div>
              <div className="stat-card-bottom">
                {wallet?.accountNumber ? (
                  <button
                    type="button"
                    className="copy-acct-pill"
                    onClick={handleCopyAccount}
                    title="Click to copy account number"
                  >
                    {copiedAcct ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    <span>ACCT: {wallet.accountNumber}</span>
                  </button>
                ) : (
                  <span>Institutional Tier 1</span>
                )}
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <TrendingUp size={13} />
                  <span>+₦{(monthlyInflow / 1000).toFixed(0)}k MTD</span>
                </span>
              </div>
            </div>

            {/* SAFI CONFIGURED: Show SAFI Protected Reserve and Active Spend Pool */}
            {isSafiConfigured ? (
              <>
                {/* Metric 2: SAFI Protected Reserve */}
                <div className="executive-stat-card accent-emerald">
                  <div className="stat-card-top">
                    <span className="stat-card-label" style={{ color: '#065F46' }}>
                      SAFI PROTECTED RESERVE
                    </span>
                    <div className="stat-icon-bubble emerald">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-main-val" style={{ color: '#065F46' }}>
                      ₦{protectedFunds.toLocaleString()}.00
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '4px', fontWeight: 600 }}>
                      {protectedPercent}% of capital strictly ring-fenced
                    </div>
                  </div>
                  <div className="stat-card-bottom" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ color: '#065F46', fontWeight: 700, fontSize: '11.5px' }}>
                      🛡️ {cycleInfo?.streakDays || 1} Day Streak
                    </span>
                    <span style={{ color: '#047857', fontWeight: 600, fontSize: '11px' }}>
                      {cycleInfo?.complianceScore || 100}% Discipline Score
                    </span>
                  </div>
                </div>

                {/* Metric 3: Active Spend Pool */}
                <div className="executive-stat-card accent-navy">
                  <div className="stat-card-top">
                    <span className="stat-card-label">ACTIVE SPEND POOL</span>
                    <div className="stat-icon-bubble purple">
                      <Activity size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-main-val">
                      ₦{spendableFunds.toLocaleString()}.00
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                      Burn pace: <strong>{cycleInfo?.spendPace || 'On Track'}</strong>
                    </div>
                  </div>
                  <div className="stat-card-bottom">
                    <span style={{ fontSize: '11.5px' }}>
                      Daily Safe: <strong style={{ color: '#0F172A' }}>₦{(cycleInfo?.safeDaily || 0).toLocaleString()}</strong>
                    </span>
                    <span style={{ color: '#2563EB', fontWeight: 700, fontSize: '11.5px' }}>
                      {spendablePercent}% Available
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* SAFI NOT CONFIGURED: Show Standard Core Banking Metrics (Monthly Inflow & Monthly Outflow) */
              <>
                {/* Metric 2: Monthly Inflow */}
                <div className="executive-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-label">MONTHLY INFLOW (CREDITS)</span>
                    <div className="stat-icon-bubble emerald">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-main-val" style={{ color: '#059669' }}>
                      +₦{monthlyInflow.toLocaleString()}.00
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                      {creditCount} inbound transaction{creditCount === 1 ? '' : 's'} recorded this cycle
                    </div>
                  </div>
                  <div className="stat-card-bottom">
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: '11.5px' }}>
                      Receivables Active
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Net: ₦{netCashFlow.toLocaleString()}.00
                    </span>
                  </div>
                </div>

                {/* Metric 3: Monthly Outflow */}
                <div className="executive-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-label">MONTHLY OUTFLOW (DEBITS)</span>
                    <div className="stat-icon-bubble purple">
                      <TrendingDown size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="stat-card-main-val" style={{ color: '#0F172A' }}>
                      -₦{monthlyOutflow.toLocaleString()}.00
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                      {debitCount} outbound transfer{debitCount === 1 ? '' : 's'} processed
                    </div>
                  </div>
                  <div className="stat-card-bottom">
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Disbursed MTD
                    </span>
                    <span style={{ color: '#2563EB', fontWeight: 700, fontSize: '11px' }}>
                      100% Unrestricted
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Metric 4: Daily Capacity Limit */}
            <div className="executive-stat-card">
              <div className="stat-card-top">
                <span className="stat-card-label">DAILY CAPACITY LIMIT</span>
                <div className="stat-icon-bubble amber">
                  <ArrowLeftRight size={18} />
                </div>
              </div>
              <div>
                <div className="stat-card-main-val">
                  ₦{remainingDailyLimit.toLocaleString()}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Limit: ₦{dailyLimit.toLocaleString()} / day
                </div>
              </div>
              <div className="stat-card-bottom">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px' }}>
                    <span>₦{todayDebits.toLocaleString()} used today</span>
                    <strong>{dailyLimitUsagePercent.toFixed(2)}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(2, dailyLimitUsagePercent)}%`,
                        height: '100%',
                        background: '#0D9488',
                        borderRadius: '999px',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SAFI NOT CONFIGURED: Promotional & Activation Banner for Optional SAFI Protection */}
          {!isSafiConfigured && (
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #064E3B 100%)',
                borderRadius: '14px',
                padding: '24px 28px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.25)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div style={{ maxWidth: '780px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34D399',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    OPTIONAL SECURITY ADD-ON • SAFI PROTOCOL
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 8px 0', letterSpacing: '-0.01em' }}>
                  Protect Your Capital & Prevent Accidental Reserve Drawdowns
                </h3>
                <p style={{ fontSize: '13px', color: '#D1FAE5', lineHeight: 1.5, margin: 0 }}>
                  SAFI is an optional governance protocol that ring-fences your savings into a protected reserve, structures a disciplined spend pool, and enforces deliberate pause friction before critical balances are touched. Your funds stay in your account at all times.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#A7F3D0', flexWrap: 'wrap' }}>
                  <span>✓ 100% Capital Remains in Vault</span>
                  <span>✓ Self-Imposed Pause Safeguards</span>
                  <span>✓ Customizable Daily Velocity</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('wizard')}
                  style={{
                    background: '#10B981',
                    color: '#064E3B',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 22px',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#34D399'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#10B981'; }}
                >
                  <ShieldCheck size={18} />
                  <span>Activate SAFI Protection</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Two-Column Midsection: SAFI Intelligence & Operations */}
          <div className="dashboard-split-grid">
            {/* Column 1: SAFI Capital Intelligence (if configured) OR Core Treasury Health (if not configured) */}
            <div className="dashboard-section-card">
              {isSafiConfigured ? (
                <>
                  <div className="dashboard-section-header">
                    <div className="dashboard-section-title">
                      <PieChart size={17} color="#0D9488" />
                      <span>Capital Allocation & Cycle Breakdown</span>
                    </div>
                    <div className="dashboard-tab-bar">
                      <button
                        type="button"
                        className={`dashboard-tab-btn ${activeTab === 'split' ? 'active' : ''}`}
                        onClick={() => setActiveTab('split')}
                      >
                        Capital Split
                      </button>
                      <button
                        type="button"
                        className={`dashboard-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                      >
                        Categories
                      </button>
                      <button
                        type="button"
                        className={`dashboard-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                        onClick={() => setActiveTab('weekly')}
                      >
                        Weekly Trend
                      </button>
                    </div>
                  </div>

                  {/* View 1: Capital Split with Interactive Donut & Cycle Meter */}
                  {activeTab === 'split' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="donut-split-layout">
                        {/* SVG Donut */}
                        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                          <svg width="190" height="190" viewBox="0 0 200 200">
                            {/* Spendable Arc (Slate / Navy) */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="transparent"
                              stroke="#0F172A"
                              strokeWidth="22"
                              strokeDasharray={`${spendableStroke} ${circumference}`}
                              strokeDashoffset={0}
                              transform="rotate(-90 100 100)"
                            />
                            {/* Protected Arc (Vibrant Emerald) */}
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="transparent"
                              stroke="#10B981"
                              strokeWidth="22"
                              strokeDasharray={`${protectedStroke} ${circumference}`}
                              strokeDashoffset={-spendableStroke}
                              transform="rotate(-90 100 100)"
                            />
                          </svg>
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center',
                            }}
                          >
                            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Total Capital
                            </span>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                              ₦{(totalBalance / 1000).toFixed(0)}k
                            </div>
                          </div>
                        </div>

                        {/* Split Breakdown Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div
                            style={{
                              padding: '12px 14px',
                              background: '#F0FDF4',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#065F46', textTransform: 'uppercase' }}>
                                Protected Reserve
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#065F46' }}>
                                {protectedPercent}%
                              </span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
                              ₦{protectedFunds.toLocaleString()}.00
                            </div>
                            <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                              Guaranteed sovereign shield
                            </div>
                          </div>

                          <div
                            style={{
                              padding: '12px 14px',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                                Spendable Allocation
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                                {spendablePercent}%
                              </span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                              ₦{spendableFunds.toLocaleString()}.00
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              Available for transfer and bills
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Cycle Progress Tracker */}
                      {cycleInfo && (
                        <div
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '14px 16px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={14} color="#0D9488" />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                                {cycleInfo.label}
                              </span>
                            </div>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                              Day <strong>{cycleInfo.day}</strong> of {cycleInfo.totalDays} • <strong>{cycleInfo.daysLeft} days left</strong>
                            </span>
                          </div>

                          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div
                              style={{
                                width: `${cycleInfo.progressPercent}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #0D9488 0%, #10B981 100%)',
                                borderRadius: '999px',
                              }}
                            ></div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                            <span>Spend Allocation: <strong>₦{cycleInfo.allocation.toLocaleString()}</strong></span>
                            <span>Disbursed: <strong style={{ color: '#0F172A' }}>₦{cycleInfo.used.toLocaleString()}</strong></span>
                            <span>Safe Pace: <strong style={{ color: '#059669' }}>₦{cycleInfo.safeDaily.toLocaleString()} / day</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View 2: Real Categories Breakdown */}
                  {activeTab === 'categories' && (
                    <div className="category-bars-list">
                      {cycleInfo && cycleInfo.categories.length > 0 ? (
                        cycleInfo.categories.map((cat, idx) => (
                          <div key={idx} className="category-bar-row">
                            <div className="category-bar-labels">
                              <span>{cat.name}</span>
                              <span style={{ color: '#0F172A' }}>
                                ₦{Number(cat.amount || 0).toLocaleString()} ({cat.percent}%)
                              </span>
                            </div>
                            <div className="category-bar-track">
                              <div
                                className="category-bar-fill"
                                style={{
                                  width: `${Math.max(cat.percent > 0 ? cat.percent : 0, Number(cat.amount) > 0 ? 8 : 1)}%`,
                                  background: cat.color || '#0D9488',
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                          No categorized expenditures recorded for this cycle yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* View 3: Weekly Burn Comparison */}
                  {activeTab === 'weekly' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                        <span>Weekly Spend Progression</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>MTD Burn Pace: {cycleInfo?.spendPace || 'On Track'}</span>
                      </div>
                      <div className="weekly-bars-container">
                        {cycleInfo && cycleInfo.weeklySpend.map((w, idx) => (
                          <div key={idx} className="weekly-bar-item">
                            <span className="weekly-bar-amount">₦{w.thisMonth.toLocaleString()}</span>
                            <div className="weekly-bar-visual-wrap">
                              <div
                                className="weekly-bar-visual-fill"
                                style={{
                                  height: `${Math.max(6, Math.min(100, (w.thisMonth / Math.max(1, w.lastMonth || 100)) * 70))}%`,
                                }}
                              ></div>
                            </div>
                            <span className="weekly-bar-label">{w.week}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* SAFI NOT CONFIGURED: Core Treasury Overview & Vault Status */
                <>
                  <div className="dashboard-section-header">
                    <div className="dashboard-section-title">
                      <Landmark size={17} color="#2563EB" />
                      <span>Vault Treasury & Liquidity Status</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      STANDARD COMMERCIAL ACCOUNT
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="treasury-status-grid">
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Inflow (MTD)</span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '3px' }}>
                          +₦{monthlyInflow.toLocaleString()}.00
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Outflow (MTD)</span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                          -₦{monthlyOutflow.toLocaleString()}.00
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Net Position</span>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: netCashFlow >= 0 ? '#059669' : '#DC2626', marginTop: '3px' }}>
                          ₦{netCashFlow.toLocaleString()}.00
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                      Your funds are managed under standard commercial banking rules. All balances are fully spendable without governance overrides or reserve lockups.
                    </div>

                    <div
                      style={{
                        padding: '14px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={20} color="#2563EB" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E3A8A' }}>
                            Looking for automated budget discipline?
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#3B82F6' }}>
                            SAFI enables reserve ring-fencing and velocity alerts with 1 click.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('wizard')}
                        style={{
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Explore SAFI
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Column 2: Operations & Institutional Velocity Controls */}
            <div className="dashboard-section-card">
              <div className="dashboard-section-header">
                <div className="dashboard-section-title">
                  <ArrowLeftRight size={17} color="#0F172A" />
                  <span>Institutional Actions & Governance</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isSafiConfigured ? '#059669' : '#64748B',
                    background: isSafiConfigured ? '#ECFDF5' : '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${isSafiConfigured ? 'rgba(16, 185, 129, 0.25)' : '#CBD5E1'}`,
                  }}
                >
                  {isSafiConfigured ? (safiConfig?.governanceMode ? safiConfig.governanceMode.toUpperCase() : 'FLEXIBLE') : 'STANDARD CORE'}
                </span>
              </div>

              {/* Quick Action Tiles */}
              <div className="dashboard-actions-grid">
                <button
                  type="button"
                  className="action-tile-btn primary"
                  onClick={onOpenTransfer}
                >
                  <div className="action-tile-icon-row">
                    <ArrowUpRight size={18} color="#2DD4BF" />
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Instant</span>
                  </div>
                  <div className="action-tile-title">Transfer Funds</div>
                  <div className="action-tile-desc">
                    {isSafiConfigured ? 'B2B & domestic wire with reserve guard' : 'Standard institutional domestic wire'}
                  </div>
                </button>

                <button
                  type="button"
                  className="action-tile-btn"
                  onClick={onOpenFund}
                >
                  <div className="action-tile-icon-row">
                    <ArrowDownLeft size={18} color="#059669" />
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Direct</span>
                  </div>
                  <div className="action-tile-title">Fund Account</div>
                  <div className="action-tile-desc">Deposit institutional capital into vault</div>
                </button>

                <button
                  type="button"
                  className="action-tile-btn"
                  onClick={() => onNavigate(isSafiConfigured ? 'safi_dashboard' : 'wizard')}
                >
                  <div className="action-tile-icon-row">
                    <SlidersHorizontal size={18} color="#2563EB" />
                    <span style={{ fontSize: '10px', color: isSafiConfigured ? '#059669' : '#64748B' }}>
                      {isSafiConfigured ? 'Active' : 'Optional'}
                    </span>
                  </div>
                  <div className="action-tile-title">
                    {isSafiConfigured ? 'Configure SAFI' : 'Activate SAFI'}
                  </div>
                  <div className="action-tile-desc">
                    {isSafiConfigured ? 'Adjust reserve rules & velocity' : 'Set up third-party reserve safeguard'}
                  </div>
                </button>

                <button
                  type="button"
                  className="action-tile-btn"
                  onClick={() => onNavigate('transactions')}
                >
                  <div className="action-tile-icon-row">
                    <FileText size={18} color="#7C3AED" />
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Audit</span>
                  </div>
                  <div className="action-tile-title">Statements</div>
                  <div className="action-tile-desc">View full transaction audit trail</div>
                </button>
              </div>

              {/* Real Governance Status Summary */}
              {isSafiConfigured ? (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} color="#0D9488" />
                    <span>Protocol Parameters & Enforcement</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Breach Behaviour:</span>
                    <strong>{safiConfig?.cardBehaviour ? safiConfig.cardBehaviour.replace('_', ' ').toUpperCase() : 'HARD DECLINE'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Reserve Rollover:</span>
                    <strong>{safiConfig?.rolloverPreference ? safiConfig.rolloverPreference.replace(/_/g, ' ').toUpperCase() : 'RETURN TO RESERVE'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Intervention Delay:</span>
                    <strong style={{ color: '#059669' }}>5-Second Deliberate Friction</strong>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Landmark size={14} color="#2563EB" />
                    <span>Core Commercial Parameters</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Account Security:</span>
                    <strong style={{ color: '#059669' }}>2FA PIN Protected</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>Daily Wire Cap:</span>
                    <strong>₦50,000,000 / day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>SAFI Protection Layer:</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Not Active (Optional)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Card: Live Transactions Ledger */}
          <div className="transactions-card">
            <div className="table-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="table-title">RECENT LEDGER TRANSACTIONS</span>
                <span style={{ fontSize: '11.5px', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  {filteredTransactions.length} of {transactions.length} Total
                </span>
              </div>
              <button
                type="button"
                className="table-view-all"
                onClick={() => onNavigate('transactions')}
              >
                <span>Full Ledger Statements</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="transactions-filter-bar">
              <div className="tx-filter-pills">
                <button
                  type="button"
                  className={`tx-filter-pill-btn ${txFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTxFilter('all')}
                >
                  All Entries ({transactions.length})
                </button>
                <button
                  type="button"
                  className={`tx-filter-pill-btn ${txFilter === 'credit' ? 'active' : ''}`}
                  onClick={() => setTxFilter('credit')}
                >
                  Credits / Inflow ({transactions.filter((t) => t.isCredit).length})
                </button>
                <button
                  type="button"
                  className={`tx-filter-pill-btn ${txFilter === 'debit' ? 'active' : ''}`}
                  onClick={() => setTxFilter('debit')}
                >
                  Debits / Outflow ({transactions.filter((t) => !t.isCredit).length})
                </button>
              </div>

              <div className="tx-search-input-wrap">
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Filter by counterparty or ref..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Data Table with Horizontal Scroll Wrap */}
            <div className="transactions-table-wrap">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Description / Counterparty</th>
                    <th>Reference</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="clickable-row"
                        onClick={() => onNavigate('transactions')}
                      >
                        <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px', color: '#475569' }}>
                          {tx.date}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: tx.isCredit ? '#ECFDF5' : '#F1F5F9',
                                color: tx.isCredit ? '#059669' : '#0F172A',
                                flexShrink: 0,
                              }}
                            >
                              {tx.isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                            </div>
                            <div>
                              <span style={{ fontWeight: 700, color: '#0F172A', display: 'block', fontSize: '13px' }}>
                                {tx.description}
                              </span>
                              {tx.balanceAfter !== undefined && (
                                <span style={{ fontSize: '11px', color: '#64748B' }}>
                                  Balance after: ₦{Number(tx.balanceAfter).toLocaleString()}.00
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="copy-acct-pill"
                            onClick={(e) => handleCopyRef(tx.reference, e)}
                            title="Copy reference number"
                          >
                            {copiedRef === tx.reference ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                            <span>{tx.reference.length > 18 ? tx.reference.slice(0, 15) + '...' : tx.reference}</span>
                          </button>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: tx.isCredit ? '#F0FDF4' : '#F8FAFC',
                              color: tx.isCredit ? '#047857' : '#475569',
                              border: `1px solid ${tx.isCredit ? 'rgba(16, 185, 129, 0.25)' : '#CBD5E1'}`,
                            }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: tx.isCredit ? '#047857' : '#0F172A',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tx.isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}.00
                        </td>
                        <td>
                          <span className="badge-completed">
                            <span className="dot"></span>
                            <span>Completed</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                        {txSearch ? (
                          <>No transactions matching "<strong>{txSearch}</strong>".</>
                        ) : (
                          <>No transactions recorded yet. Click <strong>Fund Account</strong> to make your first deposit.</>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
