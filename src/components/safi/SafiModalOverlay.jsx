import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  LayoutGrid,
  BarChart2,
  Clock,
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import SafiWelcomeScreen from './SafiWelcomeScreen';
import SafiFrequencyScreen from './SafiFrequencyScreen';
import SafiSplitScreen from './SafiSplitScreen';
import SafiModeScreen from './SafiModeScreen';
import SafiProtectionScreen from './SafiProtectionScreen';
import SafiSuccessScreen from './SafiSuccessScreen';
import SafiHomeScreen from './SafiHomeScreen';
import SafiInsightsScreen from './SafiInsightsScreen';
import SafiHistoryScreen from './SafiHistoryScreen';
import SafiSettingsScreen from './SafiSettingsScreen';
import SafiOverrideScreen from './SafiOverrideScreen';
import safiConfigService from '../../services/safiConfigService';
import './Safi.css';

export default function SafiModalOverlay({
  isOpen,
  onClose,
  initialScreen = 'safi_welcome',
  currentUser,
  wallet,
  totalBalance = 0,
  safiConfig = null,
  onConfigSaved,
  onDeactivateSafi,
  onLogout,
  pendingTransfer = null,
  onApproveTransfer = null,
  onCancelTransfer = null,
}) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);

  // SAFI Cycle & Rule States
  const [cycleFrequency, setCycleFrequency] = useState(() => {
    if (safiConfig?.frequency) {
      return safiConfig.frequency.charAt(0).toUpperCase() + safiConfig.frequency.slice(1);
    }
    return 'Monthly';
  });
  const [customDays, setCustomDays] = useState(() => safiConfig?.customDays || 15);

  const [spendAllocation, setSpendAllocation] = useState(() => {
    if (safiConfig?.income && safiConfig?.protectedSum) {
      let inc = Number(safiConfig.income);
      let prot = Number(safiConfig.protectedSum);
      if (totalBalance > 0 && prot > totalBalance * 2) {
        inc = Math.round(inc / 100);
        prot = Math.round(prot / 100);
      }
      return Math.max(0, inc - prot);
    }
    return Math.round((totalBalance || 1000000) * 0.65);
  });

  const [governanceMode, setGovernanceMode] = useState(() => {
    if (safiConfig?.governanceMode) {
      return safiConfig.governanceMode.charAt(0).toUpperCase() + safiConfig.governanceMode.slice(1);
    }
    return 'Flexible';
  });

  const [cardBehaviour, setCardBehaviour] = useState(() => {
    if (safiConfig?.cardBehaviour === 'auto_cover') return 'Auto Cover';
    if (safiConfig?.cardBehaviour === 'buffer') {
      let buf = Number(safiConfig.bufferAmount || 0);
      if (buf > 100000) buf = Math.round(buf / 100);
      const amt = buf ? buf.toLocaleString() : '10,000';
      return `Buffer (₦${amt})`;
    }
    return 'Hard Decline';
  });

  const [isSafiActive, setIsSafiActive] = useState(() => Boolean(safiConfig));
  const [isSafiPaused, setIsSafiPaused] = useState(() => Boolean(safiConfig?.isPaused));

  // Live Backend SAFI Metrics & History
  const [safiDashboard, setSafiDashboard] = useState(null);
  const [safiHistory, setSafiHistory] = useState(null);
  const [notification, setNotification] = useState(null);

  const accountNumber = wallet?.accountNumber;

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Sync initial screen when prop changes
  useEffect(() => {
    if (initialScreen) {
      setCurrentScreen(initialScreen);
    }
  }, [initialScreen, isOpen]);

  // Sync active safiConfig state
  useEffect(() => {
    if (safiConfig) {
      setIsSafiActive(true);
      setIsSafiPaused(Boolean(safiConfig.isPaused));
      if (safiConfig.frequency) {
        setCycleFrequency(safiConfig.frequency.charAt(0).toUpperCase() + safiConfig.frequency.slice(1));
      }
      if (safiConfig.governanceMode) {
        setGovernanceMode(safiConfig.governanceMode.charAt(0).toUpperCase() + safiConfig.governanceMode.slice(1));
      }
      if (safiConfig.cardBehaviour) {
        if (safiConfig.cardBehaviour === 'auto_cover') setCardBehaviour('Auto Cover');
        else if (safiConfig.cardBehaviour === 'buffer') {
          let buf = Number(safiConfig.bufferAmount || 0);
          if (buf > 100000) buf = Math.round(buf / 100);
          const amt = buf ? buf.toLocaleString() : '10,000';
          setCardBehaviour(`Buffer (₦${amt})`);
        } else {
          setCardBehaviour('Hard Decline');
        }
      }
      if (safiConfig.income && safiConfig.protectedSum) {
        let inc = Number(safiConfig.income);
        let prot = Number(safiConfig.protectedSum);
        if (totalBalance > 0 && prot > totalBalance * 2) {
          inc = Math.round(inc / 100);
          prot = Math.round(prot / 100);
        }
        setSpendAllocation(Math.max(0, inc - prot));
      }
    }
  }, [safiConfig]);

  // Fetch live Dashboard & History records
  const fetchSafiData = useCallback(async () => {
    if (!accountNumber) return;
    try {
      const [dash, hist] = await Promise.all([
        safiConfigService.getDashboard(accountNumber).catch(() => null),
        safiConfigService.getHistory(accountNumber).catch(() => null),
      ]);
      if (dash) setSafiDashboard(dash);
      if (hist) setSafiHistory(hist);
    } catch (err) {
      console.warn('Could not fetch SAFI dashboard/history:', err);
    }
  }, [accountNumber]);

  useEffect(() => {
    if (isOpen && accountNumber) {
      fetchSafiData();
    }
  }, [isOpen, accountNumber, fetchSafiData]);

  if (!isOpen) return null;

  // Back button handler
  const handleBack = () => {
    if (currentScreen === 'safi_welcome') onClose();
    else if (currentScreen === 'safi_frequency') setCurrentScreen('safi_welcome');
    else if (currentScreen === 'safi_split') setCurrentScreen('safi_frequency');
    else if (currentScreen === 'safi_mode') setCurrentScreen('safi_split');
    else if (currentScreen === 'safi_protection') setCurrentScreen('safi_mode');
    else if (currentScreen === 'safi_success') onClose();
    else if (currentScreen === 'dashboard') onClose();
    else if (currentScreen === 'insights') setCurrentScreen('dashboard');
    else if (currentScreen === 'history') setCurrentScreen('dashboard');
    else if (currentScreen === 'settings') setCurrentScreen('dashboard');
    else if (currentScreen === 'override') onClose();
    else onClose();
  };

  const showBackButton = !['safi_welcome', 'safi_success', 'dashboard', 'override'].includes(currentScreen);
  const isOnboarding = ['safi_welcome', 'safi_frequency', 'safi_split', 'safi_mode', 'safi_protection', 'safi_success'].includes(currentScreen);
  const isTabBarVisible = ['dashboard', 'insights', 'history', 'settings'].includes(currentScreen);

  const getProgressWidth = () => {
    switch (currentScreen) {
      case 'safi_welcome': return '16%';
      case 'safi_frequency': return '33%';
      case 'safi_split': return '50%';
      case 'safi_mode': return '66%';
      case 'safi_protection': return '83%';
      case 'safi_success': return '100%';
      default: return '100%';
    }
  };

  return (
    <div className="safi-overlay-backdrop">
      <div className="safi-modal-card">
        {/* Header */}
        <div className="safi-widget-header">
          <button
            className={`safi-header-btn ${!showBackButton ? 'hidden' : ''}`}
            onClick={handleBack}
            title="Go back"
            disabled={!showBackButton}
          >
            <ArrowLeft size={18} />
          </button>

          <div className="safi-header-title-box">
            <div className="safi-header-brand">
              <span>SAFI</span>
              <span className="safi-header-brand-badge">SHIELD</span>
            </div>
            <div className="safi-header-via">Meridian Bank Institutional</div>
          </div>

          <button
            className="safi-header-btn"
            onClick={onClose}
            title="Close SAFI"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar for Onboarding steps */}
        {isOnboarding && (
          <div className="safi-progress-track">
            <div
              className="safi-progress-fill"
              style={{ width: getProgressWidth() }}
            />
          </div>
        )}

        {/* Screen Switcher */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {currentScreen === 'safi_welcome' && (
            <SafiWelcomeScreen onNavigate={(s) => setCurrentScreen(s)} />
          )}

          {currentScreen === 'safi_frequency' && (
            <SafiFrequencyScreen
              cycleFrequency={cycleFrequency}
              setCycleFrequency={setCycleFrequency}
              customDays={customDays}
              setCustomDays={setCustomDays}
              totalBalance={totalBalance}
              setSpendAllocation={setSpendAllocation}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'safi_split' && (
            <SafiSplitScreen
              totalBalance={totalBalance}
              spendAllocation={spendAllocation}
              setSpendAllocation={setSpendAllocation}
              cycleFrequency={cycleFrequency}
              customDays={customDays}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'safi_mode' && (
            <SafiModeScreen
              governanceMode={governanceMode}
              setGovernanceMode={setGovernanceMode}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'safi_protection' && (
            <SafiProtectionScreen
              cardBehaviour={cardBehaviour}
              setCardBehaviour={setCardBehaviour}
              governanceMode={governanceMode}
              totalBalance={totalBalance}
              spendAllocation={spendAllocation}
              isSafiActive={isSafiActive}
              setIsSafiActive={setIsSafiActive}
              onNavigate={(s) => setCurrentScreen(s)}
              accountNumber={accountNumber}
              cycleFrequency={cycleFrequency}
              customDays={customDays}
              onConfigSaved={(saved) => {
                fetchSafiData();
                if (onConfigSaved) onConfigSaved(saved);
              }}
              triggerNotification={triggerNotification}
            />
          )}

          {currentScreen === 'safi_success' && (
            <SafiSuccessScreen
              totalBalance={totalBalance}
              spendAllocation={spendAllocation}
              cycleFrequency={cycleFrequency}
              governanceMode={governanceMode}
              cardBehaviour={cardBehaviour}
              onNavigate={(s) => {
                if (s === 'dashboard') {
                  fetchSafiData();
                  setCurrentScreen('dashboard');
                } else {
                  onClose();
                }
              }}
            />
          )}

          {currentScreen === 'dashboard' && (
            <SafiHomeScreen
              spendAllocation={spendAllocation}
              totalBalance={totalBalance}
              safiDashboard={safiDashboard}
              safiHistory={safiHistory}
              onRefresh={fetchSafiData}
            />
          )}

          {currentScreen === 'insights' && (
            <SafiInsightsScreen
              totalBalance={totalBalance}
              spendAllocation={spendAllocation}
              safiDashboard={safiDashboard}
            />
          )}

          {currentScreen === 'history' && (
            <SafiHistoryScreen
              safiHistory={safiHistory}
              onRefresh={fetchSafiData}
            />
          )}

          {currentScreen === 'settings' && (
            <SafiSettingsScreen
              fullName={currentUser?.name}
              accountNumber={accountNumber}
              spendAllocation={spendAllocation}
              governanceMode={governanceMode}
              cardBehaviour={cardBehaviour}
              cycleFrequency={cycleFrequency}
              safiDashboard={safiDashboard}
              isSafiPaused={isSafiPaused}
              setIsSafiPaused={setIsSafiPaused}
              setIsSafiActive={setIsSafiActive}
              onNavigate={(s) => setCurrentScreen(s)}
              onDeactivateSafi={onDeactivateSafi}
              onLogout={onLogout}
              triggerNotification={triggerNotification}
            />
          )}

          {currentScreen === 'override' && (
            <SafiOverrideScreen
              pendingTransfer={pendingTransfer}
              totalBalance={totalBalance}
              spendAllocation={spendAllocation}
              onApprove={(overrideData) => {
                if (onApproveTransfer) onApproveTransfer(overrideData);
                onClose();
              }}
              onCancel={() => {
                if (onCancelTransfer) onCancelTransfer();
                onClose();
              }}
            />
          )}
        </div>

        {/* Tab Bar for Active SAFI */}
        {isTabBarVisible && (
          <div className="safi-widget-tab-bar">
            <button
              className={`safi-tab-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('dashboard')}
            >
              <LayoutGrid size={18} />
              <span>Home</span>
            </button>
            <button
              className={`safi-tab-item ${currentScreen === 'insights' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('insights')}
            >
              <BarChart2 size={18} />
              <span>Insights</span>
            </button>
            <button
              className={`safi-tab-item ${currentScreen === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('history')}
            >
              <Clock size={18} />
              <span>History</span>
            </button>
            <button
              className={`safi-tab-item ${currentScreen === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('settings')}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        )}

        {/* Toast Notification */}
        {notification && (
          <div
            style={{
              position: 'absolute',
              top: '64px',
              left: '20px',
              right: '20px',
              backgroundColor: '#17181C',
              borderRadius: '12px',
              border: '1.5px solid #2E3039',
              borderLeft: `4px solid ${notification.type === 'success' ? '#10B981' : '#EF4444'}`,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 99999,
              animation: 'safiFadeIn 0.2s ease-out',
            }}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} color="#10B981" />
            ) : (
              <AlertTriangle size={20} color="#EF4444" />
            )}
            <div style={{ flex: 1, fontSize: '13px', color: '#FFFFFF', lineHeight: '1.4' }}>
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
