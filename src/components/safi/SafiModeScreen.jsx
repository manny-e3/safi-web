import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import safiConfigService from '../../services/safiConfigService';

export default function SafiModeScreen({
  governanceMode,
  setGovernanceMode,
  onNavigate,
}) {
  const [activeModes, setActiveModes] = useState(['Flexible', 'Strict']);
  const [loadingControls, setLoadingControls] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchControls = async () => {
      try {
        const result = await safiConfigService.getControls();
        if (result && active) {
          const data = result.data || result;
          let modes = [];
          if (data && data.modeConfigurations) {
            modes = Object.entries(data.modeConfigurations)
              .filter(([_, cfg]) => cfg && cfg.status === 'ACTIVE')
              .map(([m]) => m);
          } else if (data && Array.isArray(data.activeModes)) {
            modes = data.activeModes;
          }

          if (modes.length > 0) {
            setActiveModes(modes);
            const formatted = modes.map((m) => m.toLowerCase());
            const currentLower = (governanceMode || '').toLowerCase();
            if (!formatted.includes(currentLower)) {
              const firstMode = modes[0];
              const normalized = firstMode.charAt(0).toUpperCase() + firstMode.slice(1).toLowerCase();
              setGovernanceMode(normalized);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch governance controls:', err);
      } finally {
        if (active) setLoadingControls(false);
      }
    };
    fetchControls();
    return () => { active = false; };
  }, [governanceMode, setGovernanceMode]);

  const isFlexibleActive = activeModes.some((m) => m.toLowerCase() === 'flexible');
  const isStrictActive = activeModes.some((m) => m.toLowerCase() === 'strict');

  if (loadingControls) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={32} className="animate-spin" color="#10B981" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <h1 className="safi-serif-title" style={{ fontSize: '26px' }}>
          Choose your mode
        </h1>
        <p className="safi-screen-subtitle">
          Institutional rules govern how SAFI guards your Spend Pool and Reserve.
        </p>

        {/* Flexible Option Card */}
        {isFlexibleActive && (
          <div
            className={`safi-mode-card ${governanceMode === 'Flexible' ? 'active' : ''}`}
            onClick={() => setGovernanceMode('Flexible')}
          >
            <div className="safi-mode-card-header">
              <div className="safi-mode-icon-circle">
                <Activity size={18} />
              </div>
              <div className="safi-mode-title">
                Flexible Mode (Recommended)
              </div>
              {governanceMode === 'Flexible' && (
                <CheckCircle2 size={18} color="#10B981" />
              )}
            </div>
            <div className="safi-mode-desc-list">
              Stay in control while keeping your Reserve protected.
              <div style={{ marginTop: '8px' }}>
                <div>• Safe Spend is a daily recommendation.</div>
                <div>• Override is available when needed.</div>
                <div>• Card Protection options available.</div>
              </div>
            </div>
          </div>
        )}

        {/* Strict Option Card */}
        {isStrictActive && (
          <div
            className={`safi-mode-card ${governanceMode === 'Strict' ? 'active' : ''}`}
            onClick={() => setGovernanceMode('Strict')}
          >
            <div className="safi-mode-card-header">
              <div className="safi-mode-icon-circle">
                <Lock size={18} />
              </div>
              <div className="safi-mode-title">
                Strict Mode
              </div>
              {governanceMode === 'Strict' && (
                <CheckCircle2 size={18} color="#10B981" />
              )}
            </div>
            <div className="safi-mode-desc-list">
              Maximum spending discipline.
              <div style={{ marginTop: '8px' }}>
                <div>• Safe Spend becomes your daily limit.</div>
                <div>• Exceeding it triggers Override.</div>
                <div>• Buffer is unavailable.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={() => onNavigate('safi_protection')}
          id="safi-mode-next-btn"
        >
          <span>Continue</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
