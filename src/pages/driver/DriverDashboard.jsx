import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driverApi } from '../../services/driverApi';
import { userApi } from '../../services/userApi';
import { packageApi } from '../../services/packageApi';
import { bookingApi } from '../../services/bookingApi';
import { reviewApi } from '../../services/reviewApi';
import { paymentApi } from '../../services/paymentApi';
import Spinner from '../../components/Spinner';
import {
  FiTruck, FiUser, FiShield, FiStar, FiMapPin,
  FiEdit, FiCheck, FiX, FiClock, FiAlertTriangle,
  FiCheckCircle, FiDollarSign, FiGrid, FiLock, FiActivity,
  FiAward, FiMap, FiMail, FiPhone
} from 'react-icons/fi';

const VEHICLE_TYPES = ['Van', 'Mini Bus', 'Bus', 'Luxury Van', 'SUV', 'Sedan', 'Tempo Traveller'];

const DriverDashboard = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingDriver, setEditingDriver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Driver details fields
  const [licenseNo, setLicenseNo] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('Van');
  const [expYears, setExpYears] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Password reset fields
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');

  // Stats
  const [stats, setStats] = useState({
    packages: 0,
    bookings: 0,
    earnings: 0,
    reviews: 0,
    payments: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch user profile using correct endpoint: /registration/user/{id}
      const uData = await userApi.getUser(user.id);
      setFirstName(uData.firstName || '');
      setLastName(uData.lastName || '');
      setPhone(uData.phoneNumber || '');
      setEmail(uData.email || '');

      // Fetch all drivers then find driver record matching this user's registration ID
      const drivers = await driverApi.allDrivers().catch(() => []);
      const matchedDriverBasic = Array.isArray(drivers)
        ? drivers.find(d => d.registration?.id === user.id || String(d.registration?.id) === String(user.id))
        : null;

      if (matchedDriverBasic) {
        // Fetch full driver details using /Driver/details/{id}
        let fullDriver = matchedDriverBasic;
        try {
          fullDriver = await driverApi.getDriver(matchedDriverBasic.id);
        } catch {
          fullDriver = matchedDriverBasic;
        }

        setDriver(fullDriver);
        setLicenseNo(fullDriver.licenseNumber || '');
        setVehicleName(fullDriver.vehicleName || '');
        setVehicleType(fullDriver.vehicleType || 'Van');
        setExpYears(fullDriver.experienceYears || '');
        setAddress(fullDriver.address || '');
        setCity(fullDriver.city || '');
        setState(fullDriver.state || '');

        const [pkgsData, bksData, revsData, payData] = await Promise.all([
          packageApi.allPackages().catch(() => []),
          bookingApi.allBookings().catch(() => []),
          reviewApi.allReviews().catch(() => []),
          paymentApi.allPayments().catch(() => [])
        ]);

        const driverPkgs = pkgsData.filter(p =>
          String(p.driverId) === String(fullDriver.id) || p.driver?.id === fullDriver.id
        );
        const driverPkgIds = driverPkgs.map(p => p.id);

        const driverBookings = bksData.filter(b =>
          b.driver?.id === fullDriver.id ||
          driverPkgIds.includes(b.aPackage?.id)
        );

        const driverBookingIds = driverBookings.map(b => b.id);

        const driverPayments = (Array.isArray(payData) ? payData : []).filter(p =>
          driverBookingIds.includes(p.booking?.id)
        );

        // Reviews on driver's packages
        const driverReviews = (Array.isArray(revsData) ? revsData : []).filter(r =>
          driverPkgIds.map(String).includes(String(r.packageId)) ||
          driverPkgIds.map(String).includes(String(r.aPackage?.id))
        );

        const earnings = driverBookings
          .filter(b => b.bookingStatus?.toUpperCase() === 'CONFIRMED')
          .reduce((sum, curr) => sum + (parseFloat(curr.totalAmount) || 0), 0);

        setStats({
          packages: driverPkgs.length,
          bookings: driverBookings.length,
          payments: driverPayments.length,
          reviews: driverReviews.length,
          earnings
        });
      } else {
        setDriver({ status: 'PENDING', isMock: true });
      }

    } catch (err) {
      console.error(err);
      showToast('Error loading profile details.', 'warning');
      setDriver({ status: 'PENDING', isMock: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    } else {
      // No authenticated user — show empty state
      setLoading(false);
      setDriver({ status: 'PENDING', isMock: true });
    }
  }, [user]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!user) { showToast('Please login to update your profile.', 'warning'); return; }
    setSubmitting(true);
    try {
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        phoneNumber: phone,
        email
      };
      const response = await userApi.updateUser(user.id, updatedUser);
      setUser({ ...user, ...response });
      showToast('Account details updated!', 'success');
      setEditingAccount(false);
    } catch (err) {
      showToast(err.message || 'Failed to update account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    if (!user) { showToast('Please login to update driver details.', 'warning'); return; }
    if (!licenseNo || !vehicleName || !expYears || !address || !city || !state) {
      showToast('All fleet fields are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      if (driver.isMock) {
        const payload = {
          registration: { id: user.id },
          licenseNumber: licenseNo,
          vehicleName,
          vehicleType,
          experienceYears: parseInt(expYears) || 0,
          address,
          city,
          state,
          status: 'PENDING'
        };
        const response = await driverApi.addDriver(payload);
        setDriver(response);
        showToast('Driver profile created and submitted!', 'success');
      } else {
        const payload = {
          ...driver,
          licenseNumber: licenseNo,
          vehicleName,
          vehicleType,
          experienceYears: parseInt(expYears) || 0,
          address,
          city,
          state
        };
        const response = await driverApi.updateDriver(driver.id, payload);
        setDriver(response);
        showToast('Driver and vehicle profile updated!', 'success');
      }
      setEditingDriver(false);
    } catch (err) {
      showToast(err.message || 'Failed to update driver details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!user) { showToast('Please login to reset your password.', 'warning'); return; }
    if (newPwd !== confirmNewPwd) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await userApi.resetPassword(user.id, newPwd);
      showToast('Password updated successfully!', 'success');
      setShowPwdModal(false);
      setNewPwd('');
      setConfirmNewPwd('');
    } catch (err) {
      showToast(err.message || 'Password update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  const driverStatus = (driver?.status || 'PENDING').toUpperCase();
  const avatarLetter = firstName?.[0] || user?.firstName?.[0] || 'D';
  const fullName = `${firstName} ${lastName}`.trim() || user?.name || (user ? 'Driver Partner' : 'Guest Driver');

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* Guest Login Banner — shown when not authenticated */}
      {!user && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl text-white"
          style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 60%, #4c1d95 100%)', boxShadow: '0 4px 24px rgba(124,58,237,0.25)' }}>
          <div className="flex items-center gap-3">
            <FiShield className="w-5 h-5 text-purple-200 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold leading-tight">You are browsing as a Guest</p>
              <p className="text-[11px] text-purple-200 font-medium leading-tight mt-0.5">Login or register to view your profile, manage fleet details, and access payments.</p>
            </div>
          </div>
          <a href="/login" className="flex-shrink-0 px-4 py-2 bg-white text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-50 transition-colors shadow-sm">
            Login / Register
          </a>
        </div>
      )}
      
      {/* Visual Identity Header Card */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0f0b24 0%, #1e1136 50%, #4c1d95 100%)' }}>
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        
        <div className="relative z-10 px-6 py-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            
            {/* Driver Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-display font-black text-3xl text-slate-900 bg-white shadow-2xl relative z-10">
                {avatarLetter.toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-400 opacity-35 animate-ping z-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide leading-none">{fullName}</h1>
                
                {/* Status Badges */}
                {driverStatus === 'APPROVED' || driverStatus === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <FiCheckCircle className="w-3 h-3" /> Active Partner
                  </span>
                ) : driverStatus === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-450 border border-rose-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    <FiAlertTriangle className="w-3 h-3" /> Disapproved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-450 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                    <FiClock className="w-3 h-3" /> Under Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-350 flex items-center justify-center sm:justify-start gap-1">
                <FiMail className="w-3.5 h-3.5 text-purple-300" /> {email}
              </p>
              <p className="text-xs text-slate-350 flex items-center justify-center sm:justify-start gap-1">
                <FiPhone className="w-3.5 h-3.5 text-cyan-300" /> {phone || 'No phone added'}
              </p>
            </div>

          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-wrap">
            <span className="text-[10px] text-purple-200 font-bold uppercase tracking-widest leading-none">Total Earnings</span>
            <span className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 leading-none">
              ₹{stats.earnings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Driver Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Counters and Driver Details Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Stats Activity */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-805 text-sm flex items-center gap-2 border-b pb-3">
              <FiActivity className="text-purple-500" />
              Hosting Summary
            </h3>
            <div className="space-y-3.5">
              {[
                { label: 'Tours Configured',  val: stats.packages,  icon: FiGrid,     bg: '#8b5cf6' },
                { label: 'Bookings Received', val: stats.bookings,  icon: FiTruck,    bg: '#06b6d4' },
                { label: 'Payments Received', val: stats.payments,  icon: FiActivity, bg: '#10b981' },
                { label: 'Customer Reviews',  val: stats.reviews,   icon: FiStar,     bg: '#f59e0b' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 border rounded-2xl transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: item.bg }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-655">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-850">{item.val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Fleet Details Display */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-805 text-sm flex items-center gap-2 border-b pb-3">
              <FiTruck className="text-emerald-500" />
              Fleet Identity
            </h3>
            <div className="text-xs space-y-2.5 text-slate-600 font-medium">
              <p className="flex justify-between border-b pb-1.5"><span>Vehicle:</span> <span className="font-bold text-slate-800">{vehicleName || 'N/A'}</span></p>
              <p className="flex justify-between border-b pb-1.5"><span>Category:</span> <span className="font-bold text-slate-800">{vehicleType || 'N/A'}</span></p>
              <p className="flex justify-between border-b pb-1.5"><span>License plate:</span> <span className="font-bold text-slate-800">{licenseNo || 'N/A'}</span></p>
              <p className="flex justify-between border-b pb-1.5"><span>Experience:</span> <span className="font-bold text-slate-800">{expYears ? `${expYears} Years` : 'N/A'}</span></p>
              <p className="flex justify-between flex-wrap gap-1"><span>Address:</span> <span className="font-bold text-slate-800 text-right">{address}, {city}, {state}</span></p>
            </div>
          </div>

        </div>

        {/* Right Side: Editors */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Editor Account Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                <FiUser className="text-purple-550" />
                Account Settings
              </h2>
              {!editingAccount ? (
                <button onClick={() => setEditingAccount(true)} className="text-xs font-bold text-purple-650 flex items-center gap-1 hover:text-purple-800">
                  <FiEdit className="w-3.5 h-3.5" /> Edit details
                </button>
              ) : (
                <button onClick={() => { setEditingAccount(false); loadData(); }} className="text-xs font-bold text-slate-400">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={!editingAccount || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={!editingAccount || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editingAccount || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={!editingAccount || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              {editingAccount && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/15"
                >
                  <FiCheck /> Save Account details
                </button>
              )}
            </form>
          </div>

          {/* Editor Driver / Fleet Settings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                <FiTruck className="text-emerald-500" />
                Partner Fleet Registry
              </h2>
              {!editingDriver ? (
                <button onClick={() => setEditingDriver(true)} className="text-xs font-bold text-emerald-650 flex items-center gap-1 hover:text-emerald-800">
                  <FiEdit className="w-3.5 h-3.5" /> Edit details
                </button>
              ) : (
                <button onClick={() => { setEditingDriver(false); loadData(); }} className="text-xs font-bold text-slate-400">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateDriver} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">License Plate Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNo}
                    onChange={e => setLicenseNo(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                    placeholder="DL-AP-1234"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={expYears}
                    onChange={e => setExpYears(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Vehicle Name & Model</label>
                  <input
                    type="text"
                    required
                    value={vehicleName}
                    onChange={e => setVehicleName(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                    placeholder="Toyota HiAce"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase">Vehicle Classification</label>
                  <select
                    value={vehicleType}
                    onChange={e => setVehicleType(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none cursor-pointer disabled:bg-slate-50"
                  >
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={!editingDriver || submitting}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    disabled={!editingDriver || submitting}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              {editingDriver && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/15"
                >
                  <FiCheck /> Save Fleet Details
                </button>
              )}
            </form>
          </div>

          {/* Change password action card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
                <FiLock className="text-purple-600" /> Account Security
              </h4>
              <p className="text-[11px] text-slate-450 mt-0.5">Change password or update access settings to keep driver logs secure.</p>
            </div>
            <button
              onClick={() => setShowPwdModal(true)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650 transition-colors flex-shrink-0"
            >
              Reset Account Password
            </button>
          </div>

        </div>

      </div>

      {/* Modal: Change Password */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-pop">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-650">Security Access</span>
                <h3 className="font-display font-black text-lg text-slate-850">Reset Password</h3>
              </div>
              <button onClick={() => setShowPwdModal(false)} className="text-slate-400 hover:text-slate-655">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-450">New Password</label>
                <input
                  type="password"
                  required
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-purple-505"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-450">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPwd}
                  onChange={e => setConfirmNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-purple-505"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm transition-all"
              >
                {submitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverDashboard;
