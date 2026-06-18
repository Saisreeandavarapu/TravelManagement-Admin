import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back, Admin!', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.65)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')`
      }}
    >
      <div className="w-full max-w-md bg-white/15 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in text-white">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 text-white font-bold text-2xl shadow-xl shadow-primary-550/35 mb-4">
            T
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Travel Management</h2>
          <p className="text-sm text-slate-200/80 mt-1.5 font-medium">Administrator Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-250">
              Email Address / User ID
            </label>
            <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl focus-within:border-primary-450 focus-within:ring-1 focus-within:ring-primary-450 transition-all">
              <FiMail className="absolute left-4 w-5 h-5 text-slate-300" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@travel.com"
                className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-300/60"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-250">
              Password
            </label>
            <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl focus-within:border-primary-450 focus-within:ring-1 focus-within:ring-primary-450 transition-all">
              <FiLock className="absolute left-4 w-5 h-5 text-slate-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none outline-none pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-300/60"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-300 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember me (UI-only) */}
          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900 transition-colors"
                disabled={isLoading}
              />
              <span className="text-slate-200 select-none text-xs font-medium">Remember me</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary-550 text-white font-bold text-sm shadow-xl shadow-primary-550/25 hover:bg-primary-600 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
