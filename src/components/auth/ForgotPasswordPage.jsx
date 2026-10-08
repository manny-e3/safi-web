import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import authService from '../../services/authService';

export default function ForgotPasswordPage({
  onNavigate,
  onResetRequested,
}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResendMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);

      if (onResetRequested) {
        onResetRequested({ email: email.trim() });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setResendMessage('');
    setIsResending(true);

    try {
      await authService.forgotPassword({ email: email.trim() });
      setResendMessage('A fresh password reset link has been dispatched to your email.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend reset email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isGmail = email.trim().toLowerCase().endsWith('@gmail.com');

  return (
    <div className="auth-card">
      <button
        type="button"
        className="auth-back-link"
        onClick={() => onNavigate('login')}
        id="btn-back-to-login"
      >
        <ArrowLeft size={16} />
        <span>Back to Sign In</span>
      </button>

      {!isSubmitted ? (
        <>
          <div className="auth-card-header">
            <h2 className="auth-card-title">Forgot Password?</h2>
            <p className="auth-card-subtitle">
              Enter your registered online banking email address and we'll send you an encrypted link to reset your credentials.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-alert error">
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="forgot-email">
                Registered Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  className={`auth-input ${errorMessage ? 'has-error' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="email"
                  required
                />
              </div>
              <span className="auth-helper-text" style={{ fontSize: '12px', color: '#64748B' }}>
                A one-time verification link will be delivered directly to your email inbox.
              </span>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
              id="btn-send-reset-link"
            >
              {isLoading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Email</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="auth-success-state">
          <div className="auth-success-icon-badge">
            <CheckCircle2 size={34} color="#059669" />
          </div>
          <h3>Check Your Email</h3>
          <p>
            We've dispatched a secure verification link to:
          </p>
          <div className="auth-success-highlight-box">
            <Mail size={18} style={{ color: '#0D9488', flexShrink: 0 }} />
            <strong style={{ color: '#0A1E3F', wordBreak: 'break-all' }}>{email}</strong>
          </div>

          {resendMessage && (
            <div className="auth-alert success" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{resendMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="auth-alert error" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <p style={{ fontSize: 13, color: '#64748B', marginTop: -4, marginBottom: 20, lineHeight: 1.6 }}>
            Please open the email in your inbox and click the <strong>Reset Password Now</strong> link inside the message to securely set a new password. The link expires in 1 hour.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
            {isGmail ? (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-submit-btn"
                style={{ textDecoration: 'none' }}
              >
                <span>Open Gmail Inbox</span>
                <ArrowRight size={17} />
              </a>
            ) : (
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => onNavigate('login')}
              >
                <span>Return to Sign In</span>
                <ArrowRight size={17} />
              </button>
            )}

            <button
              type="button"
              className="auth-switch-link"
              onClick={handleResend}
              disabled={isResending}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {isResending ? (
                <>
                  <RefreshCw size={14} className="spin-slow" />
                  <span>Resending link...</span>
                </>
              ) : (
                <span>Didn't receive email? Click to resend</span>
              )}
            </button>

            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setIsSubmitted(false);
                setResendMessage('');
                setErrorMessage('');
              }}
              style={{ color: '#64748B', fontSize: '12px', marginTop: 4 }}
            >
              Need to enter a different email address?
            </button>
          </div>
        </div>
      )}

      <div className="auth-card-footer">
        <span>Remember your password?</span>
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => onNavigate('login')}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
