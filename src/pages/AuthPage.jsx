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
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';

export default function AuthPage({ onSuccess }) {
  const { login, getFullUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'forgot_password' | 'forgot_username'

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [previewOtp, setPreviewOtp] = useState(null);
  const [emailDelivered, setEmailDelivered] = useState(false);

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
  const [resetStep, setResetStep] = useState(1);
  const [resetPreviewOtp, setResetPreviewOtp] = useState(null);

  // Forgot Username States
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState(null);

  // Feedback States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const resolveUrl = (endpoint) => {
    return getFullUrl ? getFullUrl(endpoint) : endpoint;
  };

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
      const res = await fetch(resolveUrl('/api/auth/send-register-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, username: regUsername, name: regName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP code.');

      setOtpSent(true);
      startCooldown();
      setEmailDelivered(Boolean(data.sent));

      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
      }
      setSuccessMsg(data.sent ? `Verification code sent to ${data.email}!` : 'Verification code generated!');
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
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await fetch(resolveUrl('/api/auth/register'), {
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
      const res = await fetch(resolveUrl('/api/auth/send-reset-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetIdentifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code.');

      setResetEmail(data.email);
      setResetMaskedEmail(data.maskedEmail);
      setResetStep(2);

      if (data.previewOtp) {
        setResetPreviewOtp(data.previewOtp);
      }
      setSuccessMsg(data.message);
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
      const res = await fetch(resolveUrl('/api/auth/reset-password'), {
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
      const res = await fetch(resolveUrl('/api/auth/forgot-username'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoverEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request.');

      if (data.previewUsername) {
        setRecoveredUsername(data.previewUsername);
        setSuccessMsg(`Your registered username is @${data.previewUsername}`);
      } else {
        setSuccessMsg(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] relative overflow-hidden">
      
      {/* Ambient Violet/Indigo Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-200/40 via-purple-100/30 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-purple-200/30 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-indigo-500/25 mb-3.5 border-2 border-white">
            <IndianRupee className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            RupeeTrack
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Follow your spending
          </p>
        </div>

        {/* Floating Fintech Card */}
        <div className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-slate-900/5">
          
          {/* Tabs */}
          {activeTab !== 'forgot_password' && activeTab !== 'forgot_username' && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold leading-relaxed flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= REGISTER VIEW ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address (For Verification & Recovery) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setOtpSent(false); setPreviewOtp(null); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username (Unique) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. karthik2026"
                    value={regUsername}
                    onChange={(e) => { setRegUsername(e.target.value.toLowerCase()); setOtpSent(false); setPreviewOtp(null); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-bold font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* OTP Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendRegisterOtp}
                  disabled={sendingOtp || otpCooldown > 0}
                  className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    otpSent
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
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

              {/* OTP Input & Testing Preview Card */}
              {otpSent && (
                <div className="space-y-2 animate-fadeIn">
                  {previewOtp && !emailDelivered && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-700" />
                          <span>Verification Code:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setRegOtp(previewOtp)}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition-colors"
                        >
                          Click to Fill [{previewOtp}]
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        (To send real emails to your Gmail inbox, add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GMAIL_USER</code> &amp; <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GMAIL_APP_PASSWORD</code> in Vercel settings).
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Enter 6-Digit Email Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={regOtp}
                      onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 bg-white border border-indigo-300 rounded-2xl text-indigo-700 font-mono text-xl font-black text-center tracking-widest focus:outline-none shadow-inner"
                      autoFocus
                    />
                    <span className="text-[11px] text-slate-500 block text-center">
                      {emailDelivered ? 'Check your email inbox for the code' : 'Enter the 6-digit code above'}
                    </span>
                  </div>
                </div>
              )}

              {/* Register Password with Show/Hide Eye Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !otpSent}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username or Email *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. karthik or name@example.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Login Password with Show/Hide Eye Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot_password'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot_username'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Forgot your Username?
                </button>
              </div>
            </form>
          )}

          {/* ================= FORGOT PASSWORD VIEW ================= */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Reset Your Password</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); setResetStep(1); }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetStep === 1 ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter your registered <strong>username or email</strong>. We will send a 6-digit password reset code to your email.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Username or Email *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Username or email"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-500/20 transition-all"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-slate-500">
                    We sent a verification code to <strong className="text-indigo-600">{resetMaskedEmail}</strong>.
                  </p>

                  {resetPreviewOtp && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                      <span>Code: <strong>{resetPreviewOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setResetOtp(resetPreviewOtp)}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-200 font-bold"
                      >
                        Fill Code
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      6-Digit Reset Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2 bg-slate-50 border border-indigo-300 rounded-2xl text-indigo-700 font-mono text-lg font-black text-center tracking-widest focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                        title={showResetPassword ? 'Hide password' : 'Show password'}
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-500/20 transition-all"
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Recover Your Username</span>
                </h3>
                <button
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecoverUsername} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered email address. We will send your RupeeTrack username directly to your inbox.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-500/20 transition-all"
                >
                  {loading ? 'Checking...' : 'Send Username to Email'}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Footer Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Protected with Email OTP Verification & Encryption</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
