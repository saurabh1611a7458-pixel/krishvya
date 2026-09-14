import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useFarm } from '../context/FarmContext';
import { otpService } from '../services/otpService';
import { ArrowLeft, RefreshCw, KeyRound, Sparkles } from 'lucide-react';

export const OtpVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, login } = useFarm();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = sanitized.slice(-1); // keep last typed character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    const nextFocusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter all 6 digits of your OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await otpService.verifyOtp(fullOtp);
      if (res.success) {
        await login(user.phone || user.email);
        // Navigate to Onboarding as required
        navigate('/onboarding');
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await otpService.sendOtp(user.phone || user.email);
      setCountdown(res.resendDelaySeconds);
      setInfoMessage('A fresh verification code has been sent to your device.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex flex-col justify-between">
      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-krishi-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Signup</span>
        </Link>
        <LanguageSelector compact />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 sm:p-10 text-center shadow-soft-lg">
          <div className="w-16 h-16 rounded-2xl bg-krishi-100 text-krishi-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {t('verifyAccount')}
          </h2>

          <p className="text-sm text-gray-600 mt-2 mb-1">
            {t('otpSentMessage')}
          </p>
          <p className="text-sm font-bold text-gray-800 font-mono mb-6">
            {user.phone || user.email || '+91 98765 43210'}
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-200">
              {infoMessage}
            </div>
          )}

          {/* 6 Digit OTP Inputs */}
          <form onSubmit={handleVerify}>
            <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-krishi-500 focus:border-krishi-600 shadow-xs transition-all select-none"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? 'Verifying...' : t('verifyOtp')}
            </Button>
          </form>

          {/* Resend & Timer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-2 pt-2 border-t border-earth-100">
            <div>
              {countdown > 0 ? (
                <span>
                  {t('resendIn')} <strong className="text-gray-800">{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-krishi-700 font-bold hover:underline"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('resendOtp')}</span>
                </button>
              )}
            </div>

            {/* Development Mock Code Trigger */}
            <button
              type="button"
              onClick={fillTestOtp}
              className="inline-flex items-center gap-1 text-xs text-earth-700 hover:text-earth-900 bg-earth-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('useTestOtp')}</span>
            </button>
          </div>
        </Card>
      </div>

      <div className="py-4 text-center text-xs text-gray-400">
        KRISHVYA Secure Farm Verification
      </div>
    </div>
  );
};
