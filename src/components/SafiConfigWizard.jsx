import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Sliders,
  Info,
  Calendar,
  CreditCard,
  Lock,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import safiConfigService from '../services/safiConfigService';

export default function SafiConfigWizard({
  accountNumber,
  totalBalance = 0,
  initialConfig = null,
  onNavigate,
  onConfigSaved,
}) {
  // Step tracker (1 to 5, plus 'success' screen)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Cycle Frequency
  const [frequency, setFrequency] = useState(() => {
    if (initialConfig?.frequency) {
      return initialConfig.frequency.charAt(0).toUpperCase() + initialConfig.frequency.slice(1);
    }
    return 'Monthly';
  });
  const [customDays, setCustomDays] = useState(() => initialConfig?.customDays || 15);

  // Step 2: Income & Allocation
  const [workingIncome, setWorkingIncome] = useState(() => {
    if (initialConfig?.income) return Number(initialConfig.income);
    return totalBalance > 0 ? totalBalance : 1000000;
  });

  const [spendAllocation, setSpendAllocation] = useState(() => {
    if (initialConfig?.income && initialConfig?.protectedSum) {
      return Math.max(0, Number(initialConfig.income) - Number(initialConfig.protectedSum));
    }
    const base = totalBalance > 0 ? totalBalance : 1000000;
    return Math.round(base * 0.44); // default ~44% spendable, ~56% protected
  });

  // Step 3: Governance Mode
  const [governanceMode, setGovernanceMode] = useState(() => {
    if (initialConfig?.governanceMode) {
      return initialConfig.governanceMode.charAt(0).toUpperCase() + initialConfig.governanceMode.slice(1);
    }
    return 'Flexible';
  });
  const [allowedModes, setAllowedModes] = useState(['Flexible', 'Strict']);

  // Step 4: Card Protection Behaviour
  const [cardBehaviour, setCardBehaviour] = useState(() => {
    if (initialConfig?.cardBehaviour === 'auto_cover') return 'Auto Cover';
    if (initialConfig?.cardBehaviour === 'buffer') return 'Buffer';
    return 'Hard Decline';
  });
  const [bufferAmount, setBufferAmount] = useState(() => {
    if (initialConfig?.bufferAmount) return Number(initialConfig.bufferAmount);
    return 10000;
  });

  // Submission & Async states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedConfig, setSavedConfig] = useState(null);

  // Compute derived cycle days
  const getCycleDays = () => {
    switch (frequency) {
      case 'Weekly':
        return 7;
      case 'Biweekly':
        return 14;
      case 'Monthly':
        return 30;
      case 'Custom':
        return Math.max(1, parseInt(customDays) || 1);
      default:
        return 30;
    }
  };

  const cycleDays = getCycleDays();
  const protectedSum = Math.max(0, workingIncome - spendAllocation);
  const safeDailySpend = Math.round(spendAllocation / cycleDays);

  // Fetch institutional controls
  useEffect(() => {
    let isMounted = true;
    safiConfigService
      .getControls()
      .then((controls) => {
        if (!isMounted || !controls) return;
        const modes = [];
        if (controls.modeConfigurations) {
          Object.entries(controls.modeConfigurations).forEach(([modeName, cfg]) => {
            if (cfg?.status === 'ACTIVE') modes.push(modeName);
          });
        } else if (Array.isArray(controls.activeModes)) {
          modes.push(...controls.activeModes);
        }
        if (modes.length > 0) {
          setAllowedModes(modes);
        }
      })
      .catch((err) => console.warn('Could not fetch controls:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Wizard Steps metadata for Stepper sidebar
  const steps = [
    { num: 1, title: 'Financial Cycle', subtitle: `${frequency} (${cycleDays}d)` },
    { num: 2, title: 'Spend Pool & Reserve', subtitle: `₦${spendAllocation.toLocaleString()}` },
    { num: 3, title: 'Governance Mode', subtitle: `${governanceMode} Mode` },
    { num: 4, title: 'Card Protection', subtitle: cardBehaviour },
    { num: 5, title: 'Review & Activate', subtitle: 'Confirm & Lock-in' },
  ];

  // Submit and lock in SAFI rules
  const handleLockInRules = async () => {
    if (!accountNumber) {
      setErrorMessage('No active core banking account number found.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let apiCardBehaviour = 'hard_decline';
      let apiBufferAmount = 0;

      if (cardBehaviour === 'Auto Cover') {
        apiCardBehaviour = 'auto_cover';
      } else if (cardBehaviour === 'Buffer') {
        apiCardBehaviour = 'buffer';
        apiBufferAmount = Number(bufferAmount);
      }

      const payload = {
        accountNumber: String(accountNumber).trim(),
        income: workingIncome,
        protectedSum: protectedSum,
        governanceMode: governanceMode.toLowerCase(),
        frequency: frequency.toLowerCase(),
        customDays: frequency === 'Custom' ? parseInt(customDays) : undefined,
        cardBehaviour: apiCardBehaviour,
        bufferAmount: apiBufferAmount,
      };

      const result = await safiConfigService.saveConfig(accountNumber, payload);
      setSavedConfig(result);

      if (onConfigSaved) {
        onConfigSaved(result);
      }

      setCurrentStep('success');
    } catch (err) {
      console.error('Error locking in SAFI config:', err);
      setErrorMessage(err.message || 'Failed to activate SAFI configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wizard-page">
      {/* Top Header Bar */}
      <div className="wizard-top-bar">
        <div className="wizard-brand">
          <Shield size={22} color="#0F172A" />
          <span>SAFI Core Enterprise Governance</span>
        </div>
        <button
          className="save-exit-btn"
          onClick={() => onNavigate('safi_dashboard')}
        >
          <span>Save & Exit</span>
          <X size={16} />
        </button>
      </div>

      {/* Main Wizard Body */}
      <div className="wizard-body">
        {/* Left Stepper Navigation */}
        <div className="wizard-stepper-col">
          <div className="stepper-header">CONFIGURATION WIZARD</div>
          <div className="stepper-timeline">
            {steps.map((s) => {
              const isCompleted = currentStep === 'success' || currentStep > s.num;
              const isActive = currentStep === s.num;

              return (
                <div key={s.num} className="stepper-step">
                  <div
                    className={`step-indicator ${
                      isCompleted ? 'completed' : isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      s.num
                    )}
                  </div>
                  <div className="step-text">
                    <div className={`step-title ${!isActive && !isCompleted ? 'inactive' : ''}`}>
                      {s.title}
                    </div>
                    <div className="step-subtitle">{s.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 'auto',
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #E2E8F0',
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F766E', marginBottom: '4px' }}>
              <ShieldCheck size={16} />
              <span>Institutional Protocol</span>
            </div>
            Rules enforced deterministically at the transaction engine before funds are released.
          </div>
        </div>

        {/* Wizard Content Column */}
        <div className="wizard-content-col">
          {/* =========================================================================
              STEP 1: FINANCIAL CYCLE / FREQUENCY
             ========================================================================= */}
          {currentStep === 1 && (
            <>
              <span className="wizard-step-label">Step 1 of 5</span>
              <h1 className="wizard-main-heading">
                Choose your Financial Cycle
              </h1>
              <p className="wizard-subtitle">
                Determines how often SAFI evaluates spending velocity, tracks reserves, and resets your Spend Pool.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[
                  { id: 'Weekly', title: 'Weekly', days: '7 Days', desc: 'Short sprint for rapid velocity monitoring' },
                  { id: 'Biweekly', title: 'Biweekly', days: '14 Days', desc: 'Ideal for bi-monthly payroll & expense cycles' },
                  { id: 'Monthly', title: 'Monthly', days: '30 Days', desc: 'Standard enterprise cycle (Recommended)' },
                  { id: 'Custom', title: 'Custom Days', days: `${customDays} Days`, desc: 'Specify custom duration for project milestones' },
                ].map((item) => {
                  const isSelected = frequency === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFrequency(item.id)}
                      style={{
                        background: isSelected ? '#F0FDF4' : '#FFFFFF',
                        border: isSelected ? '2px solid #059669' : '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: isSelected ? '#065F46' : '#0F172A' }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: isSelected ? '#059669' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {item.days}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {frequency === 'Custom' && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '18px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <Calendar size={22} color="#0F766E" />
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Custom Cycle Duration
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Enter number of days for this governance cycle:
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '80px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '16px',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Days</span>
                  </div>
                </div>
              )}

              <div className="wizard-bottom-bar">
                <button className="btn-wizard-cancel" onClick={() => onNavigate('safi_dashboard')}>
                  Cancel
                </button>
                <button className="btn-wizard-next" onClick={() => setCurrentStep(2)}>
                  <span>Continue to Allocation</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* =========================================================================
              STEP 2: SPEND ALLOCATION & PROTECTED RESERVE
             ========================================================================= */}
          {currentStep === 2 && (
            <>
              <span className="wizard-step-label">Step 2 of 5</span>
              <h1 className="wizard-main-heading">
                Set Spend Pool & Reserve Split
              </h1>
              <p className="wizard-subtitle">
                Specify your allowed spend for this {frequency.toLowerCase()} cycle ({cycleDays} days). Everything else remains locked in the Protected Reserve.
              </p>

              <div className="wizard-box-card">
                {/* Total Balance / Working Income Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                      Cycle Working Funds
                    </span>
                    <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700, marginTop: '2px' }}>
                      Pre-filled with live account balance: ₦{totalBalance.toLocaleString()}.00
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                      Verified Balance
                    </span>
                  </div>
                </div>

                {/* Big Spend Amount Display */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                    Spend Pool Allocation
                  </span>
                  <div className="interactive-spend-display" style={{ marginTop: '4px' }}>
                    <span className="currency-symbol">₦</span>
                    <span className="spend-amount-number">{spendAllocation.toLocaleString()}</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max={workingIncome}
                    step="1000"
                    value={spendAllocation}
                    onChange={(e) => setSpendAllocation(Number(e.target.value))}
                    className="spend-range-input"
                    style={{
                      background: `linear-gradient(to right, #0F172A 0%, #0F172A ${
                        (spendAllocation / (workingIncome || 1)) * 100
                      }%, #059669 ${(spendAllocation / (workingIncome || 1)) * 100}%, #059669 100%)`,
                    }}
                  />
                  <div className="slider-labels-row">
                    <span>₦0 (100% Protected)</span>
                    <span>₦{workingIncome.toLocaleString()} MAX</span>
                  </div>
                </div>

                {/* Quick Preset Percentage Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', alignSelf: 'center', marginRight: '4px' }}>
                    Quick Presets:
                  </span>
                  {[0.35, 0.44, 0.50, 0.65, 0.80].map((pct) => {
                    const presetVal = Math.round(workingIncome * pct);
                    const isSelected = spendAllocation === presetVal;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSpendAllocation(presetVal)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                          background: isSelected ? '#0F172A' : '#F8FAFC',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {Math.round(pct * 100)}% Spendable
                      </button>
                    );
                  })}
                </div>

                {/* Side by Side Breakdown Cards */}
                <div className="allocation-summary-cols">
                  <div className="summary-col">
                    <span className="summary-col-label">SPEND POOL (FREE SPEND)</span>
                    <span className="summary-col-val">₦{spendAllocation.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      Available for domestic transfers and operational expenses
                    </span>
                  </div>

                  <div className="summary-col highlight-green">
                    <span className="summary-col-label">PROTECTED RESERVE</span>
                    <span className="summary-col-val">₦{protectedSum.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', color: '#065F46', marginTop: '4px' }}>
                      Guaranteed minimum balance enforced by SAFI
                    </span>
                    <Shield size={54} className="watermark-shield" />
                  </div>
                </div>

                {/* Daily Velocity Safe Spend Calculation Card */}
                <div
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <Clock size={24} color="#059669" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#065F46' }}>
                      Safe Spend Velocity: ₦{safeDailySpend.toLocaleString()} / day
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#047857', marginTop: '2px' }}>
                      Based on your {cycleDays}-day cycle, spending within this daily rate guarantees your reserve remains untouched.
                    </div>
                  </div>
                </div>
              </div>

              <div className="wizard-bottom-bar">
                <button className="btn-wizard-back" onClick={() => setCurrentStep(1)}>
                  Back
                </button>
                <button className="btn-wizard-next" onClick={() => setCurrentStep(3)}>
                  <span>Continue to Governance</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* =========================================================================
              STEP 3: GOVERNANCE MODE
             ========================================================================= */}
          {currentStep === 3 && (
            <>
              <span className="wizard-step-label">Step 3 of 5</span>
              <h1 className="wizard-main-heading">
                Select Governance Mode
              </h1>
              <p className="wizard-subtitle">
                Configure how strictly reserve rules are enforced when a transaction exceeds the Spend Pool.
              </p>

              <div className="governance-cards-container">
                {/* Flexible Mode Card */}
                <div
                  className={`gov-card ${governanceMode === 'Flexible' ? 'selected' : ''}`}
                  onClick={() => setGovernanceMode('Flexible')}
                >
                  {governanceMode === 'Flexible' && (
                    <div className="gov-card-check">
                      <CheckCircle2 size={24} color="#0F172A" />
                    </div>
                  )}
                  <div className="gov-card-top">
                    <div className="gov-icon-box">
                      <Clock size={20} />
                    </div>
                    <div className="gov-card-info">
                      <div className="gov-card-title-row">
                        <span className="gov-card-title">Flexible Mode (Recommended)</span>
                        <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          Standard Velocity
                        </span>
                      </div>
                      <p className="gov-card-desc">
                        A 5-second velocity security pause initiates when protected reserve funds must be accessed. Best balance of strict financial discipline with operational flexibility.
                      </p>
                      <div className="gov-notice-box">
                        <Info size={15} />
                        <span>Buffer protection is available under Flexible mode.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strict Mode Card */}
                <div
                  className={`gov-card ${governanceMode === 'Strict' ? 'selected' : ''}`}
                  onClick={() => {
                    setGovernanceMode('Strict');
                    if (cardBehaviour === 'Buffer') {
                      setCardBehaviour('Hard Decline');
                    }
                  }}
                >
                  {governanceMode === 'Strict' && (
                    <div className="gov-card-check">
                      <CheckCircle2 size={24} color="#0F172A" />
                    </div>
                  )}
                  <div className="gov-card-top">
                    <div className="gov-icon-box teal">
                      <Sliders size={20} />
                    </div>
                    <div className="gov-card-info">
                      <div className="gov-card-title-row">
                        <span className="gov-card-title">Strict Mode</span>
                        <span className="badge-max-protection">Maximum Protection</span>
                      </div>
                      <p className="gov-card-desc">
                        Reserve is locked with zero tolerance. Any transaction breaching the Spend Pool is outright declined unless accompanied by a verified multi-party dual authorization sign-off token.
                      </p>
                      <div className="gov-metrics-split">
                        <div className="gov-metric-item">
                          <span className="gov-metric-label">Reserve Breach Policy</span>
                          <span className="gov-metric-value" style={{ color: '#DC2626' }}>Hard Block</span>
                        </div>
                        <div className="gov-metric-item">
                          <span className="gov-metric-label">Override Requirement</span>
                          <span className="gov-metric-value">Multi-Party Token</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="wizard-bottom-bar">
                <button className="btn-wizard-back" onClick={() => setCurrentStep(2)}>
                  Back
                </button>
                <button className="btn-wizard-next" onClick={() => setCurrentStep(4)}>
                  <span>Continue to Card Protection</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* =========================================================================
              STEP 4: CARD PROTECTION & BUFFER POLICY
             ========================================================================= */}
          {currentStep === 4 && (
            <>
              <span className="wizard-step-label">Step 4 of 5</span>
              <h1 className="wizard-main-heading">
                Card & Withdrawal Protection Policy
              </h1>
              <p className="wizard-subtitle">
                Choose the exact policy executed at POS, web checkout, or wire transfer when the Spend Pool is fully depleted.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {/* Option 1: Hard Decline */}
                <div
                  onClick={() => setCardBehaviour('Hard Decline')}
                  style={{
                    background: cardBehaviour === 'Hard Decline' ? '#F8FAFC' : '#FFFFFF',
                    border: cardBehaviour === 'Hard Decline' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: cardBehaviour === 'Hard Decline' ? '#0F172A' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    {cardBehaviour === 'Hard Decline' && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F172A' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      Hard Decline
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Transactions attempting to exceed the Spend Pool are rejected immediately. Your reserve of <strong>₦{protectedSum.toLocaleString()}</strong> remains 100% safeguarded.
                    </p>
                  </div>
                </div>

                {/* Option 2: Auto Cover */}
                <div
                  onClick={() => setCardBehaviour('Auto Cover')}
                  style={{
                    background: cardBehaviour === 'Auto Cover' ? '#F8FAFC' : '#FFFFFF',
                    border: cardBehaviour === 'Auto Cover' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: cardBehaviour === 'Auto Cover' ? '#0F172A' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    {cardBehaviour === 'Auto Cover' && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F172A' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                      Auto Cover
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                      Allows critical payments to complete seamlessly by borrowing from the reserve, triggering an instant high-priority compliance audit notification.
                    </p>
                  </div>
                </div>

                {/* Option 3: Buffer (Flexible Mode Only) */}
                <div
                  onClick={() => {
                    if (governanceMode === 'Strict') {
                      alert('Buffer is only available in Flexible Mode.');
                      return;
                    }
                    setCardBehaviour('Buffer');
                  }}
                  style={{
                    background: cardBehaviour === 'Buffer' ? '#F8FAFC' : '#FFFFFF',
                    border: cardBehaviour === 'Buffer' ? '2px solid #0F172A' : '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    cursor: governanceMode === 'Strict' ? 'not-allowed' : 'pointer',
                    opacity: governanceMode === 'Strict' ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: cardBehaviour === 'Buffer' ? '#0F172A' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    {cardBehaviour === 'Buffer' && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0F172A' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        Safety Buffer
                      </span>
                      <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}>
                        Flexible Mode Only
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                      Allows transactions to draw up to a preset safety threshold before Hard Decline engages.
                    </p>

                    {cardBehaviour === 'Buffer' && governanceMode === 'Flexible' && (
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                          Select Buffer Capacity:
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[5000, 10000, 20000, 50000].map((amt) => {
                            const isAmtSelected = bufferAmount === amt;
                            return (
                              <button
                                key={amt}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBufferAmount(amt);
                                }}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  border: isAmtSelected ? '1.5px solid #059669' : '1px solid #CBD5E1',
                                  background: isAmtSelected ? '#ECFDF5' : '#FFFFFF',
                                  color: isAmtSelected ? '#065F46' : '#334155',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                }}
                              >
                                ₦{amt.toLocaleString()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="wizard-bottom-bar">
                <button className="btn-wizard-back" onClick={() => setCurrentStep(3)}>
                  Back
                </button>
                <button className="btn-wizard-next" onClick={() => setCurrentStep(5)}>
                  <span>Review Configuration</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* =========================================================================
              STEP 5: REVIEW, CONFIRMATION & ACTIVATION
             ========================================================================= */}
          {currentStep === 5 && (
            <>
              <span className="wizard-step-label">Step 5 of 5</span>
              <h1 className="wizard-main-heading">
                Review & Activate SAFI Governance
              </h1>
              <p className="wizard-subtitle">
                Please verify your rules before locking them into the Meridian Core engine.
              </p>

              <div className="wizard-box-card">
                {/* Summary Table Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Account Number</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                      {accountNumber || '77462511649'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Financial Cycle</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {frequency} ({cycleDays} Days)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Spend Pool Allocation</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      ₦{spendAllocation.toLocaleString()}.00
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Protected Reserve</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>
                      ₦{protectedSum.toLocaleString()}.00
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Governance Mode</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {governanceMode} Mode
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Card Protection Policy</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {cardBehaviour} {cardBehaviour === 'Buffer' ? `(₦${bufferAmount.toLocaleString()})` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13.5px', color: '#64748B' }}>Safe Daily Velocity</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F766E' }}>
                      ≈ ₦{safeDailySpend.toLocaleString()} / day
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #F87171',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#991B1B',
                      fontSize: '13.5px',
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="wizard-bottom-bar">
                <button className="btn-wizard-back" onClick={() => setCurrentStep(4)} disabled={isSubmitting}>
                  Back
                </button>
                <button
                  className="btn-wizard-next"
                  onClick={handleLockInRules}
                  disabled={isSubmitting}
                  style={{ minWidth: '220px', justifyContent: 'center' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Locking in Rules...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock In & Activate SAFI</span>
                      <ShieldCheck size={16} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* =========================================================================
              SUCCESS SCREEN: CELEBRATORY ACTIVATION
             ========================================================================= */}
          {currentStep === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 20px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.18)',
                }}
              >
                <ShieldCheck size={44} />
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                🎉 SAFI Governance Activated!
              </h2>
              <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '520px', lineHeight: 1.6, marginBottom: '28px' }}>
                Your financial cycle has successfully started. Your reserve of <strong>₦{protectedSum.toLocaleString()}</strong> is now mathematically protected across all outbound transactions.
              </p>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                  marginBottom: '32px',
                  textAlign: 'left',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                  ACTIVE PROTOCOL SUMMARY
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748B' }}>Enforced Reserve:</span>
                  <strong style={{ color: '#059669' }}>₦{protectedSum.toLocaleString()}.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748B' }}>Current Spend Pool:</span>
                  <strong>₦{spendAllocation.toLocaleString()}.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748B' }}>Active Mode:</span>
                  <strong>{governanceMode} Mode</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748B' }}>Cycle Length:</span>
                  <strong>{frequency} ({cycleDays} Days)</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  className="btn-wizard-back"
                  onClick={() => onNavigate('meridian')}
                  style={{ padding: '12px 24px', fontSize: '14px' }}
                >
                  Digital Banking
                </button>
                <button
                  className="btn-wizard-next"
                  onClick={() => onNavigate('safi_dashboard')}
                  style={{ padding: '12px 28px', fontSize: '14px' }}
                >
                  <span>Go to SAFI Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
