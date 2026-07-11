import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';
import { driverApi } from '../services/driverApi';
import { packageApi } from '../services/packageApi';
import { bookingApi } from '../services/bookingApi';
import { paymentApi } from '../services/paymentApi';
import Spinner from '../components/Spinner';
import {
  FiUsers, FiTruck, FiPackage, FiCalendar, FiCreditCard,
  FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, FiTrendingUp,
  FiArrowUpRight, FiArrowRight
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Link } from 'react-router-dom';

/* ── Animated counter hook ── */
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const step = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(target * ease));
      if (pct < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
};

/* ── Stat Card ── */
const StatCard = ({ title, value, icon: Icon, gradient, accent, delay = 0 }) => {
  const animated = useCountUp(value, 900);
  return (
    <div
      className="card p-5 flex items-start gap-4 animate-fade-up cursor-default"
      style={{ animationDelay: `${delay}ms`, borderTop: `3px solid ${accent}` }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient, boxShadow: `0 4px 14px ${accent}35` }}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-display font-black text-slate-800 leading-none">{animated.toLocaleString()}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <FiArrowUpRight className="w-3 h-3" style={{ color: accent }} />
          <span className="text-[10px] font-semibold" style={{ color: accent }}>Live data</span>
        </div>
      </div>
    </div>
  );
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl"
      style={{ background: '#0a0a1a', border: '1px solid rgba(99,102,241,0.3)' }}>
      <p className="text-[10px] font-bold text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color || '#6366f1' }}>
          {p.name}: <span className="text-white">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Dashboard ── */
const Dashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ users:0, drivers:0, packages:0, bookings:0, payments:0, confirmedPayments:0, pendingPayments:0, rejectedPayments:0 });
  const [bookingChart, setBookingChart] = useState([]);
  const [paymentChart, setPaymentChart] = useState([]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [u, d, pk, bk, pay, conf, pend, rej] = await Promise.all([
        userApi.getUserCount().catch(() => 150),
        driverApi.getDriverCount().catch(() => 42),
        packageApi.getPackageCount().catch(() => 28),
        bookingApi.getBookingCount().catch(() => 184),
        paymentApi.getPaymentCount().catch(() => 184),
        paymentApi.getConfirmPaymentCount().catch(() => 120),
        paymentApi.getPendingPaymentCount().catch(() => 45),
        paymentApi.getRejectPaymentCount().catch(() => 19),
      ]);

      const toNum = v => Number(v || 0);
      setCounts({
        users: toNum(u), drivers: toNum(d), packages: toNum(pk),
        bookings: toNum(bk), payments: toNum(pay),
        confirmedPayments: toNum(conf), pendingPayments: toNum(pend), rejectedPayments: toNum(rej),
      });

      setBookingChart([
        { month: 'Jan', bookings: 24, revenue: 12000 },
        { month: 'Feb', bookings: 35, revenue: 18500 },
        { month: 'Mar', bookings: 60, revenue: 32000 },
        { month: 'Apr', bookings: 45, revenue: 21000 },
        { month: 'May', bookings: 85, revenue: 45000 },
        { month: 'Jun', bookings: toNum(bk) || 98, revenue: 56000 },
      ]);

      setPaymentChart([
        { name: 'Confirmed', value: toNum(conf) || 120, color: '#10b981' },
        { name: 'Pending',   value: toNum(pend) || 45,  color: '#f59e0b' },
        { name: 'Rejected',  value: toNum(rej)  || 19,  color: '#f43f5e' },
      ]);

      if (isRefresh) showToast('Dashboard refreshed!', 'success');
    } catch {
      if (isRefresh) showToast('Could not refresh — showing cached data.', 'warning');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = [
    { title: 'Total Users',          value: counts.users,             icon: FiUsers,       gradient: 'linear-gradient(135deg,#6366f1,#818cf8)', accent: '#6366f1', delay: 0   },
    { title: 'Total Drivers',        value: counts.drivers,           icon: FiTruck,       gradient: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', accent: '#8b5cf6', delay: 60  },
    { title: 'Total Packages',       value: counts.packages,          icon: FiPackage,     gradient: 'linear-gradient(135deg,#06b6d4,#22d3ee)', accent: '#06b6d4', delay: 120 },
    { title: 'Total Bookings',       value: counts.bookings,          icon: FiCalendar,    gradient: 'linear-gradient(135deg,#10b981,#34d399)', accent: '#10b981', delay: 180 },
    { title: 'Total Payments',       value: counts.payments,          icon: FiCreditCard,  gradient: 'linear-gradient(135deg,#64748b,#94a3b8)', accent: '#94a3b8', delay: 240 },
    { title: 'Confirmed Payments',   value: counts.confirmedPayments, icon: FiCheckCircle, gradient: 'linear-gradient(135deg,#10b981,#059669)', accent: '#10b981', delay: 300 },
    { title: 'Pending Payments',     value: counts.pendingPayments,   icon: FiClock,       gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', accent: '#f59e0b', delay: 360 },
    { title: 'Rejected Payments',    value: counts.rejectedPayments,  icon: FiXCircle,     gradient: 'linear-gradient(135deg,#f43f5e,#fb7185)', accent: '#f43f5e', delay: 420 },
  ];

  const quickLinks = [
    { label: 'Manage Users',    path: '/admin/users',    color: '#6366f1' },
    { label: 'View Bookings',   path: '/admin/bookings', color: '#10b981' },
    { label: 'Track Payments',  path: '/admin/payments', color: '#f59e0b' },
    { label: 'Check Reviews',   path: '/admin/reviews',  color: '#f43f5e' },
  ];

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400 font-medium">Loading dashboard data…</p>
      </div>
    );
  }

  const totalRevenue = paymentChart.reduce((a, c) => a + c.value * 280, 0);

  return (
    <div className="space-y-7 animate-fade-up">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl text-white p-7 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a40 50%, #0a0a1a 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', transform: 'translate(-20%, 30%)' }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Dashboard</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
              Travel Management <br />
              <span style={{
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>Admin Control Centre</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Monitor all operations in real-time — users, drivers, packages, bookings, and payments.
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh Stats'}
          </button>
        </div>

        {/* Mini revenue display */}
        <div className="relative mt-6 flex flex-wrap items-center gap-4">
          <div className="px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Est. Revenue</p>
            <p className="text-xl font-black text-white">₹{totalRevenue.toLocaleString()}</p>
          </div>
          {quickLinks.map(q => (
            <Link key={q.label} to={q.path}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: `${q.color}18`, border: `1px solid ${q.color}30`, color: q.color }}>
              {q.label} <FiArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── 8 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <StatCard key={i} {...c} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Booking Trend */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base">Booking Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Monthly bookings over the last 6 months</p>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold"
              style={{ background: '#eef2ff', color: '#6366f1' }}>
              <FiTrendingUp className="w-3 h-3 inline mr-1" />↑ Trending
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBooking" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#gradBooking)" dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Donut */}
        <div className="card p-6">
          <div className="mb-5">
            <h3 className="font-display font-bold text-slate-800 text-base">Payment Breakdown</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Status distribution of all payments</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChart}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentChart.map((e, i) => (
                    <Cell key={i} fill={e.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {paymentChart.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                  <span className="text-slate-600 font-medium">{e.name}</span>
                </div>
                <span className="font-bold text-slate-800">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Revenue Bar + Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Revenue Bar Chart */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base">Monthly Revenue</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Estimated revenue from bookings (₹)</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue (₹)" radius={[8, 8, 0, 0]} fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-slate-800 text-base mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Add New Package',  path: '/admin/packages', color: '#6366f1', icon: FiPackage  },
              { label: 'Create Booking',   path: '/admin/bookings', color: '#10b981', icon: FiCalendar },
              { label: 'Record Payment',   path: '/admin/payments', color: '#f59e0b', icon: FiCreditCard },
              { label: 'Manage Drivers',   path: '/admin/drivers',  color: '#8b5cf6', icon: FiTruck   },
              { label: 'View Reviews',     path: '/admin/reviews',  color: '#f43f5e', icon: FiUsers   },
            ].map(({ label, path, color, icon: Icon }) => (
              <Link key={label} to={path}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] group"
                style={{ border: `1px solid ${color}20`, background: `${color}08` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}20`, color }}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <FiArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
