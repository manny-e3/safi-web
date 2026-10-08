import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import authService from '../../services/authService';

export default function RegisterPage({
  onNavigate,
  onRegisterSuccess,
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please enter your full first and last name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service and Banking Security Policy.');
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await authService.register({
        name: fullName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setSuccessMessage('Account created successfully! Redirecting you to sign in...');

      const registeredUser = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: fullName,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      };

      if (onRegisterSuccess) {
        onRegisterSuccess(registeredUser);
      }

      setTimeout(() => {
        onNavigate('login');
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '520px' }}>
      <button
        type="button"
        className="auth-back-link"
        onClick={() => onNavigate('login')}
        id="btn-back-to-login"
      >
        <ArrowLeft size={16} />
        <span>Back to Sign In</span>
      </button>

      <div className="auth-card-header">
        <h2 className="auth-card-title">Open an Account</h2>
        <p className="auth-card-subtitle">
          Register for Meridian Digital Banking in 3 minutes. Deposits insured by the NDIC.
        </p>
      </div>

      {errorMessage && (
        <div className="auth-alert error">
          <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-alert success">
          <ShieldCheck size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Name Row: First Name & Last Name */}
        <div className="auth-input-row">
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="register-firstname">
              First Name
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={17} />
              </span>
              <input
                id="register-firstname"
                type="text"
                className="auth-input"
                placeholder="Amina"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="register-lastname">
              Last Name
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={17} />
              </span>
              <input
                id="register-lastname"
                type="text"
                className="auth-input"
                placeholder="Bello"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="register-email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={17} />
            </span>
            <input
              id="register-email"
              type="email"
              className="auth-input"
              placeholder="amina.bello@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="register-phone">
            Mobile Phone Number
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Phone size={17} />
            </span>
            <input
              id="register-phone"
              type="tel"
              className="auth-input"
              placeholder="+234 802 345 6789"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="register-password">
            Create Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={17} />
            </span>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="At least 8 characters"
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
                <span>Password Security</span>
                <span className={`score-text ${strength.className}`}>{strength.label}</span>
              </div>

              {/* Real-time Checklist */}
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

        {/* Confirm Password */}
        <div className="auth-input-group">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="register-confirmpassword">
              Confirm Password
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
              <Lock size={17} />
            </span>
            <input
              id="register-confirmpassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`auth-input ${passwordsMismatch ? 'has-error' : ''}`}
              placeholder="Re-type your password"
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

        {/* Terms Agreement */}
        <div className="auth-checkbox-row">
          <input
            id="register-agree"
            type="checkbox"
            className="auth-checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => handleChange('agreeTerms', e.target.checked)}
            required
          />
          <label htmlFor="register-agree" className="auth-checkbox-label">
            I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Banking</a> and{' '}
            <a href="#privacy" onClick={(e) => e.preventDefault()}>SAFI Security Policy</a>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isLoading}
          id="btn-register-submit"
        >
          {isLoading ? (
            <>
              <div className="auth-spinner" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Open Bank Account</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      <div className="auth-card-footer">
        <span>Already hold an account?</span>
        <button
          type="button"
          className="auth-switch-link"
          onClick={() => onNavigate('login')}
          id="link-to-login"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
