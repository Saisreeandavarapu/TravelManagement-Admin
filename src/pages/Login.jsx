import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';
import { driverApi } from '../services/driverApi';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser,
  FiPhone, FiMapPin, FiTruck, FiArrowLeft,
  FiZap, FiGlobe, FiShield, FiStar, FiUsers
} from 'react-icons/fi';

const VEHICLE_TYPES = ['Van', 'Mini Bus', 'Bus', 'Luxury Van', 'SUV', 'Sedan', 'Tempo Traveller'];

/* ── Field Input ── */
const Field = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
    <div className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      onFocus={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.7)'}
      onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'}
    >
      {Icon && <Icon className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />}
      <input
        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 py-3"
        style={{ paddingLeft: Icon ? '2.5rem' : '1rem', paddingRight: '1rem' }}
        {...props}
      />
    </div>
  </div>
);

/* ── Login stat badges ── */
const StatBadge = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
    <Icon className="w-4 h-4 text-indigo-400" />
    <div>
      <p className="text-[9px] text-slate-500 font-medium leading-none">{label}</p>
      <p className="text-xs font-bold text-white leading-tight">{value}</p>
    </div>
  </div>
);

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState('login'); // login | register-customer | register-driver | forgot-password
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register shared
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Driver specific
  const [licenseNo, setLicenseNo] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('Van');
  const [expYears, setExpYears] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');

  const resetForms = (newView) => {
    setView(newView); setLoading(false); setShowPwd(false);
    setFirstName(''); setLastName(''); setRegEmail(''); setRegPhone('');
    setRegPwd(''); setConfirmPwd(''); setLicenseNo(''); setVehicleName('');
    setVehicleType('Van'); setExpYears(''); setAddress(''); setCity(''); setState('');
    setResetEmail(''); setNewPwd(''); setConfirmNewPwd('');
  };

  /* ── Handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { showToast('Please fill in all fields', 'warning'); return; }
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const role = loggedUser?.role?.toUpperCase();
      if (role === 'ADMIN') {
        showToast('Welcome back, Admin!', 'success');
        navigate('/admin/dashboard');
      } else if (role === 'DRIVER') {
        showToast('Welcome back, Partner Driver!', 'success');
        navigate('/driver/dashboard');
      } else if (role === 'CUSTOMER') {
        showToast(`Welcome back, ${loggedUser.firstName || 'Customer'}!`, 'success');
        navigate('/customer/dashboard');
      } else {
        showToast('Logged in successfully!', 'success');
        navigate('/customer/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally { setLoading(false); }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !regEmail || !regPhone || !regPwd) { showToast('Please fill all fields', 'warning'); return; }
    if (regPwd !== confirmPwd) { showToast('Passwords do not match', 'error'); return; }
    setLoading(true);
    try {
      await userApi.registerUser({ firstName, lastName, email: regEmail, password: regPwd, phoneNumber: regPhone, role: 'CUSTOMER' });
      showToast('Account created! Please sign in.', 'success');
      resetForms('login');
    } catch (err) { showToast(err.message || 'Registration failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !regEmail || !regPhone || !regPwd) { showToast('Fill account details', 'warning'); return; }
    if (regPwd !== confirmPwd) { showToast('Passwords do not match', 'error'); return; }
    if (!licenseNo || !vehicleName || !expYears || !address || !city || !state) { showToast('Fill all driver details', 'warning'); return; }
    setLoading(true);
    try {
      const user = await userApi.registerUser({ firstName, lastName, email: regEmail, password: regPwd, phoneNumber: regPhone, role: 'DRIVER' });
      await driverApi.addDriver({ registration: user, licenseNumber: licenseNo, vehicleName, vehicleType, experienceYears: parseInt(expYears)||0, address, city, state, status: 'PENDING' });
      showToast('Driver application submitted! Awaiting admin approval.', 'success');
      resetForms('login');
    } catch (err) { showToast(err.message || 'Registration failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail || !newPwd || !confirmNewPwd) { showToast('Fill in all fields', 'warning'); return; }
    if (newPwd !== confirmNewPwd) { showToast('Passwords do not match', 'error'); return; }
    setLoading(true);
    try {
      const all = await userApi.allUsers();
      const match = all.find(u => u.email?.toLowerCase() === resetEmail.toLowerCase());
      if (!match) throw new Error('No account found with this email.');
      await userApi.resetPassword(match.id, newPwd);
      showToast('Password updated! Please sign in.', 'success');
      resetForms('login');
    } catch (err) { showToast(err.message || 'Password reset failed.', 'error'); }
    finally { setLoading(false); }
  };

  /* ── Panel config ── */
  const viewTitle = {
    'login': 'Administrator Portal',
    'register-customer': 'Create Customer Account',
    'register-driver': 'Register as Partner Driver',
    'forgot-password': 'Reset Your Password',
  };

  const isDriverView = view === 'register-driver';

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a1a' }}>

      {/* ── LEFT PANEL (decorative, hidden on small) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a40 50%, #0d0d23 100%)' }}>

        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', transform: 'translate(25%, 25%)' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />

        <div className="relative flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-black text-white">Travel<span style={{ color: '#6366f1' }}>Admin</span></p>
              <p className="text-[10px] text-slate-500">Management Portal</p>
            </div>
          </div>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 w-fit"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">All Systems Operational</span>
            </div>

            <h2 className="font-display text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Control Every<br/>
              <span style={{
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>Aspect of Travel.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              A unified admin dashboard to manage users, drivers, packages, bookings, payments and reviews — all in one place.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <StatBadge icon={FiUsers} label="Registered Users" value="500+" />
              <StatBadge icon={FiGlobe} label="Tour Packages" value="50+" />
              <StatBadge icon={FiStar} label="5-Star Reviews" value="200+" />
            </div>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                { icon: FiShield, text: 'Secure role-based authentication' },
                { icon: FiTruck, text: 'Real-time driver & fleet management' },
                { icon: FiZap, text: 'Instant booking & payment tracking' },
              ].map(({ icon: I, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    <I className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-slate-400">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-slate-600">© 2026 TravelAdmin. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className={`flex-1 flex items-center justify-center p-6 ${isDriverView ? 'lg:w-1/2 xl:w-[45%]' : 'lg:w-1/2 xl:w-[45%]'}`}
        style={{ background: '#0f0f23' }}>
        <div className={`w-full animate-scale-pop ${isDriverView ? 'max-w-3xl' : 'max-w-md'}`}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <p className="font-display text-lg font-black text-white">Travel<span style={{ color: '#6366f1' }}>Admin</span></p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-7 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}>

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  {viewTitle[view]}
                </span>
              </div>
              <h1 className="font-display text-2xl font-black text-white">
                {view === 'login' && 'Sign In'}
                {view === 'register-customer' && 'Create Account'}
                {view === 'register-driver' && 'Driver Registration'}
                {view === 'forgot-password' && 'Reset Password'}
              </h1>
            </div>

            {/* ── LOGIN ── */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Email Address" icon={FiMail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@travel.com" required disabled={loading} />

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                    <button type="button" onClick={() => resetForms('forgot-password')}
                      className="text-[10px] font-bold transition-colors" style={{ color: '#818cf8' }}>
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <FiLock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input type={showPwd ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading}
                      className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 py-3"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 text-slate-400 hover:text-white transition-colors">
                      {showPwd ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                  {loading ? 'Signing In…' : 'Sign In'}
                </button>

                <div className="pt-4 border-t space-y-2 text-center text-xs text-slate-500"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p>New customer?{' '}
                    <button type="button" onClick={() => resetForms('register-customer')}
                      className="font-bold transition-colors" style={{ color: '#818cf8' }}>
                      Register Account
                    </button>
                  </p>
                  <p>Want to drive with us?{' '}
                    <button type="button" onClick={() => resetForms('register-driver')}
                      className="font-bold transition-colors" style={{ color: '#818cf8' }}>
                      Register as Driver
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ── REGISTER CUSTOMER ── */}
            {view === 'register-customer' && (
              <form onSubmit={handleRegisterCustomer} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" icon={FiUser} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" required />
                  <Field label="Last Name"  icon={FiUser} type="text" value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Doe"  required />
                </div>
                <Field label="Email Address" icon={FiMail}  type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="john@example.com" required />
                <Field label="Phone Number"  icon={FiPhone} type="tel"   value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9876543210"       required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password"         icon={FiLock} type="password" value={regPwd}     onChange={e => setRegPwd(e.target.value)}     placeholder="••••••••" required />
                  <Field label="Confirm Password" icon={FiLock} type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white mt-2 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
                  {loading ? 'Creating Account…' : 'Create Customer Account'}
                </button>
                <button type="button" onClick={() => resetForms('login')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mx-auto transition-colors mt-1">
                  <FiArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </form>
            )}

            {/* ── REGISTER DRIVER ── */}
            {view === 'register-driver' && (
              <form onSubmit={handleRegisterDriver} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {/* Account column */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest pb-2" style={{ color: '#818cf8', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                      1. Account Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="First Name" icon={FiUser} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" required />
                      <Field label="Last Name"  icon={FiUser} type="text" value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Smith" required />
                    </div>
                    <Field label="Email"        icon={FiMail}  type="email"    value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="jane@travel.com" required />
                    <Field label="Phone Number" icon={FiPhone} type="tel"      value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="9123456789"     required />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Password"         icon={FiLock} type="password" value={regPwd}     onChange={e => setRegPwd(e.target.value)}     placeholder="••••••••" required />
                      <Field label="Confirm Password" icon={FiLock} type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" required />
                    </div>
                  </div>
                  {/* Driver column */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest pb-2" style={{ color: '#06b6d4', borderBottom: '1px solid rgba(6,182,212,0.2)' }}>
                      2. Driver & Vehicle Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="License No." icon={FiShield} type="text" value={licenseNo}  onChange={e => setLicenseNo(e.target.value)}  placeholder="DL-AP-1234" required />
                      <Field label="Experience (yrs)" icon={FiStar} type="number" value={expYears} onChange={e => setExpYears(e.target.value)} placeholder="5" min="0" required />
                    </div>
                    <Field label="Vehicle Name" icon={FiTruck} type="text" value={vehicleName} onChange={e => setVehicleName(e.target.value)} placeholder="Toyota HiAce" required />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vehicle Type</label>
                      <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                        className="w-full text-sm py-3 px-4 rounded-xl outline-none cursor-pointer"
                        style={{ background: 'rgba(15,15,25,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>
                        {VEHICLE_TYPES.map(t => <option key={t} value={t} style={{ background: '#1a1a40' }}>{t}</option>)}
                      </select>
                    </div>
                    <Field label="Street Address" icon={FiMapPin} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Road" required />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="City"  type="text" value={city}  onChange={e => setCity(e.target.value)}  placeholder="Hyderabad" required />
                      <Field label="State" type="text" value={state} onChange={e => setState(e.target.value)} placeholder="Telangana" required />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button type="button" onClick={() => resetForms('login')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    <FiArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}>
                    {loading ? 'Submitting…' : 'Submit Driver Application'}
                  </button>
                </div>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {view === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="p-3 rounded-xl text-xs text-amber-300 mb-2"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  Enter your registered email and a new password to reset your account credentials.
                </div>
                <Field label="Registered Email" icon={FiMail}  type="email"    value={resetEmail}    onChange={e => setResetEmail(e.target.value)}    placeholder="you@example.com"  required />
                <Field label="New Password"      icon={FiLock}  type="password" value={newPwd}         onChange={e => setNewPwd(e.target.value)}         placeholder="••••••••"         required />
                <Field label="Confirm Password"  icon={FiLock}  type="password" value={confirmNewPwd}  onChange={e => setConfirmNewPwd(e.target.value)}  placeholder="••••••••"         required />

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white mt-1 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.35)' }}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => resetForms('login')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mx-auto transition-colors mt-1">
                  <FiArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
