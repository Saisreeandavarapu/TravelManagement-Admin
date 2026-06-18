import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';
import { driverApi } from '../services/driverApi';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiUser,
  FiPhone, FiAward, FiMapPin, FiTruck
} from 'react-icons/fi';

const VEHICLE_TYPES = ['Van', 'Mini Bus', 'Bus', 'Luxury Van', 'SUV', 'Sedan', 'Tempo Traveller'];

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // View toggle: 'login' | 'register-customer' | 'register-driver' | 'forgot-password'
  const [view, setView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  // Common UI states
  const [showPassword, setShowPassword] = useState(false);

  // 1. Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 2. Customer & Driver Base Registration States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 3. Driver Specific States
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('Van');
  const [experienceYears, setExperienceYears] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // 4. Reset Password States
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Reset forms on view switch
  const handleViewChange = (newView) => {
    setView(newView);
    setIsLoading(false);
    setShowPassword(false);
    // Clear registration fields
    setFirstName('');
    setLastName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setConfirmPassword('');
    // Clear driver fields
    setLicenseNumber('');
    setVehicleName('');
    setVehicleType('Van');
    setExperienceYears('');
    setAddress('');
    setCity('');
    setState('');
    // Clear reset password fields
    setResetEmail('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Submit Handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('Welcome back, Admin!', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    if (regPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await userApi.registerUser({
        firstName,
        lastName,
        email: regEmail,
        password: regPassword,
        phoneNumber: regPhone,
        role: 'CUSTOMER'
      });
      showToast('Customer account created! Please sign in.', 'success');
      handleViewChange('login');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDriverSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      showToast('Please fill account details', 'warning');
      return;
    }
    if (regPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!licenseNumber.trim() || !vehicleName.trim() || !experienceYears.trim() || !address.trim() || !city.trim() || !state.trim()) {
      showToast('Please fill all driving and address details', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create registration entry with role DRIVER
      const userResult = await userApi.registerUser({
        firstName,
        lastName,
        email: regEmail,
        password: regPassword,
        phoneNumber: regPhone,
        role: 'DRIVER'
      });

      // Step 2: Create driver entry linked to the new registration
      await driverApi.addDriver({
        registration: userResult,
        licenseNumber,
        vehicleName,
        vehicleType,
        experienceYears: parseInt(experienceYears) || 0,
        address,
        city,
        state,
        status: 'PENDING'
      });

      showToast('Driver profile registered! Waiting for admin approval.', 'success');
      handleViewChange('login');
    } catch (err) {
      showToast(err.message || 'Driver registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim() || !newPassword || !confirmNewPassword) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Find user by email to get user ID
      const allUsers = await userApi.allUsers();
      const userMatch = allUsers.find(
        (u) => u.email?.toLowerCase().trim() === resetEmail.toLowerCase().trim()
      );

      if (!userMatch) {
        throw new Error('No account found with this email address.');
      }

      // Step 2: Reset password
      await userApi.resetPassword(userMatch.id, newPassword);
      showToast('Password updated successfully! Please login.', 'success');
      handleViewChange('login');
    } catch (err) {
      showToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.7)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')`
      }}
    >
      <div
        className={`w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 animate-fade-in text-white transition-all duration-300 ${
          view === 'register-driver' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-500 text-white font-bold text-xl shadow-xl shadow-primary-550/35 mb-3">
            T
          </div>
          <h2 className="text-xl font-bold tracking-tight">Travel Management</h2>
          <p className="text-xs text-slate-200/80 mt-1 font-medium">
            {view === 'login' && 'Administrator Portal'}
            {view === 'register-customer' && 'Create Customer Account'}
            {view === 'register-driver' && 'Register as Partner Driver'}
            {view === 'forgot-password' && 'Password Reset Portal'}
          </p>
        </div>

        {/* 1. Login View */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                Email Address
              </label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl focus-within:border-primary-400 transition-all">
                <FiMail className="absolute left-4 w-5 h-5 text-slate-300" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@travel.com"
                  className="w-full bg-transparent border-none outline-none pl-12 pr-4 py-3 text-sm text-white placeholder-slate-300/60"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleViewChange('forgot-password')}
                  className="text-xs text-primary-300 hover:text-primary-200 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl focus-within:border-primary-400 transition-all">
                <FiLock className="absolute left-4 w-5 h-5 text-slate-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none outline-none pl-12 pr-12 py-3 text-sm text-white placeholder-slate-300/60"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-300 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center pt-3 border-t border-white/10 text-xs space-y-2 text-slate-200">
              <p>
                Not registered?{' '}
                <button
                  type="button"
                  onClick={() => handleViewChange('register-customer')}
                  className="text-primary-350 hover:underline font-bold"
                >
                  Register as Customer
                </button>
              </p>
              <p>
                Want to drive with us?{' '}
                <button
                  type="button"
                  onClick={() => handleViewChange('register-driver')}
                  className="text-primary-350 hover:underline font-bold"
                >
                  Register as Driver
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. Register Customer View */}
        {view === 'register-customer' && (
          <form onSubmit={handleRegisterCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">First Name</label>
                <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                  <FiUser className="absolute left-3.5 text-slate-300 w-4 h-4" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Last Name</label>
                <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                  <FiUser className="absolute left-3.5 text-slate-300 w-4 h-4" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Email Address</label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                <FiMail className="absolute left-3.5 text-slate-300 w-4 h-4" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="john.doe@gmail.com"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Phone Number</label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                <FiPhone className="absolute left-3.5 text-slate-300 w-4 h-4" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Password</label>
                <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                  <FiLock className="absolute left-3.5 text-slate-300 w-4 h-4" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Confirm Password</label>
                <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                  <FiLock className="absolute left-3.5 text-slate-300 w-4 h-4" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Register Customer'}
            </button>

            <div className="text-center pt-2 text-xs text-slate-200">
              <button
                type="button"
                onClick={() => handleViewChange('login')}
                className="hover:underline font-bold"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. Register Driver View */}
        {view === 'register-driver' && (
          <form onSubmit={handleRegisterDriverSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Account Information Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-300 border-b border-white/10 pb-1">
                  1. Account Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-200">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jane.smith@travel.com"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-200">Phone Number</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9123456789"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Driving & Vehicle Details Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-300 border-b border-white/10 pb-1">
                  2. Driver & Vehicle Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">License Number</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DL-AP-1234567"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Experience (Years)</label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="5"
                      min="0"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Vehicle Name</label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      placeholder="Toyota HiAce"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      {VEHICLE_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-slate-900 text-white">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-200">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Road"
                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Hyderabad"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-200">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Telangana"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-slate-300/60"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => handleViewChange('login')}
                className="text-xs text-slate-200 hover:text-white font-bold"
              >
                ← Back to Sign In
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting registration...' : 'Submit Driver Partner Application'}
              </button>
            </div>
          </form>
        )}

        {/* 4. Reset Password View */}
        {view === 'forgot-password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Email Address</label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                <FiMail className="absolute left-3.5 text-slate-300 w-4 h-4" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="jane.smith@travel.com"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">New Password</label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                <FiLock className="absolute left-3.5 text-slate-300 w-4 h-4" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Confirm New Password</label>
              <div className="relative flex items-center bg-white/10 border border-white/10 rounded-2xl">
                <FiLock className="absolute left-3.5 text-slate-300 w-4 h-4" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-xs text-white outline-none border-none placeholder-slate-300/60"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting password...' : 'Reset Password'}
            </button>

            <div className="text-center pt-2 text-xs text-slate-200">
              <button
                type="button"
                onClick={() => handleViewChange('login')}
                className="hover:underline font-bold"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
