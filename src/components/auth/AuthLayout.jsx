import React, { useState, useEffect } from 'react';
import {
  Shield,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import './Auth.css';

export default function AuthLayout({
  initialView = 'login',
  initialEmail = '',
  initialToken = '',
  onLoginSuccess,
  onNavigate,
}) {
  const [currentAuthView, setCurrentAuthView] = useState(initialView);
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState(initialToken);

  const handleAuthViewChange = (view) => {
    setCurrentAuthView(view);
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const [registeredUser, setRegisteredUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safi_registered_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync if parent updates initialView or URL params
  useEffect(() => {
    if (initialView) {
      setCurrentAuthView(initialView);
    }
  }, [initialView]);


  useEffect(() => {
    if (initialToken) setResetToken(initialToken);
    if (initialEmail) setResetEmail(initialEmail);
  }, [initialToken, initialEmail]);

  const handleRegisterSuccess = (user) => {
    setRegisteredUser(user);
    try {
      localStorage.setItem('safi_registered_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  const handlePasswordResetSuccess = (newPassword) => {
    if (registeredUser) {
      const updated = { ...registeredUser, password: newPassword };
      setRegisteredUser(updated);
      try {
        localStorage.setItem('safi_registered_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="auth-wrapper">
      {/* -------------------------------------------------------------------
          TOP BANK NAVIGATION & TRUST HEADER
          ------------------------------------------------------------------- */}
      <header className="auth-top-navbar">
        <div className="auth-nav-left">
          <div className="auth-bank-brand" onClick={() => handleAuthViewChange('login')}>
            <div className="auth-bank-logo-icon">
              <Shield size={22} color="#FFFFFF" />
            </div>
            <div className="auth-bank-brand-text">
              <span className="auth-bank-brand-title">
                Meridian <span className="brand-accent">Bank</span>
              </span>
              <span className="auth-bank-brand-subtitle">Online Banking Portal</span>
            </div>
          </div>

          <div className="auth-nav-divider" />

          {/* Central Bank of Nigeria Regulatory Trust Badge */}
          <div className="auth-cbn-badge" title="Regulated by Central Bank of Nigeria">
            <span className="cbn-seal-icon">✓</span>
            <span>Licensed by the CBN • Insured by NDIC</span>
          </div>
        </div>

        <div className="auth-nav-right">
          <a
            href="https://meridianbank.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="auth-nav-link"
            onClick={(e) => e.preventDefault()}
          >
            <span>Visit Bank Website</span>
            <ExternalLink size={13} />
          </a>

          <div className="auth-hotline-pill">
            <Phone size={14} />
            <span>0700-MERIDIAN (6374 3426)</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------
          MAIN SPLIT SCREEN
          ------------------------------------------------------------------- */}
      <div className="auth-container">
        {/* LEFT PANEL: Static Bank Hero Picture & Fund Immunity Showcase */}
        <div className="auth-hero-panel">
          {/* Static Background Image */}
          <div className="auth-slider-bg-wrap">
            <div
              className="auth-slider-bg-slide active"
              style={{ backgroundImage: `url('/images/bank_hero_branch.jpg')` }}
            />
          </div>

          {/* Vignette Overlay */}
          <div className="auth-hero-overlay" />

          {/* Top Pill inside Hero */}
          <div className="auth-hero-top-badge">
            <span className="pulse-green-dot" />
            <span>Meridian Premier Banking • 256-Bit SSL Secured</span>
          </div>

          {/* Clean Static Showcase Card (No Slider Controls) */}
          <div className="auth-slider-card">
            <span className="auth-slider-badge-tag">AUTONOMOUS FUND IMMUNITY</span>
            <h2 className="auth-slider-title">Intelligent Banking with Fund Immunity</h2>
            <p className="auth-slider-desc">
              Manage day-to-day accounts while SAFI autonomous fund governance dynamically
              isolates and protects your primary capital against unauthorized drains.
            </p>

            {/* Tags strip */}
            <div className="auth-banking-pill-tags">
              <span className="auth-banking-pill-tag">Dynamic Vault Segregation</span>
              <span className="auth-banking-pill-tag">Bank-Grade 256-Bit SSL</span>
              <span className="auth-banking-pill-tag">Real-Time Anomaly Defense</span>
            </div>
          </div>

          {/* ALAT by WEMA Style: "Talk to Us" Support Bar */}
          <div className="auth-talk-support">
            <div className="auth-support-contact-row">
              <div className="auth-support-item">
                <Phone size={14} />
                <span>Helpline: <strong>0700-MERIDIAN</strong></span>
              </div>
              <div className="auth-support-item">
                <Mail size={14} />
                <span>support@meridianbank.ng</span>
              </div>
            </div>

            <div className="auth-security-badges-list">
              <div className="auth-security-badge-item">
                <CheckCircle size={13} />
                <span>ISO 27001</span>
              </div>
              <div className="auth-security-badge-item">
                <CheckCircle size={13} />
                <span>NDIC Insured</span>
              </div>
              <div className="auth-security-badge-item">
                <CheckCircle size={13} />
                <span>NDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Crisp, Clean Corporate White Login Portal */}
        <div className="auth-form-panel">
          {/* Subtle Geometric Wireframe Watermark */}
          <div className="auth-watermark-geometry" />
          <div className="auth-watermark-mesh" />

          {currentAuthView === 'login' && (
            <LoginPage
              onNavigate={(view) => handleAuthViewChange(view)}
              onLoginSuccess={(user) => onLoginSuccess && onLoginSuccess(user)}
              registeredUser={registeredUser}
            />
          )}

          {currentAuthView === 'register' && (
            <RegisterPage
              onNavigate={(view) => handleAuthViewChange(view)}
              onRegisterSuccess={handleRegisterSuccess}
            />
          )}

          {currentAuthView === 'forgot_password' && (
            <ForgotPasswordPage
              onNavigate={(view) => handleAuthViewChange(view)}
              onResetRequested={({ email, token }) => {
                setResetEmail(email);
                if (token) setResetToken(token);
              }}
            />
          )}

          {currentAuthView === 'reset_password' && (
            <ResetPasswordPage
              onNavigate={(view) => handleAuthViewChange(view)}
              onPasswordResetSuccess={handlePasswordResetSuccess}
              resetEmail={resetEmail}
              resetToken={resetToken}
            />
          )}

          {/* Footer Legal & Disclaimers */}
          <div className="auth-portal-footer-legal">
            <p>
              © 2026 Meridian Bank Plc. RC 128492. Regulated by the Central Bank of Nigeria (CBN).
              All deposits are insured by the Nigeria Deposit Insurance Corporation (NDIC).
            </p>
            <div className="auth-legal-nav">
              <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              <span>•</span>
              <a href="#security" onClick={(e) => e.preventDefault()}>Security Tips</a>
              <span>•</span>
              <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
              <span>•</span>
              <a href="#whistleblowing" onClick={(e) => e.preventDefault()}>Whistleblowing</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
