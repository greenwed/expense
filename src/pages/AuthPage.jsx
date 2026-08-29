import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  Lock,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  X,
  Sparkles
} from 'lucide-react';

export default function AuthPage({ onSuccess }) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot_password' | 'forgot_username'

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password States
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMaskedEmail, setResetMaskedEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: request, 2: enter OTP & new pass

  // Forgot Username States
  const [recoverEmail, setRecoverEmail] = useState('');

  // General States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const startCooldown = () => {
    setOtpCooldown(60);
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 1. Send OTP for Registration
  const handleSendRegisterOtp = async () => {
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setError('Please enter a valid email address first.');
      return;
    }
    if (!regUsername || regUsername.trim().length < 3) {
      setError('Please enter a username (at least 3 characters).');
      return;
    }

    try {
      setError('');
      setSendingOtp(true);
      const res = await fetch('/api/auth/send-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, username: regUsername, name: regName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP code.');

      setOtpSent(true);
      startCooldown();
      setSuccessMsg(data.previewOtp ? `Code sent! (Dev preview: ${data.previewOtp})` : data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // 2. Submit Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      setError('Please click "Send Verification Code" to verify your email first.');
      return;
    }
    if (!regOtp || regOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          username: regUsername,
          password: regPassword,
          otp: regOtp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      localStorage.setItem('rupee_token', data.token);
      localStorage.setItem('rupee_user', JSON.stringify(data.user));
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(loginIdentifier, loginPassword);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Password Reset Code
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetIdentifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code.');

      setResetEmail(data.email);
      setResetMaskedEmail(data.maskedEmail);
      setResetStep(2);
      setSuccessMsg(data.previewOtp ? `Reset code sent! (Dev preview: ${data.previewOtp})` : data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otp: resetOtp,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setSuccessMsg('Password updated! Please log in with your new password.');
      setActiveTab('login');
      setResetStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Request Username Recovery
  const handleRecoverUsername = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/auth/forgot-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoverEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request.');

      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20 mb-4 ring-1 ring-emerald-400/40">
            <IndianRupee className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            RupeeTrack
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Personal & Collaborative Family Expense Tracker
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Main Navigation Tabs */}
          {activeTab !== 'forgot_password' && activeTab !== 'forgot_username' && (
            <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-medium leading-relaxed">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= REGISTER VIEW ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address (For Verification & Recovery) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setOtpSent(false); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username (Unique) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. karthik2026"
                    value={regUsername}
                    onChange={(e) => { setRegUsername(e.target.value.toLowerCase()); setOtpSent(false); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* OTP Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendRegisterOtp}
                  disabled={sendingOtp || otpCooldown > 0}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    otpSent
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                  <span>
                    {sendingOtp
                      ? 'Sending Verification Code...'
                      : otpCooldown > 0
                      ? `Resend Code in ${otpCooldown}s`
                      : otpSent
                      ? 'Resend Verification Code'
                      : 'Send Verification Code to Email'}
                  </span>
                </button>
              </div>

              {/* OTP Input Field */}
              {otpSent && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Enter 6-Digit Email Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={regOtp}
                    onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-lg font-bold text-center tracking-widest focus:outline-none"
                    autoFocus
                  />
                  <span className="text-[11px] text-slate-400 block text-center">
                    Check your inbox (and spam folder) for the 6-digit code
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !otpSent}
                className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          )}

          {/* ================= LOGIN VIEW ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username or Email *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Username or your email"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot_password'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot_username'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-400 hover:text-slate-300 underline font-medium"
                >
                  Forgot your Username?
                </button>
              </div>
            </form>
          )}

          {/* ================= FORGOT PASSWORD VIEW ================= */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Reset Your Password</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); setResetStep(1); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetStep === 1 ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Enter your registered <strong>username or email address</strong>. We will send a 6-digit password reset code to your email.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Username or Email *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Username or email"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-slate-300">
                    We sent a verification code to <strong className="text-emerald-300">{resetMaskedEmail}</strong>.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      6-Digit Reset Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-base font-bold text-center tracking-widest focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                  >
                    {loading ? 'Updating Password...' : 'Reset Password & Log In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= FORGOT USERNAME VIEW ================= */}
          {activeTab === 'forgot_username' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Recover Your Username</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecoverUsername} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered email address. We will send your RupeeTrack username directly to your inbox.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  {loading ? 'Checking...' : 'Send Username to Email'}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-slate-400 hover:text-slate-300"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security & Verification Footer Note */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Protected with Email OTP Verification & Secure Password Hashing</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
