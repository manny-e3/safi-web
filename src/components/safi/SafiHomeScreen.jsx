import React from 'react';
import { TrendingUp, Lock, RefreshCw } from 'lucide-react';

export default function SafiHomeScreen({
  spendAllocation,
  totalBalance,
  safiDashboard,
  safiHistory,
  onRefresh,
}) {
  // Dynamic metrics from backend or calculated fallbacks
  const cycleLabel = safiDashboard?.cycle?.label || 'CURRENT CYCLE';
  const cycleDay = safiDashboard?.cycle?.day || 11;
  const cycleTotalDays = safiDashboard?.cycle?.totalDays || 30;
  const cycleDaysLeft = safiDashboard?.cycle?.daysLeft !== undefined
    ? safiDashboard.cycle.daysLeft
    : Math.max(0, cycleTotalDays - cycleDay);

  const displayAllocation = safiDashboard?.spend?.allocation
    ? parseFloat(safiDashboard.spend.allocation) / 100
    : spendAllocation;

  const displayRemaining = safiDashboard?.remaining?.amount !== undefined
    ? parseFloat(safiDashboard.remaining.amount) / 100
    : spendAllocation;

  const displayUsed = safiDashboard?.spend?.used !== undefined
    ? parseFloat(safiDashboard.spend.used) / 100
    : Math.max(0, displayAllocation - displayRemaining);

  const remainingPercent = safiDashboard?.remaining?.percent !== undefined
    ? safiDashboard.remaining.percent
    : (displayAllocation > 0 ? Math.round((displayRemaining / displayAllocation) * 100) : 100);

  const displaySafeDaily = safiDashboard?.safeDaily !== undefined
    ? parseFloat(safiDashboard.safeDaily) / 100
    : Math.round(displayAllocation / Math.max(1, cycleTotalDays));

  const complianceScore = safiDashboard?.complianceScore !== undefined
    ? safiDashboard.complianceScore
    : 72;

  const protectedStatus = safiDashboard?.protected?.status || 'untouched';

  // Calculate cycle streak
  const calculateCycleStreak = () => {
    if (protectedStatus === 'breached') return 0;
    const historyCycles = safiHistory?.cycles;
    if (!historyCycles || historyCycles.length === 0) return 1;
    let streak = 0;
    const completedCycles = historyCycles.filter((c) => c.status === 'completed');
    for (const cycle of completedCycles) {
      if (cycle.outcome !== 'over_budget') {
        streak++;
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  };

  const cycleStreak = calculateCycleStreak();
  const streakText = `${cycleStreak} ${cycleStreak === 1 ? 'cycle' : 'cycles'}`;

  const formatCycleEndText = () => {
    const d = new Date();
    d.setDate(d.getDate() + cycleDaysLeft);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  const getScoreRating = (score) => {
    if (score >= 90) return { label: '🌟 Excellent', color: '#10B981' };
    if (score >= 75) return { label: '✅ Very Good', color: '#34D399' };
    if (score >= 60) return { label: '👍 Good', color: '#60A5FA' };
    if (score >= 40) return { label: '⚠️ Needs Improvement', color: '#F59E0B' };
    if (score >= 20) return { label: '🚨 At Risk', color: '#EF4444' };
    return { label: '❌ Critical', color: '#DC2626' };
  };

  const pace = safiDashboard?.spendPace || (remainingPercent < 30 ? 'Warning' : 'On Track');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        {/* Cycle Bar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div className="safi-cycle-bar-header">
            {cycleLabel} • DAY {cycleDay} OF {cycleTotalDays} • {cycleDaysLeft} DAYS LEFT
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh SAFI Data"
              style={{
                position: 'absolute',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>

        {/* Circular Donut Ring Dial */}
        <div className="safi-donut-section">
          <div className="safi-donut-outer-ring">
            <div className="safi-donut-inner-content">
              <span className="safi-donut-sub-label">SPEND POOL</span>
              <span className="safi-donut-amount">₦{Math.round(displayRemaining).toLocaleString()}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Remaining</span>
              <span className="safi-donut-avail-pill">
                {remainingPercent}% Available
              </span>
            </div>
          </div>
        </div>

        {/* Spend Pace Card */}
        <div className="safi-pace-card">
          <div className="safi-pace-header-row">
            <span className="safi-pace-title">Spend Pace</span>
            <span
              className={`safi-pace-badge ${
                pace === 'Warning' ? 'warning' : pace === 'Doing Very Well' ? 'very-well' : 'on-track'
              }`}
            >
              {pace === 'Warning' ? '🟡 Warning' : pace === 'Doing Very Well' ? '🟣 Doing Very Well' : '🟢 On Track'}
            </span>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '4px' }}>
            MESSAGE
          </div>
          <div className="safi-pace-desc">
            {pace === 'Warning'
              ? "You're spending faster than planned. You're at risk of exhausting your Spend Pool before this Financial Cycle ends."
              : pace === 'Doing Very Well'
              ? "Excellent progress. You're ahead of your planned spending pace."
              : "You're spending as planned. Your Spend Pool is on track for this Financial Cycle."}
          </div>

          <div className="safi-pace-metrics-row">
            <div className="safi-pace-metric-col">
              <span className="lbl">Safe Daily Spend</span>
              <span className="val">₦{Math.round(displaySafeDaily).toLocaleString()}</span>
            </div>
            <div className="safi-pace-metric-col" style={{ textAlign: 'right' }}>
              <span className="lbl">Cycle Ends</span>
              <span className="val">{formatCycleEndText()}</span>
            </div>
          </div>
        </div>

        {/* Spend & Reserve Dual Tiles */}
        <div className="safi-dual-tiles-row">
          <div className="safi-tile-box">
            <div className="safi-tile-header">
              <TrendingUp size={14} color="#9CA3AF" />
              <span>SPEND</span>
            </div>
            <div className="safi-tile-val">₦{Math.round(displayUsed).toLocaleString()}</div>
            <div className="safi-tile-sub">Spent this cycle</div>
          </div>

          <div className="safi-tile-box">
            <div className="safi-tile-header" style={{ color: '#10B981' }}>
              <Lock size={14} color="#10B981" />
              <span>RESERVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>
                • {cycleDaysLeft} days protected
              </span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                • {protectedStatus === 'breached' ? 'Override accessed' : 'No override this cycle'}
              </span>
            </div>
          </div>
        </div>

        {/* Streak & Behaviour Score Dual Tiles */}
        <div className="safi-dual-tiles-row">
          <div className="safi-tile-box" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className="safi-tile-val" style={{ fontSize: '22px' }}>{streakText}</div>
            <div className="safi-tile-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Streak
            </div>
          </div>

          <div className="safi-tile-box" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className="safi-tile-val" style={{ fontSize: '22px' }}>{complianceScore}</div>
            <div className="safi-tile-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Behaviour Score
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: getScoreRating(complianceScore).color, marginTop: '4px' }}>
              {getScoreRating(complianceScore).label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
