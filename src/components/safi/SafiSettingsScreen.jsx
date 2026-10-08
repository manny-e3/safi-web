import React, { useState } from 'react';
import {
  User,
  Database,
  Calendar,
  Sliders,
  CreditCard,
  PauseCircle,
  Bell,
  Power,
  LogOut,
  ChevronRight,
  Moon,
} from 'lucide-react';
import safiConfigService from '../../services/safiConfigService';

export default function SafiSettingsScreen({
  fullName,
  accountNumber,
  spendAllocation,
  governanceMode,
  cardBehaviour,
  cycleFrequency,
  safiDashboard,
  isSafiPaused,
  setIsSafiPaused,
  setIsSafiActive,
  onNavigate,
  onDeactivateSafi,
  onLogout,
  triggerNotification,
}) {
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true);
  const [isTogglingPause, setIsTogglingPause] = useState(false);

  const complianceScore = safiDashboard?.complianceScore !== undefined
    ? safiDashboard.complianceScore
    : 72;

  const handleTogglePause = async (e) => {
    e.stopPropagation();
    if (isTogglingPause || !accountNumber) return;
    setIsTogglingPause(true);
    try {
      if (!isSafiPaused) {
        await safiConfigService.pauseConfig(accountNumber);
        setIsSafiPaused(true);
        triggerNotification?.(
          'SAFI has been paused. Behaviour tracking and notifications are temporarily suspended.',
          'success'
        );
      } else {
        await safiConfigService.resumeConfig(accountNumber);
        setIsSafiPaused(false);
        triggerNotification?.(
          'Welcome back. SAFI is active again and your Financial Cycle has resumed.',
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      triggerNotification?.(err.message || 'Failed to update SAFI pause status.', 'error');
    } finally {
      setIsTogglingPause(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate SAFI? Your Spend Pool rules will be removed.')) {
      return;
    }
    try {
      if (accountNumber) {
        await safiConfigService.deactivateConfig(accountNumber);
      }
      setIsSafiActive(false);
      triggerNotification?.('SAFI has been deactivated. Your bank balance remains unchanged.', 'success');
      if (onDeactivateSafi) {
        onDeactivateSafi();
      } else {
        onNavigate('home');
      }
    } catch (err) {
      console.error(err);
      triggerNotification?.(err.message || 'Failed to deactivate SAFI.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <div className="safi-cycle-bar-header">SETTINGS</div>

        {/* Profile Card */}
        <div className="safi-settings-profile-card">
          <div className="safi-avatar-circle">
            <User size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF' }}>
              {fullName || 'Institutional Account'}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
              {accountNumber ? `ACCT: ${accountNumber}` : 'Meridian Account'}
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '600', marginTop: '2px' }}>
              {isSafiPaused ? '⏸️ SAFI is paused' : '🛡️ SAFI constraints active'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981' }}>{complianceScore}</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Behaviour</div>
          </div>
        </div>

        {/* SPEND POOL GROUP */}
        <div className="safi-settings-group-title">SPEND POOL</div>
        <div className="safi-settings-card">
          <div className="safi-settings-item" onClick={() => onNavigate('safi_frequency')}>
            <div className="safi-settings-icon-wrap">
              <Database size={18} color="#10B981" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Spend pool</div>
              <div className="safi-settings-item-sub">{cycleFrequency || 'Monthly'} cycle</div>
            </div>
            <span className="safi-settings-item-value">₦{Math.round(spendAllocation || 0).toLocaleString()}</span>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>

          <div className="safi-settings-item" onClick={() => alert('Leftover funds automatically roll into your Reserve at the end of every cycle.')}>
            <div className="safi-settings-icon-wrap">
              <Calendar size={18} color="#10B981" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Cycle end behaviour</div>
              <div className="safi-settings-item-sub">Leftover funds</div>
            </div>
            <span className="safi-settings-item-value" style={{ color: '#10B981' }}>Reserved</span>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>
        </div>

        {/* PROTECTION GROUP */}
        <div className="safi-settings-group-title">PROTECTION</div>
        <div className="safi-settings-card">
          <div className="safi-settings-item" onClick={() => onNavigate('safi_mode')}>
            <div className="safi-settings-icon-wrap">
              <Sliders size={18} color="#10B981" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Protection mode</div>
              <div className="safi-settings-item-sub">Override handling</div>
            </div>
            <span className="safi-settings-item-value">{governanceMode || 'Flexible'}</span>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>

          <div className="safi-settings-item" onClick={() => onNavigate('safi_protection')}>
            <div className="safi-settings-icon-wrap">
              <CreditCard size={18} color="#EF4444" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Card protection</div>
              <div className="safi-settings-item-sub">Allocation exhausted</div>
            </div>
            <span className="safi-settings-item-value">{cardBehaviour || 'Hard Decline'}</span>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>

          <div className="safi-settings-item" onClick={handleTogglePause}>
            <div className="safi-settings-icon-wrap">
              <PauseCircle size={18} color="#9CA3AF" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Pause SAFI</div>
              <div className="safi-settings-item-sub">Suspend protection temporarily</div>
            </div>
            <div className={`safi-toggle-switch ${isSafiPaused ? 'active' : ''}`}>
              <div className="safi-toggle-knob" />
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS GROUP */}
        <div className="safi-settings-group-title">NOTIFICATIONS</div>
        <div className="safi-settings-card">
          <div className="safi-settings-item" onClick={() => setPushAlertsEnabled(!pushAlertsEnabled)}>
            <div className="safi-settings-icon-wrap">
              <Bell size={18} color="#10B981" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label">Push alerts</div>
              <div className="safi-settings-item-sub">Pace & threshold notifications</div>
            </div>
            <div className={`safi-toggle-switch ${pushAlertsEnabled ? 'active' : ''}`}>
              <div className="safi-toggle-knob" />
            </div>
          </div>
        </div>

        {/* DANGER & SESSION GROUP */}
        <div className="safi-settings-group-title">ACTIONS</div>
        <div className="safi-settings-card" style={{ marginBottom: '24px' }}>
          <div className="safi-settings-item" onClick={handleDeactivate}>
            <div className="safi-settings-icon-wrap">
              <Power size={18} color="#EF4444" />
            </div>
            <div className="safi-settings-text">
              <div className="safi-settings-item-label" style={{ color: '#EF4444' }}>Deactivate SAFI</div>
              <div className="safi-settings-item-sub">Remove Spend Pool rules (Funds unaffected)</div>
            </div>
            <ChevronRight size={18} color="#EF4444" />
          </div>

          {onLogout && (
            <div className="safi-settings-item" onClick={onLogout}>
              <div className="safi-settings-icon-wrap">
                <LogOut size={18} color="#EF4444" />
              </div>
              <div className="safi-settings-text">
                <div className="safi-settings-item-label" style={{ color: '#EF4444' }}>Log Out</div>
                <div className="safi-settings-item-sub">End active banking session</div>
              </div>
              <ChevronRight size={18} color="#EF4444" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
