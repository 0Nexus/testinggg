import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  ArrowRight, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Briefcase,
  Mail,
  KeyRound,
  RefreshCw,
  ChevronLeft,
  Send,
  Check,
  User as UserIcon,
  Phone,
  Clock,
  ExternalLink
} from 'lucide-react';
import { User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

interface WelcomeAuthScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify_email' | 'forgot_password'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields for Login / Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'homeowner' | 'contractor' | 'inspector'>('homeowner');

  // Contractor Specific Rates & Details
  const [tradeType, setTradeType] = useState('Emergency Plumbing & Repairs');
  const [hourlyRateGBP, setHourlyRateGBP] = useState(75);
  const [fixedQuoteEstimateGBP, setFixedQuoteEstimateGBP] = useState(450);
  const [phone, setPhone] = useState('+44 20 7946 0999');
  const [certifications, setCertifications] = useState('Gas Safe Registered, TrustMark Approved');
  const [bio, setBio] = useState('10+ years experience in UK home repairs and emergency maintenance.');

  // Email Confirmation State
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Clear messages on mode switch
  const switchMode = (newMode: 'login' | 'register' | 'verify_email' | 'forgot_password') => {
    setError(null);
    setSuccessMessage(null);
    setAuthMode(newMode);
  };

  // Submit Login or Register
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const contractorProfile = role === 'contractor' ? {
      companyName: companyName || `${name}'s Trade Services`,
      tradeType,
      hourlyRateGBP: Number(hourlyRateGBP),
      fixedQuoteEstimateGBP: Number(fixedQuoteEstimateGBP),
      phone,
      certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
      bio,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      availability: 'Immediate (Within 2 hrs)'
    } : undefined;

    const payload = authMode === 'register'
      ? { email, password, name, companyName, role, phone, contractorProfile }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        // If account is unverified, navigate immediately to verification screen
        if (data.requiresVerification) {
          setVerificationEmail(data.email || email);
          setVerificationCode('');
          setAuthMode('verify_email');
          setError(data.message || data.error || 'Please confirm your email address to access your account.');
          return;
        }
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Handle Registration Success -> Mandatory Email Confirmation
      if (authMode === 'register' && data.requiresVerification) {
        setVerificationEmail(data.email || email);
        setVerificationCode('');
        setSuccessMessage(data.message || `Account created! A confirmation code has been sent to ${data.email || email}.`);
        setAuthMode('verify_email');
        return;
      }

      // Handle Successful Login
      if (data.token && data.user) {
        localStorage.setItem('tidy_secure_token', data.token);
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Email Confirmation Code
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError('Please enter the full 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail || email,
          code: verificationCode.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification code is invalid or expired.');
      }

      if (data.token && data.user) {
        setSuccessMessage('Email verified successfully! Entering your escrow portal...');
        localStorage.setItem('tidy_secure_token', data.token);
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify email confirmation code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Email Confirmation Code
  const handleResendVerificationCode = async () => {
    const targetEmail = verificationEmail || email;
    if (!targetEmail) {
      setError('Please provide an email address.');
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend confirmation code.');
      }

      setVerificationCode('');
      setSuccessMessage(data.message || `A new 6-digit confirmation code has been sent to ${targetEmail}.`);
    } catch (err: any) {
      setError(err.message || 'Error resending code.');
    } finally {
      setIsResending(false);
    }
  };

  // Request Password Reset Code
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process password recovery request.');
      }

      setResetCode('');
      setSuccessMessage(data.message || 'Password reset recovery code has been sent to your email.');
      setForgotStep('reset');
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Password Reset with OTP & New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.trim().length < 6) {
      setError('Please enter the 6-digit password reset verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode.trim(),
          otp: resetCode.trim(),
          token: resetToken,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccessMessage('Password reset successfully! Redirecting to sign in...');
      setPassword(newPassword);
      setEmail(resetEmail);

      setTimeout(() => {
        setAuthMode('login');
        setForgotStep('request');
        setSuccessMessage('Password updated. You can now sign in with your new password.');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Demo Profiles
  const handleDemoFill = (targetRole: 'contractor' | 'homeowner' | 'inspector' | 'admin') => {
    setError(null);
    setSuccessMessage(null);
    setAuthMode('login');
    if (targetRole === 'admin') {
      setEmail('wassim.mehdaoui@tidycorp.co.uk');
      setPassword('password123');
    } else if (targetRole === 'contractor') {
      setEmail('wassim.mehdaoui@tidycorp.co.uk');
      setPassword('password123');
    } else if (targetRole === 'inspector') {
      setEmail('admin@tidycorp.co.uk');
      setPassword('password123');
    } else {
      setEmail('sarah.jenkins@homeowner.co.uk');
      setPassword('password123');
    }
  };

  return (
    <div id="welcome-auth-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#0057B8] selection:text-white">
      {/* Top Header Branding */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TidyCorpLogo size="md" />
            <span className="font-black text-lg tracking-tight text-white">
              Tidy Corporation Ltd
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Security Control Online &bull; FCA / UK GDPR</span>
          </div>
        </div>
      </header>

      {/* Main Form & Showcase Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Platform Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold">
              <Lock className="h-3.5 w-3.5 text-[#FF7F00]" />
              <span>UK Construction Escrow &amp; Milestone Gateway</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Regulated Milestone Escrow &amp; Verified Settlement
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Direct BACS &amp; Card pre-authorization escrow holds, automated statutory Awaab's Law hazard timers, and chartered RICS inspection releases.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
              <div className="flex items-start space-x-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Email Verified Accounts:</strong> Secure 2FA confirmation protects escrow trust funds.</span>
              </div>
              <div className="flex items-start space-x-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Airwallex &amp; Stripe MCP:</strong> Dynamic fee routing with 90-day ring-fenced client funds.</span>
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                1-Click Quick Demo Profiles:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin')}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1 text-rose-400 text-xs font-bold">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Wassim (Owner)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoFill('contractor')}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1 text-cyan-400 text-xs font-bold">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Contractor</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Trade Master</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoFill('homeowner')}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Client</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Sarah Jenkins</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoFill('inspector')}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Inspector</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">RICS Compliance</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              
              {/* Card Navigation Tabs */}
              {authMode === 'login' || authMode === 'register' ? (
                <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
                  <button
                    id="tab-auth-login"
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[#0057B8] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    id="tab-auth-register"
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-[#0057B8] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register Account
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-bold text-slate-400 hover:text-cyan-400 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                    {authMode === 'verify_email' ? 'Email Confirmation' : 'Password Recovery'}
                  </span>
                </div>
              )}

              {/* Error Message Box */}
              {error && (
                <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message Box */}
              {successMessage && (
                <div className="mb-4 p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODE 1: EMAIL CONFIRMATION (MANDATORY BEFORE LOGIN/ACCESS) */}
              {/* ========================================================= */}
              {authMode === 'verify_email' && (
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 mx-auto flex items-center justify-center shadow-lg">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-black text-white">Confirm Your Email Address</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A 6-digit confirmation code was sent to <span className="text-cyan-400 font-bold font-mono">{verificationEmail || email}</span>. Please check your inbox and spam folder.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Enter 6-Digit Code
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="e.g. 849201"
                        className="w-full bg-slate-950 border border-slate-800 text-cyan-300 rounded-xl pl-10 pr-4 py-3 text-base font-mono font-black tracking-widest focus:ring-2 focus:ring-[#0057B8] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Confirm Email &amp; Access Portal</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>Didn't receive the email?</span>
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={handleResendVerificationCode}
                      className="text-[#FF7F00] hover:underline font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      {isResending ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      <span>Resend Code</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* MODE 2: FORGOT PASSWORD WORKFLOW                          */}
              {/* ========================================================= */}
              {authMode === 'forgot_password' && (
                <div>
                  {forgotStep === 'request' ? (
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                      <div className="text-center space-y-2 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800/80 mx-auto flex items-center justify-center shadow-lg">
                          <KeyRound className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-black text-white">Reset Account Password</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Enter your registered email address to receive a secure 6-digit recovery code.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={e => setResetEmail(e.target.value)}
                            placeholder="e.g. wassim.mehdaoui@tidycorp.co.uk"
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        ) : (
                          <>
                            <span>Send Recovery Code</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div className="text-center space-y-2 mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 mx-auto flex items-center justify-center shadow-lg">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-black text-white">Create New Password</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Enter the 6-digit recovery code sent to your email and choose a new password.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                          6-Digit Recovery Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={resetCode}
                          onChange={e => setResetCode(e.target.value)}
                          placeholder="e.g. 849201"
                          className="w-full bg-slate-950 border border-slate-800 text-cyan-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-[#0057B8] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                          New Password (Min. 6 Characters)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        ) : (
                          <>
                            <span>Update Password &amp; Continue</span>
                            <CheckCircle2 className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* MODE 3: LOGIN / REGISTER STANDARD FORM                    */}
              {/* ========================================================= */}
              {(authMode === 'login' || authMode === 'register') && (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Wassim Mehdaoui"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Tidy Corp UK"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Account Role</label>
                        <select
                          value={role}
                          onChange={e => setRole(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-bold"
                        >
                          <option value="homeowner">Homeowner / Customer</option>
                          <option value="contractor">Contractor / Trade Specialist</option>
                          <option value="inspector">Chartered Inspector (RICS)</option>
                        </select>
                      </div>

                      {role === 'contractor' && (
                        <div className="space-y-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                          <span className="block font-black text-amber-400 uppercase text-[10px] tracking-wider">
                            Contractor Profile &amp; Rates Setup
                          </span>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Trade Specialty</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Emergency Plumbing"
                                value={tradeType}
                                onChange={e => setTradeType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Hourly Rate (£)</label>
                              <input
                                type="number"
                                required
                                value={hourlyRateGBP}
                                onChange={e => setHourlyRateGBP(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Fixed Quote Est. (£)</label>
                              <input
                                type="number"
                                required
                                value={fixedQuoteEstimateGBP}
                                onChange={e => setFixedQuoteEstimateGBP(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Phone Contact</label>
                              <input
                                type="text"
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Certifications (Comma separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Gas Safe, NICEIC, TrustMark"
                              value={certifications}
                              onChange={e => setCertifications(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@tidycorp.co.uk"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">Password</label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            switchMode('forgot_password');
                          }}
                          className="text-xs font-semibold text-[#FF7F00] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        <span>{authMode === 'login' ? 'Sign In to Portal' : 'Register & Verify Email'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="text-[11px] text-slate-500 text-center mt-6">
                Protected by Tidy Corp 256-Bit SSL Escrow Gateway Enclosure
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Tidy Corp AI Secure &bull; UK Renovation &amp; Construction Escrow Control Systems
      </footer>
    </div>
  );
};
