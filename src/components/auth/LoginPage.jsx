import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import authService from '../../services/authService';

export default function LoginPage({
  onNavigate,
  onLoginSuccess,
  registeredUser,
}) {
  const [formData, setFormData] = useState({
    email: registeredUser?.email || '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUsernameHelp, setShowUsernameHelp] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email.trim()) {
      setErrorMessage('Please enter your registered user name or email address.');
      return;
    }
    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const user = response?.user || {
        email: formData.email.trim(),
        name: formData.email.split('@')[0],
      };

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Card Header */}
      <div className="auth-card-header">
        <h2 className="auth-card-title">Welcome  Meridian Online Banking</h2>
        <p className="auth-card-subtitle">
          Please log in safely with your registered credentials.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="auth-alert error">
          <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Username Help Alert Modal */}
      {showUsernameHelp && (
        <div className="auth-alert info">
          <HelpCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <span>
              Your Username is your <strong>registered Email Address</strong> or your{' '}
              <strong>10-digit NUBAN Account Number</strong>.
            </span>
            <button
              type="button"
              onClick={() => setShowUsernameHelp(false)}
              style={{
                display: 'block',
                marginTop: '4px',
                color: '#0D9488',
                fontWeight: '700',
                fontSize: '11px',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* User Name / Email Address */}
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="login-email">
            User Name / Email Address
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="text"
              className={`auth-input ${errorMessage ? 'has-error' : ''}`}
              placeholder="Enter your user name or email address"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="login-password">
            Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-input ${errorMessage ? 'has-error' : ''}`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              autoComplete="current-password"
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
        </div>

        {/* Dual Links (Forgot Username & Forgot Password) */}
        <div className="auth-dual-links-row">
          <button
            type="button"
            className="auth-label-link"
            onClick={() => setShowUsernameHelp(!showUsernameHelp)}
          >
            Forgot Username?
          </button>
          <button
            type="button"
            className="auth-label-link"
            onClick={() => onNavigate('forgot_password')}
          >
            Forgot Password?
          </button>
        </div>

        {/* Remember Me */}
        <div className="auth-checkbox-row">
          <input
            id="remember-me"
            type="checkbox"
            className="auth-checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange('rememberMe', e.target.checked)}
          />
          <label htmlFor="remember-me" className="auth-checkbox-label">
            Remember this browser for 30 days
            <span className="auth-checkbox-disclaimer">
              Do not select if using a public or shared computer.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
          id="btn-login-submit"
        >
          {isLoading ? (
            <>
              <div className="auth-spinner" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Online Banking</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Secondary Promo Callout (Fidelity Style) */}
      <div className="auth-promo-callout">
        <span>Not yet banking with Meridian?</span>
        <button
          type="button"
          className="auth-promo-btn"
          onClick={() => onNavigate('register')}
        >
          Open an Account
        </button>
      </div>

      {/* Quick Banking Services Links (Fidelity Inspired) */}
      <div className="auth-quick-links-bar">
        <button
          type="button"
          className="auth-quick-link-item"
          onClick={() => onNavigate('register')}
        >
          New Account Registration
        </button>
        <span className="auth-quick-links-divider">|</span>
        <button
          type="button"
          className="auth-quick-link-item"
          onClick={() => alert('For Instant Transfer without login, please dial *737# or use our Meridian Mobile App.')}
        >
          Quick Transfer
        </button>
        <span className="auth-quick-links-divider">|</span>
        <button
          type="button"
          className="auth-quick-link-item"
          onClick={() => alert('Customer Care Line: 0700-MERIDIAN (0700 6374 3426). We are available 24/7.')}
        >
          Customer Care Line
        </button>
      </div>

      {/* Footer Register link */}
      <div className="auth-card-footer">
        <span>Already hold an account but new to internet banking?</span>
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => onNavigate('register')}
          id="link-to-register"
        >
          Enroll here
        </button>
      </div>
    </div>
  );
}
