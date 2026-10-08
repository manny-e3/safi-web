import React, { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import safiConfigService from '../../services/safiConfigService';

export default function SafiProtectionScreen({
  cardBehaviour,
  setCardBehaviour,
  governanceMode,
  totalBalance,
  spendAllocation,
  isSafiActive,
  setIsSafiActive,
  onNavigate,
  accountNumber,
  cycleFrequency,
  customDays,
  onConfigSaved,
  triggerNotification,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('Hard Decline');
  const [selectedBuffer, setSelectedBuffer] = useState('5,000');
  const [allowedBehaviours, setAllowedBehaviours] = useState(null);

  // Initialize selected types from existing cardBehaviour string
  useEffect(() => {
    if (cardBehaviour?.startsWith('Buffer') || cardBehaviour === 'buffer') {
      setSelectedType('Buffer');
      const amtMatch = cardBehaviour.match(/([\d,]+)/);
      if (amtMatch && amtMatch[1]) {
        setSelectedBuffer(amtMatch[1]);
      }
    } else if (cardBehaviour === 'Auto Cover' || cardBehaviour === 'auto_cover') {
      setSelectedType('Auto Cover');
    } else {
      setSelectedType('Hard Decline');
    }
  }, [cardBehaviour]);

  // Fetch allowed card behaviours from institutional controls
  useEffect(() => {
    let active = true;
    const fetchControls = async () => {
      try {
        const result = await safiConfigService.getControls();
        if (result && active) {
          const data = result.data || result;
          const modeCfg = data?.modeConfigurations?.[governanceMode];
          if (modeCfg && Array.isArray(modeCfg.allowedBehaviours)) {
            setAllowedBehaviours(modeCfg.allowedBehaviours);
          } else if (Array.isArray(data?.allowedBehaviours)) {
            setAllowedBehaviours(data.allowedBehaviours);
          }
        }
      } catch (err) {
        console.error('Failed to fetch allowed card behaviours:', err);
      }
    };
    fetchControls();
    return () => { active = false; };
  }, [governanceMode]);

  const totalInc = Math.max(0, Math.floor(totalBalance || 0));
  const safeSpendAllocation = Math.min(totalInc, Math.max(0, spendAllocation));
  const protectedSumVal = Math.max(0, totalInc - safeSpendAllocation);
  const isStrict = governanceMode === 'Strict';

  const handleSelectType = (type) => {
    if (allowedBehaviours && !allowedBehaviours.includes(type)) {
      alert(`${type} is disabled by your bank for ${governanceMode} Mode.`);
      return;
    }
    if (type === 'Buffer' && isStrict) {
      alert('Buffer is only available in Flexible Mode.');
      return;
    }
    setSelectedType(type);
    if (type === 'Hard Decline') {
      setCardBehaviour('Hard Decline');
    } else if (type === 'Auto Cover') {
      setCardBehaviour('Auto Cover');
    } else if (type === 'Buffer') {
      setCardBehaviour(`Buffer (₦${selectedBuffer})`);
    }
  };

  const handleSelectBuffer = (amount) => {
    setSelectedBuffer(amount);
    setCardBehaviour(`Buffer (₦${amount})`);
  };

  const handleLockIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const incomeInNaira = Math.round(totalInc);
      const protectedSumInNaira = Math.round(protectedSumVal);

      let backendCardBehaviour = 'hard_decline';
      let bufferAmountVal = 0;
      if (selectedType === 'Auto Cover') {
        backendCardBehaviour = 'auto_cover';
      } else if (selectedType === 'Buffer') {
        backendCardBehaviour = 'buffer';
        bufferAmountVal = parseInt(selectedBuffer.replace(/,/g, ''), 10);
      }

      const payload = {
        accountNumber,
        income: incomeInNaira,
        protectedSum: protectedSumInNaira,
        governanceMode: governanceMode.toLowerCase(),
        frequency: (cycleFrequency || 'monthly').toLowerCase(),
        customDays: cycleFrequency === 'Custom' ? parseInt(customDays, 10) : null,
        cardBehaviour: backendCardBehaviour,
        bufferAmount: bufferAmountVal,
      };

      const result = await safiConfigService.saveConfig(accountNumber, payload);

      if (result) {
        setIsSafiActive(true);
        if (onConfigSaved) {
          onConfigSaved(result);
        }

        if (isSafiActive) {
          triggerNotification?.(
            'Your SAFI settings have been updated successfully. Your new settings will be used going forward.',
            'success'
          );
          onNavigate('settings');
        } else {
          triggerNotification?.(
            "Welcome to SAFI! Your Financial Cycle has started. We'll help you complete this cycle without touching your Reserve.",
            'success'
          );
          onNavigate('safi_success');
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to lock in SAFI configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="safi-screen-content">
        <h1 className="safi-serif-title" style={{ fontSize: '26px' }}>
          Choose your Card Protection
        </h1>
        <p className="safi-screen-subtitle">
          Choose what happens when your Spend Pool can no longer complete a transaction.
        </p>

        {/* Hard Decline Option */}
        <div
          className={`safi-protection-card ${selectedType === 'Hard Decline' ? 'active' : ''}`}
          onClick={() => handleSelectType('Hard Decline')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: selectedType === 'Hard Decline' ? '#FFFFFF' : '#8F929C' }}>
              Hard Decline
            </span>
            <div className="safi-radio-circle">
              {selectedType === 'Hard Decline' && <div className="safi-radio-dot" />}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.5' }}>
            Your transaction is declined. Your Reserve remains protected.
          </div>
        </div>

        {/* Auto Cover Option */}
        <div
          className={`safi-protection-card ${selectedType === 'Auto Cover' ? 'active' : ''}`}
          onClick={() => handleSelectType('Auto Cover')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: selectedType === 'Auto Cover' ? '#FFFFFF' : '#8F929C' }}>
              Auto Cover
            </span>
            <div className="safi-radio-circle">
              {selectedType === 'Auto Cover' && <div className="safi-radio-dot" />}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.5' }}>
            Complete the transaction using your Reserve. You’ll be notified immediately after.
          </div>
        </div>

        {/* Buffer Option */}
        <div
          className={`safi-protection-card ${selectedType === 'Buffer' ? 'active' : ''} ${isStrict ? 'disabled' : ''}`}
          onClick={() => !isStrict && handleSelectType('Buffer')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: selectedType === 'Buffer' && !isStrict ? '#FFFFFF' : '#8F929C' }}>
                Buffer
              </span>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                (Flexible Mode only)
              </span>
            </div>
            <div className="safi-radio-circle">
              {selectedType === 'Buffer' && !isStrict && <div className="safi-radio-dot" />}
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.5' }}>
            Continue spending using your Buffer before Hard Decline applies.
          </div>

          {/* Buffer Amounts Grid */}
          {selectedType === 'Buffer' && !isStrict && (
            <div className="safi-buffer-pills-grid">
              {['5,000', '10,000', '20,000', '50,000'].map((amt) => {
                const isActive = selectedBuffer === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    className={`safi-buffer-pill ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBuffer(amt);
                    }}
                  >
                    ₦{amt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="safi-widget-footer">
        <button
          className="safi-btn-primary"
          onClick={handleLockIn}
          disabled={loading}
          id="safi-activate-btn"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>{isSafiActive ? 'Save changes' : 'Activate SAFI'}</span>
              <Shield size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
