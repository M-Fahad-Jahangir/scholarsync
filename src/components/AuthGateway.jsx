import React, { useState } from 'react';
import {
  CalendarDays,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { registerUser, loginUser, logoutUser, claimSuperAdmin } from '../services/authService';

export default function AuthGateway({ authState, children }) {
  const { user, profile, isApproved, isSuperAdmin, isPending, isRevoked, loading } =
    authState;

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimSuperAdmin = async () => {
    if (!user) return;
    setIsClaiming(true);
    try {
      await claimSuperAdmin(user.uid);
    } catch (err) {
      console.error('Failed to claim super admin:', err);
      alert('Error activating Super Admin: ' + err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  // 1. Loading state
  if (loading) {
    return (
      <div className="auth-fullscreen-container">
        <div className="auth-loading-card">
          <Loader2 size={36} className="spinner-icon text-primary" />
          <p className="auth-loading-text">Verifying credentials & access status...</p>
        </div>
      </div>
    );
  }

  // 2. User is logged in and APPROVED (or Super Admin) -> Render timetable application!
  if (user && (isApproved || isSuperAdmin)) {
    return children;
  }

  // 3. User is logged in but PENDING approval
  if (user && isPending) {
    return (
      <div className="auth-fullscreen-container">
        <div className="auth-card auth-pending-card">
          <div className="pending-icon-bubble">
            <Clock size={36} className="text-warning animate-pulse" />
          </div>

          <h2 className="pending-title">Account Awaiting Approval</h2>
          <p className="pending-user-badge">
            Signed in as <strong>{user.email}</strong>
          </p>

          <div className="pending-info-box">
            <p className="pending-desc">
              Your account has been registered successfully! To maintain timetable integrity and
              security, regular academic accounts must be approved by the <strong>Super Admin</strong>.
            </p>
            <div className="pending-perk-row">
              <ShieldCheck size={18} className="text-success" />
              <span>Once approved, you will have permanent lifetime access.</span>
            </div>
            <div className="pending-perk-row">
              <Sparkles size={18} className="text-primary" />
              <span>Live listener is active — this screen will unlock automatically when approved.</span>
            </div>
          </div>

          <div className="pending-actions">
            <button
              type="button"
              className="btn btn-primary w-full"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                padding: '11px 16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
              disabled={isClaiming}
              onClick={handleClaimSuperAdmin}
            >
              <ShieldCheck size={18} />
              <span>{isClaiming ? 'Activating Super Admin...' : 'I am the Owner (Activate Super Admin)'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => logoutUser()}
            >
              <LogOut size={16} /> Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. User is logged in but REVOKED / BLOCKED
  if (user && isRevoked) {
    return (
      <div className="auth-fullscreen-container">
        <div className="auth-card auth-revoked-card">
          <div className="revoked-icon-bubble">
            <ShieldAlert size={36} className="text-danger" />
          </div>

          <h2 className="revoked-title">Access Revoked</h2>
          <p className="pending-user-badge">
            Account: <strong>{user.email}</strong>
          </p>

          <p className="revoked-desc">
            Your access to ScholarSync has been suspended or deleted by the Super Admin. If you
            believe this is an error, please contact your academic administrator.
          </p>

          <div className="pending-actions">
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => logoutUser()}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. User is NOT logged in: Render Login / Sign Up Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both password fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { isSuperAdmin: becameSuperAdmin } = await registerUser({
          email,
          password,
          displayName,
        });
        if (becameSuperAdmin) {
          setSuccessNotice('Welcome Super Admin! Your master account has been activated.');
        } else {
          setSuccessNotice('Account registered! Awaiting Super Admin approval.');
        }
      } else {
        await loginUser(email, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let friendlyMsg = err.message || 'An error occurred during authentication.';
      if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendlyMsg = 'Invalid email or password. Please double-check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMsg = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMsg =
          'Email/Password sign-in is not enabled in Firebase. Please enable it in Firebase Console > Authentication > Sign-in method.';
      }
      setErrorMessage(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-fullscreen-container">
      <div className="auth-card">
        {/* App Branding Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <CalendarDays size={28} className="text-primary" />
          </div>
          <h1 className="auth-app-title">ScholarSync</h1>
          <p className="auth-app-sub">Lecture & Timetable Management Portal</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'tab-active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'tab-active' : ''}`}
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
          >
            Create Account (Sign Up)
          </button>
        </div>

        {/* Error / Success Notices */}
        {errorMessage && (
          <div className="auth-alert-box alert-error">
            <AlertCircle size={16} className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="auth-alert-box alert-success">
            <ShieldCheck size={16} className="alert-icon" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name / Designation *</label>
              <div className="auth-input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  className="form-input with-icon"
                  placeholder="e.g. Sir Danish, Dr. Sarah"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                className="form-input with-icon"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={mode === 'login'}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input with-icon with-action"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input with-icon"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-approval-note">
              <ShieldCheck size={14} className="text-primary flex-shrink-0" />
              <span>
                New registrations are reviewed by the Super Admin before lifetime access is granted.
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner-icon" />
                <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <span>{mode === 'signup' ? 'Submit Sign Up' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="auth-footer-meta">
          <span>Protected with Firebase Authentication & Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}
