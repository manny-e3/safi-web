import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import authService from '../../services/authService';

export default function ResetPasswordPage({
  onNavigate,
  onPasswordResetSuccess,
  resetEmail = '',
  resetToken = '',
}) {
  const [token, setToken] = useState(resetToken || '');
  const [email, setEmail] = useState(resetEmail || '');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extract token and email from URL or props
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (resetToken) {
      setToken(resetToken);
    } else if (urlToken) {
      setToken(urlToken);
    }

    if (resetEmail) {
      setEmail(resetEmail);
    } else if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [resetToken, resetEmail]);

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', className: '' };

    const rules = {
      length: pass.length >= 8,
      hasUpperLower: /[a-z]/.test(pass) && /[A-Z]/.test(pass),
      hasNumber: /\d/.test(pass),
      hasSpecial: /[^A-Za-z0-9]/.test(pass),
    };

    if (rules.length) score++;
    if (rules.hasUpperLower) score++;
    if (rules.hasNumber) score++;
    if (rules.hasSpecial) score++;

    if (score <= 1) return { score: 1, label: 'Weak', className: 'weak', rules };
    if (score === 2) return { score: 2, label: 'Fair', className: 'fair', rules };
    if (score === 3) return { score: 3, label: 'Good', className: 'good', rules };
    return { score: 4, label: 'Strong', className: 'strong', rules };
  };

  const strength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Reset token is missing or has expired. Please request a new password reset link.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your new password.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token,
        password: formData.password,
      });

      setIsSuccess(true);

      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(formData.password);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <button
        type="button"
        className="auth-back-link"
        onClick={() => onNavigate('login')}
        id="btn-back-from-reset"
      >
        <ArrowLeft size={16} />
        <span>Back to Sign In</span>
      </button>

      {!isSuccess ? (
        <>
          <div className="auth-card-header">
            <h2 className="auth-card-title">Set New Password</h2>
            <p className="auth-card-subtitle">
              Choose a strong, unique password for your Meridian Online Banking account.
            </p>
          </div>

          {email && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: '#F0FDFA',
                border: '1px solid #99F6E4',
                borderRadius: '8px',
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={16} color="#0D9488" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                Resetting password for <strong style={{ color: '#0A1E3F' }}>{email}</strong>
              </div>
            </div>
          )}

          {!token && (
            <div className="auth-alert error" style={{ marginBottom: 20 }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>Missing or invalid password reset link.</span>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot_password')}
                  style={{
                    color: '#0D9488',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Request a new password reset email &rarr;
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="auth-alert error">
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <input type="hidden" name="token" value={token} />

            {/* New Password */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="reset-new-password">
                New Password
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input ${errorMessage ? 'has-error' : ''}`}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="password-strength-container">
                  <div className="password-strength-bars">
                    <div className={`strength-bar ${strength.score >= 1 ? `active-${strength.className}` : ''}`} />
                    <div className={`strength-bar ${strength.score >= 2 ? `active-${strength.className}` : ''}`} />
                    <div className={`strength-bar ${strength.score >= 3 ? `active-${strength.className}` : ''}`} />
                    <div className={`strength-bar ${strength.score >= 4 ? `active-${strength.className}` : ''}`} />
                  </div>
                  <div className="password-strength-label">
                    <span>Security Rating</span>
                    <span className={`score-text ${strength.className}`}>{strength.label}</span>
                  </div>

                  {/* Checklist */}
                  <div className="password-rules-list">
                    <div className={`password-rule-item ${formData.password.length >= 8 ? 'valid' : ''}`}>
                      <span className="password-rule-dot" />
                      <span>8+ characters</span>
                    </div>
                    <div className={`password-rule-item ${/\d/.test(formData.password) ? 'valid' : ''}`}>
                      <span className="password-rule-dot" />
                      <span>At least 1 number</span>
                    </div>
                    <div className={`password-rule-item ${/[A-Z]/.test(formData.password) ? 'valid' : ''}`}>
                      <span className="password-rule-dot" />
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`password-rule-item ${/[^A-Za-z0-9]/.test(formData.password) ? 'valid' : ''}`}>
                      <span className="password-rule-dot" />
                      <span>Special symbol</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="auth-input-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                {passwordsMatch && (
                  <span style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Check size={13} /> Passwords match
                  </span>
                )}
                {passwordsMismatch && (
                  <span style={{ fontSize: 11, color: '#DC2626' }}>
                    Passwords do not match
                  </span>
                )}
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`auth-input ${passwordsMismatch ? 'has-error' : ''}`}
                  placeholder="Re-enter your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-action"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
              id="btn-reset-password-submit"
            >
              {isLoading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="auth-success-state">
          <div className="auth-success-icon-badge">
            <CheckCircle2 size={32} />
          </div>
          <h3>Password Reset Successful!</h3>
          <p>
            Your account credentials have been updated securely. You can now log into Meridian Bank using your new password.
          </p>

          <button
            type="button"
            className="auth-submit-btn"
            onClick={() => onNavigate('login')}
            id="btn-goto-login-success"
          >
            <span>Go to Sign In</span>
            <ArrowRight size={17} />
          </button>
        </div>
      )}

      <div className="auth-card-footer">
        <span>Need assistance?</span>
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => alert('Please contact Meridian Bank Helpline: 0700-MERIDIAN or email support@meridianbank.ng')}
        >
          Contact Customer Support
        </button>
      </div>
    </div>
  );
}
