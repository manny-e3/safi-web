import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Check, ShieldAlert } from 'lucide-react';

export default function SafiOverrideScreen({
  pendingTransfer,
  totalBalance = 0,
  spendAllocation = 0,
  onApprove,
  onCancel,
}) {
  const [overrideReason, setOverrideReason] = useState('Family Support');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const txAmount = pendingTransfer?.amount || 0;
  const fromAllocation = pendingTransfer?.fromAllocation || 0;
  const fromProtected = pendingTransfer?.fromProtected || Math.max(0, txAmount - fromAllocation);

  const reserveBefore = Math.max(0, totalBalance - spendAllocation);
  const reserveAfter = Math.max(0, reserveBefore - fromProtected);

  const reasons = [
    'Family Support',
    'Medical & Health',
    'Emergency',
    'Bills & Utilities',
    'Business Need',
    'Other Necessity',
  ];

  return (
    <div className="safi-override-screen-container">
      {/* Top Security Header */}
      <div className="safi-override-badge-header">
        <ShieldAlert size={14} color="#DC2626" />
        <span>SECURITY INTERVENTION • RESERVE SAFEGUARD</span>
      </div>

      {/* Main Alert Box */}
      <div className="safi-override-card">
        <div className="safi-override-icon-wrap">
          <AlertTriangle size={26} color="#DC2626" />
        </div>

        <h3 className="safi-override-headline">This Transfer Draws from Your Reserve</h3>
        <p className="safi-override-subtext">
          Your Spend Pool (<strong>₦{fromAllocation.toLocaleString()}</strong>) is exhausted for this transfer.{' '}
          <strong className="text-red-highlight">₦{fromProtected.toLocaleString()}</strong> will be drawn from your protected Reserve.
        </p>

        {/* Clear Financial Breakdown Card */}
        <div className="safi-override-breakdown-card">
          <div className="safi-breakdown-row">
            <span className="breakdown-label">Total Transfer Amount</span>
            <span className="breakdown-value-bold">₦{txAmount.toLocaleString()}</span>
          </div>

          <div className="safi-breakdown-row">
            <span className="breakdown-label">Covered by Spend Pool</span>
            <span className="breakdown-value-green">
              ₦{fromAllocation.toLocaleString()}{' '}
              <span className="breakdown-tag-green">Covered ✓</span>
            </span>
          </div>

          <div className="safi-breakdown-row highlight-reserve">
            <span className="breakdown-label-red">Drawdown from Reserve</span>
            <span className="breakdown-value-red">
              ₦{fromProtected.toLocaleString()}{' '}
              <span className="breakdown-tag-red">Breach</span>
            </span>
          </div>

          <div className="safi-breakdown-row">
            <span className="breakdown-label">Protected Reserve After</span>
            <span className="breakdown-value-slate">₦{reserveAfter.toLocaleString()}</span>
          </div>
        </div>

        {/* Reason Selector Section */}
        <div className="safi-reason-section">
          <div className="safi-reason-title">Why are you accessing your reserve?</div>
          <div className="safi-reason-subtitle">
            A documented reason is logged to maintain your financial discipline score.
          </div>

          <div className="safi-reasons-grid-modern">
            {reasons.map((reason) => {
              const isSelected = overrideReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  className={`safi-reason-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setOverrideReason(reason)}
                >
                  <span>{reason}</span>
                  {isSelected && <Check size={14} className="reason-check" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Second Security Friction Countdown */}
        <div className="safi-countdown-container">
          <div className="safi-countdown-circle-modern">
            {countdown > 0 ? (
              <span className="countdown-number">{countdown}</span>
            ) : (
              <Check size={24} color="#059669" />
            )}
          </div>
          <div className="safi-countdown-text-wrap">
            <div className="safi-countdown-status">
              {countdown > 0 ? (
                <>Deliberate Pause Active • Button unlocks in {countdown}s</>
              ) : (
                <span style={{ color: '#059669', fontWeight: 700 }}>
                  Override Unlocked • Confirmation Available
                </span>
              )}
            </div>
            <div className="safi-countdown-hint">
              {countdown > 0
                ? 'Deliberate friction helps prevent unintended reserve drawdowns.'
                : 'You may now proceed with the transfer or cancel to keep your reserve safe.'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="safi-override-actions">
          <button
            type="button"
            className="safi-btn-cancel-override"
            onClick={onCancel}
          >
            <Lock size={16} color="#059669" />
            <span>Cancel — Keep Reserve Safe</span>
          </button>

          <button
            type="button"
            className="safi-btn-approve-override"
            disabled={countdown > 0}
            onClick={() => onApprove({ reason: overrideReason, fromProtected })}
          >
            <span>{countdown > 0 ? `Unlocking in ${countdown}s...` : 'Approve Transfer & Use Reserve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
