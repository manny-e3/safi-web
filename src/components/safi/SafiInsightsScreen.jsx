import React, { useState } from 'react';
import { Heart, CheckCircle2, BarChart2, AlertCircle } from 'lucide-react';

export default function SafiInsightsScreen({
  totalBalance,
  spendAllocation,
  safiDashboard,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const displayAllocation = safiDashboard?.spend?.allocation
    ? parseFloat(safiDashboard.spend.allocation) / 100
    : spendAllocation;

  const displayRemaining = safiDashboard?.remaining?.amount !== undefined
    ? parseFloat(safiDashboard.remaining.amount) / 100
    : spendAllocation;

  const displayUsed = safiDashboard?.spend?.used !== undefined
    ? parseFloat(safiDashboard.spend.used) / 100
    : Math.max(0, displayAllocation - displayRemaining);

  const reserveVal = safiDashboard?.protected?.amount !== undefined
    ? parseFloat(safiDashboard.protected.amount) / 100
    : Math.max(0, totalBalance - displayAllocation);

  const complianceScore = safiDashboard?.complianceScore !== undefined
    ? safiDashboard.complianceScore
    : 72;

  const cycleLabel = safiDashboard?.cycle?.label || 'CURRENT CYCLE';

  // 4-Week trend data
  const weeklySpend = safiDashboard?.weeklySpend || [
    { week: 'Wk 1', thisMonth: 80, lastMonth: 60 },
    { week: 'Wk 2', thisMonth: 95, lastMonth: 75 },
    { week: 'Wk 3', thisMonth: 40, lastMonth: 80 },
    { week: 'Wk 4', thisMonth: 10, lastMonth: 50 },
  ];
  const maxWeeklySpend = Math.max(...weeklySpend.map((w) => Math.max(w.thisMonth, w.lastMonth)), 1);

  // Categories list
  const rawCategories = safiDashboard?.categories || [];
  const defaultCategories = [
    { name: '🍽️ Food & Dining', percent: 42, amount: String(Math.round(displayUsed * 0.42 * 100)), color: '#10B981', key: 'Food & Dining' },
    { name: '🚗 Transport', percent: 23, amount: String(Math.round(displayUsed * 0.23 * 100)), color: '#3B82F6', key: 'Transport' },
    { name: '🧾 Bills & Utilities', percent: 15, amount: String(Math.round(displayUsed * 0.15 * 100)), color: '#EF4444', key: 'Bills & Utilities' },
    { name: '🎬 Entertainment', percent: 12, amount: String(Math.round(displayUsed * 0.12 * 100)), color: '#FBBF24', key: 'Entertainment' },
    { name: '📦 Other', percent: 8, amount: String(Math.round(displayUsed * 0.08 * 100)), color: '#8B5CF6', key: 'Other' },
  ];

  const displayCategories = defaultCategories.map((def) => {
    const raw = rawCategories.find((r) => r.name === def.key || r.name === def.name);
    return raw ? { ...def, percent: raw.percent, amount: raw.amount } : def;
  });

  const sortedCategories = [...displayCategories].sort((a, b) => b.percent - a.percent);
  const highestCategory = sortedCategories[0] || { name: 'Food & Dining', percent: 42 };

  const getScoreRatingText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'At Risk';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <div className="safi-cycle-bar-header">
          SPEND INSIGHTS • {cycleLabel}
        </div>

        {/* Subtabs Bar */}
        <div className="safi-subtabs-bar">
          <button
            type="button"
            className={`safi-subtab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`safi-subtab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button
            type="button"
            className={`safi-subtab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            Forecast
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            {/* Spending Trend Card */}
            <div className="safi-chart-card">
              <div className="safi-chart-title">Spending Trend</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                A chart of spending across the current Financial Cycle.
              </div>

              <div className="safi-trend-bars-container">
                {weeklySpend.map((item) => {
                  const thisH = Math.round((item.thisMonth / maxWeeklySpend) * 80);
                  const lastH = Math.round((item.lastMonth / maxWeeklySpend) * 80);
                  return (
                    <div key={item.week} className="safi-trend-col">
                      <div className="safi-bars-group">
                        <div
                          className="safi-bar-last-cycle"
                          style={{ height: `${Math.max(4, lastH)}px` }}
                          title={`Last cycle: ${item.lastMonth}`}
                        />
                        <div
                          className="safi-bar-this-cycle"
                          style={{ height: `${Math.max(4, thisH)}px` }}
                          title={`This cycle: ${item.thisMonth}`}
                        />
                      </div>
                      <span className="safi-col-label">{item.week}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} />
                  This Cycle
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
                  Last Cycle
                </span>
              </div>
            </div>

            {/* Spending Health */}
            <div className="safi-chart-card">
              <div className="safi-chart-title">Spending Health</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                  <Heart size={18} />
                </div>
                <div style={{ fontSize: '13px', color: '#E5E7EB', lineHeight: '1.5' }}>
                  You're spending consistently throughout this Financial Cycle.
                </div>
              </div>
            </div>

            {/* Behaviour Score */}
            <div className="safi-chart-card">
              <div className="safi-chart-title">Behaviour Score</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: '6px 0 12px 0' }}>
                {complianceScore} – {getScoreRatingText(complianceScore)}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '8px' }}>
                Current Strengths
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="safi-bullet-item">
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>Staying On Track</span>
                </div>
                <div className="safi-bullet-item">
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>No Override accessed</span>
                </div>
                <div className="safi-bullet-item">
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>Consistent daily spending rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Categories */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
              <BarChart2 size={20} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#34D399' }}>Concentration Alert</div>
                <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '2px' }}>
                  {highestCategory.percent}% of your Spend Pool has been spent on {highestCategory.name} this Financial Cycle.
                </div>
              </div>
            </div>

            <div className="safi-chart-card">
              <div className="safi-chart-title" style={{ marginBottom: '16px' }}>Spending Breakdown</div>
              {displayCategories.map((cat) => (
                <div key={cat.name} className="safi-category-bar-row">
                  <div className="safi-category-bar-header">
                    <span style={{ color: '#FFFFFF' }}>{cat.name}</span>
                    <span style={{ color: cat.color }}>
                      {cat.percent}% (₦{(parseFloat(cat.amount) / 100).toLocaleString()})
                    </span>
                  </div>
                  <div className="safi-category-track">
                    <div
                      className="safi-category-fill"
                      style={{ width: `${Math.min(100, cat.percent)}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Forecast */}
        {activeTab === 'forecast' && (
          <div>
            <div className="safi-chart-card">
              <div className="safi-chart-title">Reserve Projection</div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 16px 0', lineHeight: '1.5' }}>
                Based on your current cycle Reserve of{' '}
                <strong style={{ color: '#FFFFFF' }}>₦{reserveVal.toLocaleString()}</strong>,
                here is your projected future reserve growth:
              </p>

              {[
                { label: '3 Months', value: reserveVal * 3, sub: 'Short-term projection' },
                { label: '6 Months', value: reserveVal * 6, sub: 'Medium-term projection' },
                { label: '12 Months', value: reserveVal * 12, sub: 'Long-term projection' },
              ].map((proj) => (
                <div key={proj.label} className="safi-forecast-card">
                  <div className="safi-forecast-label">{proj.label}</div>
                  <div className="safi-forecast-val">₦{proj.value.toLocaleString()}</div>
                  <div className="safi-forecast-sub">{proj.sub}</div>
                </div>
              ))}

              <div style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: '16px' }}>
                *Note: Only Reserve growth is projected. SAFI does not forecast the customer's total account balance.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
