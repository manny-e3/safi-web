import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export default function SafiHistoryScreen({ safiHistory, onRefresh }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const fallbackCycles = [
    {
      period: 'June 2026',
      status: 'completed',
      outcome: 'returned',
      allocation: '90000000',
      netAmount: '12000000',
      protectedAmount: '110000000',
      complianceScore: 100,
      overrideCount: 0,
      endDate: '2026-06-22T23:59:59.000Z',
    },
    {
      period: 'May 2026',
      status: 'completed',
      outcome: 'over_budget',
      allocation: '90000000',
      netAmount: '-4500000',
      protectedAmount: '110000000',
      complianceScore: 72,
      overrideCount: 1,
      endDate: '2026-05-22T23:59:59.000Z',
    },
    {
      period: 'April 2026',
      status: 'completed',
      outcome: 'returned',
      allocation: '90000000',
      netAmount: '0',
      protectedAmount: '110000000',
      complianceScore: 85,
      overrideCount: 0,
      endDate: '2026-04-22T23:59:59.000Z',
    },
  ];

  const cycles = safiHistory?.cycles || fallbackCycles;
  const pastCycles = cycles.filter((c) => c.status === 'completed' || !c.status);

  const getCycleStats = (cycle) => {
    const allocation = parseFloat(cycle.allocation || '90000000') / 100;
    const netAmount = parseFloat(cycle.netAmount || '0') / 100;
    const protectedSum = parseFloat(cycle.protectedAmount || '110000000') / 100;
    const spent = Math.max(0, allocation - netAmount);
    const hasOverride = cycle.outcome === 'over_budget' || (cycle.overrideCount && cycle.overrideCount > 0);
    const overrideText = hasOverride ? 'Yes' : 'No';

    const formatDate = (dateStr) => {
      if (!dateStr) return '22 Aug';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    return {
      allocation,
      spent,
      protectedSum,
      overrideText,
      completedDate: formatDate(cycle.endDate),
      complianceScore: cycle.complianceScore || 100,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <div className="safi-cycle-bar-header" style={{ marginBottom: '20px' }}>
          PAST CYCLES
        </div>

        {pastCycles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
            <Calendar size={36} color="#4B5563" style={{ marginBottom: '12px' }} />
            <div>No past Financial Cycles recorded yet.</div>
          </div>
        ) : (
          pastCycles.map((cycle, idx) => {
            const stats = getCycleStats(cycle);
            const isExpanded = expandedIdx === idx;

            return (
              <div
                key={idx}
                className={`safi-history-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="safi-history-top">
                  <span className="safi-history-month">{cycle.period}</span>
                  {isExpanded ? (
                    <ChevronUp size={16} color="#9CA3AF" />
                  ) : (
                    <ChevronDown size={16} color="#9CA3AF" />
                  )}
                </div>

                <div className="safi-history-stats-grid">
                  <div className="safi-history-stat-col">
                    <span className="v">{stats.complianceScore}</span>
                    <span className="l">Behaviour Score</span>
                  </div>
                  <div className="safi-history-stat-col">
                    <span
                      className="v"
                      style={{ color: stats.overrideText === 'Yes' ? '#EF4444' : '#FFFFFF' }}
                    >
                      {stats.overrideText}
                    </span>
                    <span className="l">Override</span>
                  </div>
                  <div className="safi-history-stat-col">
                    <span className="v">{stats.completedDate}</span>
                    <span className="l">Cycle Completed</span>
                  </div>
                  <div className="safi-history-stat-col">
                    <span className="v">₦{Math.round(stats.spent).toLocaleString()}</span>
                    <span className="l">Spend Pool Used</span>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="safi-history-expanded-box">
                    <div className="safi-setup-table-row">
                      <span className="safi-setup-label">Spend Pool Limit</span>
                      <span className="safi-setup-val">₦{Math.round(stats.allocation).toLocaleString()}</span>
                    </div>
                    <div className="safi-setup-table-row">
                      <span className="safi-setup-label">Reserve Protected</span>
                      <span className="safi-setup-val" style={{ color: '#10B981', fontWeight: 'bold' }}>
                        ₦{Math.round(stats.protectedSum).toLocaleString()}
                      </span>
                    </div>
                    <div className="safi-setup-table-row">
                      <span className="safi-setup-label">Overrides</span>
                      <span className="safi-setup-val">
                        {cycle.overrideCount || (cycle.outcome === 'over_budget' ? 1 : 0)} times
                      </span>
                    </div>
                    <div className="safi-setup-table-row" style={{ borderBottom: 'none' }}>
                      <span className="safi-setup-label">Outcome</span>
                      <span
                        className="safi-setup-val"
                        style={{
                          color: cycle.outcome === 'over_budget' ? '#EF4444' : '#10B981',
                          fontWeight: 'bold',
                        }}
                      >
                        {cycle.outcome === 'over_budget' ? 'Over Budget' : 'Safe Completion'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '12px', textAlign: 'center' }}>
                    Click to view full cycle breakdown
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
