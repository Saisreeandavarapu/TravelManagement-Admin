import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userApi } from '../../services/userApi';
import { bookingApi } from '../../services/bookingApi';
import { reviewApi } from '../../services/reviewApi';
import { paymentApi } from '../../services/paymentApi';
import Spinner from '../../components/Spinner';
import {
  FiUser, FiPhone, FiMail, FiLock, FiCalendar,
  FiCreditCard, FiStar, FiEdit, FiCheck, FiX,
  FiShield, FiMapPin, FiActivity, FiArrowRight
} from 'react-icons/fi';

const CustomerDashboard = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Password states
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');

  // Stats
  const [stats, setStats] = useState({
    bookings: 0,
    payments: 0,
    reviews: 0,
    totalSpent: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const uData = await userApi.getUser(user.id);
      setProfile(uData);
      setFirstName(uData.firstName || '');
      setLastName(uData.lastName || '');
      setPhone(uData.phoneNumber || '');
      setEmail(uData.email || '');

      const bookings = await bookingApi.getCustomerBookings(user.id).catch(() => []);
      const reviews = await reviewApi.allReviews().catch(() => []);
      const payments = await paymentApi.allPayments().catch(() => []);

      const userReviews = reviews.filter(r => r.customerName === `${uData.firstName} ${uData.lastName}`);
      const bookingIds = bookings.map(b => b.id);
      const userPayments = payments.filter(p => bookingIds.includes(p.booking?.id));
      
      const totalSpent = userPayments
        .filter(p => p.paymentStatus?.toUpperCase() === 'CONFIRMED' || p.paymentStatus?.toUpperCase() === 'APPROVED')
        .reduce((sum, curr) => sum + (parseFloat(curr.amount) || 0), 0);

      setStats({
        bookings: bookings.length,
        payments: userPayments.length,
        reviews: userReviews.length,
        totalSpent
      });
    } catch (err) {
      console.error(err);
      showToast('Could not load profile. Using local session.', 'warning');
      setProfile(user);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phoneNumber || '');
      setEmail(user.email || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !email) {
      showToast('All fields are required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const updatedData = {
        ...profile,
        firstName,
        lastName,
        phoneNumber: phone,
        email,
      };
      const response = await userApi.updateUser(user.id, updatedData);
      setProfile(response);
      
      const newUserObj = { ...user, ...response };
      setUser(newUserObj);
      
      showToast('Profile updated successfully!', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPwd || !confirmNewPwd) {
      showToast('Please fill all fields', 'warning');
      return;
    }
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

  const avatarLetter = profile?.firstName?.[0] || user?.firstName?.[0] || 'T';
  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || user?.name || 'Traveller';

  return (
    <div className="space-y-8 animate-fade-up">
      
      {/* Visual Identity Header Card */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #09090e 0%, #1e1b4b 50%, #312e81 100%)' }}>
        {/* Abstract decorative glowing blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        
        <div className="relative z-10 px-6 py-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar block with pulsing outer ring */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-display font-black text-3xl text-slate-900 bg-white shadow-2xl relative z-10">
                {avatarLetter.toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-30 animate-ping z-0" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide leading-none">{fullName}</h1>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <FiShield className="w-3 h-3" /> Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-350 flex items-center justify-center sm:justify-start gap-1">
                <FiMail className="w-3.5 h-3.5 text-cyan-450" /> {profile?.email}
              </p>
              <p className="text-xs text-slate-355 flex items-center justify-center sm:justify-start gap-1">
                <FiPhone className="w-3.5 h-3.5 text-indigo-400" /> {profile?.phoneNumber || 'No phone added'}
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Total Expenditure</span>
            <span className="text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 leading-none">
              ₹{stats.totalSpent.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column Summary, Right Column Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Security Actions */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card: Travel Stats */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
              <FiActivity className="text-cyan-500" />
              Traveller Activity
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Tours Booked', val: stats.bookings, color: '#8b5cf6', icon: FiCalendar },
                { label: 'Payments Completed', val: stats.payments, color: '#10b981', icon: FiCreditCard },
                { label: 'Reviews Contributed', val: stats.reviews, color: '#f59e0b', icon: FiStar },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors p-3 rounded-2xl border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: item.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-650">{item.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">{item.val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Security */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
              <FiLock className="text-indigo-500" />
              Security Settings
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Keep your travel security up to date. We recommend changing your passwords periodically to ensure account protection.
            </p>
            <button
              onClick={() => setShowPwdModal(true)}
              className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-650 hover:bg-indigo-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <FiLock className="w-3.5 h-3.5" /> Change Password
            </button>
          </div>

        </div>

        {/* Right Column: Edit Profile Details */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
              <FiUser className="text-cyan-505" />
              Account Settings
            </h2>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                <FiEdit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setEditing(false); loadData(); }}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-650"
              >
                <FiX className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">First Name</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50/10">
                  <FiUser className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    disabled={!editing || submitting}
                    className="w-full text-sm pl-10 pr-4 py-2.5 outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Last Name</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50/10">
                  <FiUser className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    disabled={!editing || submitting}
                    className="w-full text-sm pl-10 pr-4 py-2.5 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Phone Number</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50/10">
                  <FiPhone className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={!editing || submitting}
                    className="w-full text-sm pl-10 pr-4 py-2.5 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50/10">
                  <FiMail className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!editing || submitting}
                    className="w-full text-sm pl-10 pr-4 py-2.5 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {editing && (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/15 transition-all active:scale-[0.98]"
              >
                <FiCheck className="w-3.5 h-3.5" /> Save Profile Details
              </button>
            )}
          </form>
        </div>

      </div>

      {/* Modal: Change Password */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-pop">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Account Security</span>
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
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-cyan-505"
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
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:border-cyan-505"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-bold text-sm transition-all"
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

export default CustomerDashboard;
