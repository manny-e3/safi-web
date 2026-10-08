import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Clock,
  KeyRound,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import bankingService from '../services/bankingService';
import SafiOverrideScreen from './safi/SafiOverrideScreen';

export default function TransferModal({
  isOpen,
  onClose,
  totalBalance = 0,
  spendableFunds = 0,
  protectedFunds = 0,
  protectionMode = 'Flexible',
  safiConfig = null,
  onTransferSuccess,
}) {
  const [bank, setBank] = useState('Zenith Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  // Multi-step: 'input' -> 'override' -> 'pin' -> 'success'
  const [step, setStep] = useState('input');
  const [pin, setPin] = useState('');
  const [governanceToken, setGovernanceToken] = useState('');

  // Async states
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // SAFI countdown for Flexible mode
  const [countdown, setCountdown] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Success receipt
  const [receipt, setReceipt] = useState(null);

  const isSafiActive = !!safiConfig;
  const numAmount = parseFloat(amount) || 0;
  const effectiveTotal = totalBalance > 0 ? totalBalance : (spendableFunds + protectedFunds);
  const isExceedingTotalBalance = numAmount > effectiveTotal;
  const requiresProtectedAccess = isSafiActive && !isExceedingTotalBalance && numAmount > spendableFunds;
  const protectedDeficit = requiresProtectedAccess ? numAmount - spendableFunds : 0;

  // Handle bank account resolution via backend
  useEffect(() => {
    let active = true;
    if (accountNumber && accountNumber.length >= 10) {
      setIsResolving(true);
      bankingService
        .resolveAccount(accountNumber)
        .then((res) => {
          if (!active) return;
          if (res?.accountName) {
            setResolvedName(res.accountName);
          } else {
            setResolvedName(`${bank} Beneficiary (${accountNumber})`);
          }
        })
        .catch(() => {
          if (!active) return;
          setResolvedName(`${bank} Beneficiary (${accountNumber})`);
        })
        .finally(() => {
          if (active) setIsResolving(false);
        });
    } else {
      setResolvedName('');
    }
    return () => {
      active = false;
    };
  }, [accountNumber, bank]);

  if (!isOpen) return null;

  const handleProceedToPin = () => {
    if (numAmount <= 0 || !accountNumber) return;

    if (isExceedingTotalBalance) {
      setErrorMessage(`Transfer amount of ₦${numAmount.toLocaleString()} exceeds your total available balance of ₦${effectiveTotal.toLocaleString()}.`);
      return;
    }

    if (requiresProtectedAccess) {
      setStep('override');
      return;
    }

    setErrorMessage('');
    setStep('pin');
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await bankingService.transferFunds({
        amount: numAmount,
        recipientAccountNumber: accountNumber,
        recipientBank: bank,
        recipientName: resolvedName || `${bank} Account (${accountNumber})`,
        narration: narration || `Transfer to ${resolvedName || accountNumber}`,
      });

      const tx = result?.transaction || result;
      const formattedTx = bankingService.formatTransaction(tx) || {
        reference: tx?.reference || 'TRF-' + Math.floor(100000 + Math.random() * 900000),
        description: narration || `Transfer to ${resolvedName || accountNumber}`,
        amount: numAmount,
      };

      const successTx = {
        ...formattedTx,
        recipient: resolvedName || `${bank} Account (${accountNumber})`,
        bank: bank,
        accountNumber: accountNumber,
        protectedUsed: requiresProtectedAccess ? protectedDeficit : 0,
        wallet: result?.wallet,
      };

      if (onTransferSuccess) {
        onTransferSuccess(successTx, result);
      }
      setReceipt(successTx);
      setStep('success');
    } catch (err) {
      setErrorMessage(err.message || 'Transfer could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setPin('');
    setGovernanceToken('');
    setCountdown(0);
    setIsUnlocked(false);
    setReceipt(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon transfer">
              <ArrowUpRight size={22} />
            </div>
            <div className="modal-header-text">
              <h3>Transfer Funds</h3>
              <p>Institutional domestic and B2B wire transfer</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {step === 'input' && (
            <>
              {/* Balance Banner: Only display SAFI spend/protected split if SAFI is configured */}
              {isSafiActive ? (
                <div className="balance-check-banner">
                  <div>
                    <span className="label">Spendable (Spend Pool): </span>
                    <span className="val" style={{ color: '#059669', fontWeight: 800 }}>
                      ₦{spendableFunds.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="label">SAFI Protected (Reserve): </span>
                    <span className="val" style={{ color: '#0F766E', fontWeight: 800 }}>
                      ₦{protectedFunds.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="balance-check-banner" style={{ justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div>
                    <span className="label" style={{ color: '#64748B' }}>Available Balance: </span>
                    <span className="val" style={{ color: '#0F172A', fontWeight: 800, fontSize: '14px' }}>
                      ₦{effectiveTotal.toLocaleString()}.00
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Institutional Tier 1 Vault</span>
                  </div>
                </div>
              )}

              {/* Destination Bank */}
              <div className="form-group">
                <label className="form-label">
                  <span>Destination Institution</span>
                </label>
                <select
                  className="bank-select"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                >
                  <option value="Zenith Bank">Zenith Bank Plc</option>
                  <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank">Access Bank Plc</option>
                  <option value="First Bank">First Bank of Nigeria</option>
                  <option value="United Bank for Africa">United Bank for Africa (UBA)</option>
                  <option value="Standard Chartered">Standard Chartered Bank</option>
                  <option value="Providus Bank">Providus Bank</option>
                </select>
              </div>

              {/* Account Number */}
              <div className="form-group">
                <label className="form-label">
                  <span>Recipient Account Number</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={11}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 or 11 digit account number"
                />
                {isResolving && (
                  <div className="account-resolved-badge" style={{ color: '#2563EB', background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Resolving beneficiary account...</span>
                  </div>
                )}
                {!isResolving && resolvedName && (
                  <div className="account-resolved-badge">
                    <ShieldCheck size={14} />
                    <span>{resolvedName}</span>
                  </div>
                )}
              </div>

              {/* Transfer Amount */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    <span>Transfer Amount</span>
                  </label>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Total Balance: <strong style={{ color: '#0F172A' }}>₦{effectiveTotal.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="form-input-prefix">
                  <span>₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setIsUnlocked(false);
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[50000, 100000, 250000, effectiveTotal > 0 ? effectiveTotal : 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val.toString());
                      setIsUnlocked(false);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Narration */}
              <div className="form-group">
                <label className="form-label">
                  <span>Payment Narration / Reference</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Vendor Payment - Acme Corp"
                />
              </div>

              {/* Insufficient Total Balance Alert */}
              {isExceedingTotalBalance && numAmount > 0 && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#991B1B',
                    marginTop: '12px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
                  <div style={{ fontSize: '13px', lineHeight: 1.45 }}>
                    <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '2px', color: '#7F1D1D' }}>
                      Insufficient Account Balance
                    </strong>
                    <span>
                      Transfer amount of <strong>₦{numAmount.toLocaleString()}</strong> exceeds your total account balance of <strong>₦{effectiveTotal.toLocaleString()}</strong> by <strong>₦{(numAmount - effectiveTotal).toLocaleString()}</strong>. Please enter an amount within your balance.
                    </span>
                  </div>
                </div>
              )}

              {/* SAFI Protection Guard Warning (Only when within total balance but exceeds spend pool) */}
              {requiresProtectedAccess && !isExceedingTotalBalance && (
                <div className="safi-guard-alert">
                  <div className="safi-guard-header">
                    <AlertTriangle size={17} />
                    <span>SAFI Governance: Protected Reserve Access Required</span>
                  </div>
                  <p className="safi-guard-desc">
                    This amount exceeds your available Spend Pool by{' '}
                    <strong>₦{protectedDeficit.toLocaleString()}</strong> and will draw from your protected Reserve. Deliberate friction confirmation will be required to proceed.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'override' && (
            <div style={{ margin: '-10px -10px' }}>
              <SafiOverrideScreen
                pendingTransfer={{
                  amount: numAmount,
                  fromAllocation: Math.min(numAmount, spendableFunds),
                  fromProtected: protectedDeficit,
                }}
                totalBalance={effectiveTotal}
                spendAllocation={spendableFunds}
                onApprove={({ reason }) => {
                  setNarration((prev) => (prev ? `${prev} (Override: ${reason})` : `Override: ${reason}`));
                  setStep('pin');
                }}
                onCancel={handleClose}
              />
            </div>
          )}

          {step === 'pin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <KeyRound size={24} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Enter Transaction PIN
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Authorize transfer of <strong>₦{numAmount.toLocaleString()}</strong> to {resolvedName}
                </p>
              </div>

              <div className="form-group" style={{ maxWidth: '240px', margin: '0 auto', width: '100%' }}>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{
                    textAlign: 'center',
                    fontSize: '28px',
                    letterSpacing: '0.4em',
                    padding: '10px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    width: '100%',
                  }}
                  autoFocus
                />
              </div>

              <div className="receipt-summary-box">
                <div className="receipt-item">
                  <span className="key">Recipient</span>
                  <span className="val">{resolvedName}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Bank & Account</span>
                  <span className="val">{bank} • {accountNumber}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Spendable Debit</span>
                  <span className="val">
                    ₦{Math.min(numAmount, spendableFunds).toLocaleString()}
                  </span>
                </div>
                {requiresProtectedAccess && (
                  <div className="receipt-item">
                    <span className="key">Protected Debit</span>
                    <span className="val" style={{ color: '#0F766E' }}>
                      ₦{protectedDeficit.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #F87171',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#991B1B',
                    fontSize: '13px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Transaction Declined</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && receipt && (
            <div className="success-screen">
              <div className="success-icon-wrap">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                  Transfer Successful
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Funds have been dispatched via NIBSS Instant Payments (NIP).
                </p>
              </div>

              <div className="success-amount-display">
                -₦{receipt.amount.toLocaleString()}
              </div>

              <div className="receipt-summary-box">
                <div className="receipt-item">
                  <span className="key">Reference</span>
                  <span className="val">{receipt.reference}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Beneficiary</span>
                  <span className="val">{receipt.recipient}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Destination</span>
                  <span className="val">{receipt.bank} • {receipt.accountNumber}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Narration</span>
                  <span className="val">{receipt.description}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Status</span>
                  <span className="badge-completed">
                    <span className="dot"></span> Completed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step !== 'override' && (
          <div className="modal-footer">
            {step === 'input' && (
              <>
                <button className="btn-modal-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="btn-modal-submit"
                  onClick={handleProceedToPin}
                  disabled={numAmount <= 0 || !accountNumber || isExceedingTotalBalance}
                  style={{
                    background: isExceedingTotalBalance
                      ? '#94A3B8'
                      : requiresProtectedAccess
                      ? '#0F172A'
                      : '#059669',
                    cursor: (numAmount <= 0 || !accountNumber || isExceedingTotalBalance) ? 'not-allowed' : 'pointer',
                    boxShadow: (isExceedingTotalBalance || numAmount <= 0 || !accountNumber)
                      ? 'none'
                      : requiresProtectedAccess
                      ? '0 4px 12px rgba(15, 23, 42, 0.25)'
                      : '0 4px 12px rgba(5, 150, 105, 0.25)',
                  }}
                >
                  <span>
                    {isExceedingTotalBalance
                      ? 'Insufficient Account Balance'
                      : requiresProtectedAccess
                      ? 'Review Override & Continue'
                      : 'Continue to PIN'}
                  </span>
                  {!isExceedingTotalBalance && <ArrowRight size={16} />}
                </button>
              </>
            )}

            {step === 'pin' && (
              <>
                <button className="btn-modal-cancel" onClick={() => setStep('input')} disabled={isSubmitting}>
                  Back
                </button>
                <button
                  className="btn-modal-submit"
                  onClick={handleConfirmTransfer}
                  disabled={pin.length < 4 || isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Transfer...</span>
                    </>
                  ) : (
                    <span>Confirm & Send</span>
                  )}
                </button>
              </>
            )}

            {step === 'success' && (
              <button className="btn-modal-submit" onClick={handleClose}>
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
