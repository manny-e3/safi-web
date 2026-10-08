import React, { useState } from 'react';
import {
  X,
  Building2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  ArrowDownLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import bankingService from '../services/bankingService';

export default function FundAccountModal({ isOpen, onClose, onFundSuccess, accountNumber, userName }) {
  const [activeTab, setActiveTab] = useState('transfer');
  const [amount, setAmount] = useState('500000');
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  // SAFI auto-allocation ratio: roughly ~56% protected, ~44% spendable
  const autoProtected = Math.round(numAmount * 0.56);
  const autoSpendable = numAmount - autoProtected;

  const displayedAccount = accountNumber || '77462511649';
  const displayedName = userName || 'Meridian Digital / SAFI Core';

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteFunding = async () => {
    if (numAmount <= 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const channelDescription =
        activeTab === 'transfer'
          ? 'Inbound Bank Transfer'
          : activeTab === 'card'
          ? 'Debit Card Funding'
          : 'Direct Institutional Wire';

      const result = await bankingService.fundWallet({
        amount: numAmount,
        description: channelDescription,
      });

      const tx = result?.transaction || result;
      const formattedTx = bankingService.formatTransaction(tx) || {
        reference: tx?.reference || 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        description: channelDescription,
        amount: numAmount,
      };

      const successData = {
        ...formattedTx,
        protectedAllocated: autoProtected,
        spendableAllocated: autoSpendable,
        wallet: result?.wallet,
      };

      if (onFundSuccess) {
        onFundSuccess(successData, result);
      }
      setSuccessDetails(successData);
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fund account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setSuccessDetails(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon fund">
              <ArrowDownLeft size={22} />
            </div>
            <div className="modal-header-text">
              <h3>Fund Account</h3>
              <p>Add funds to your Meridian institutional account</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {!isSuccess ? (
            <>
              {/* Tabs */}
              <div className="modal-tabs">
                <button
                  className={`modal-tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transfer')}
                >
                  Bank Transfer
                </button>
                <button
                  className={`modal-tab-btn ${activeTab === 'card' ? 'active' : ''}`}
                  onClick={() => setActiveTab('card')}
                >
                  Debit Card
                </button>
                <button
                  className={`modal-tab-btn ${activeTab === 'wire' ? 'active' : ''}`}
                  onClick={() => setActiveTab('wire')}
                >
                  Direct Wire
                </button>
              </div>

              {activeTab === 'transfer' && (
                <div className="virtual-account-box">
                  <div className="va-row">
                    <span className="va-label">DEDICATED VIRTUAL ACCOUNT</span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                      }}
                    >
                      Instant Credit
                    </span>
                  </div>

                  <div className="va-row">
                    <div>
                      <div className="va-account-num">{displayedAccount}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                        Meridian Wema Bank
                      </div>
                    </div>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(displayedAccount)}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #A7F3D0',
                      paddingTop: '8px',
                      fontSize: '12px',
                      color: '#065F46',
                    }}
                  >
                    Account Name: <strong>{displayedName}</strong>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #F87171',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#991B1B',
                    fontSize: '13px',
                    marginTop: '10px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Amount Input */}
              <div className="form-group">
                <label className="form-label">
                  <span>Deposit Amount</span>
                  <span className="form-label-sub">Simulate incoming deposit</span>
                </label>
                <div className="form-input-prefix">
                  <span>₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500,000"
                    min="1000"
                  />
                </div>
              </div>

              {/* Preset Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[500000, 1000000, 2500000, 5000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      fontWeight: 600,
                    }}
                  >
                    +₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* SAFI Auto Allocation Preview */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0F766E',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Shield size={14} /> SAFI Governance Allocation
                  </span>
                  <span>Auto-governed</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    color: '#475569',
                  }}
                >
                  <span>Protected Allocation (~56%):</span>
                  <strong style={{ color: '#0F172A' }}>
                    +₦{autoProtected.toLocaleString()}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    color: '#475569',
                  }}
                >
                  <span>Spendable Allocation (~44%):</span>
                  <strong style={{ color: '#0F172A' }}>
                    +₦{autoSpendable.toLocaleString()}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            /* Success Screen */
            <div className="success-screen">
              <div className="success-icon-wrap">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                  Account Funded Successfully
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Funds have been allocated according to SAFI policy.
                </p>
              </div>

              <div className="success-amount-display">
                +₦{numAmount.toLocaleString()}
              </div>

              <div className="receipt-summary-box">
                <div className="receipt-item">
                  <span className="key">Reference</span>
                  <span className="val">{successDetails?.reference}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Channel</span>
                  <span className="val">{successDetails?.description}</span>
                </div>
                <div className="receipt-item">
                  <span className="key">Protected Split</span>
                  <span className="val" style={{ color: '#0F766E' }}>
                    +₦{successDetails?.protectedAllocated?.toLocaleString()}
                  </span>
                </div>
                <div className="receipt-item">
                  <span className="key">Spendable Split</span>
                  <span className="val">
                    +₦{successDetails?.spendableAllocated?.toLocaleString()}
                  </span>
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
        <div className="modal-footer">
          {!isSuccess ? (
            <>
              <button className="btn-modal-cancel" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn-modal-submit"
                onClick={handleExecuteFunding}
                disabled={numAmount <= 0 || isSubmitting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Deposit...</span>
                  </>
                ) : (
                  <span>Confirm Deposit</span>
                )}
              </button>
            </>
          ) : (
            <button className="btn-modal-submit" onClick={handleClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
