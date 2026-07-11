import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FiGrid, FiUsers, FiTruck, FiPackage,
  FiCalendar, FiCreditCard, FiStar, FiLogOut,
  FiMenu, FiX, FiBell, FiChevronRight, FiZap,
  FiShield, FiBarChart2
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard',  path: '/admin/dashboard', icon: FiGrid,      color: '#6366f1' },
  { name: 'Users',      path: '/admin/users',     icon: FiUsers,     color: '#06b6d4' },
  { name: 'Drivers',    path: '/admin/drivers',   icon: FiTruck,     color: '#8b5cf6' },
  { name: 'Packages',   path: '/admin/packages',  icon: FiPackage,   color: '#10b981' },
  { name: 'Bookings',   path: '/admin/bookings',  icon: FiCalendar,  color: '#06b6d4' },
  { name: 'Payments',   path: '/admin/payments',  icon: FiCreditCard,color: '#10b981' },
  { name: 'Reviews',    path: '/admin/reviews',   icon: FiStar,      color: '#f59e0b' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'New booking #1024',        sub: 'Alice Green booked Goa Beach Tour', time: '5m',  unread: true,  icon: FiCalendar,  color: '#6366f1' },
  { id: 2, title: 'Driver status updated',    sub: 'Alex Mercer is now Active',          time: '18m', unread: true,  icon: FiTruck,     color: '#10b981' },
  { id: 3, title: 'Payment confirmed',        sub: '$1,250 received from Robert Hill',   time: '1h',  unread: false, icon: FiCreditCard,color: '#f59e0b' },
  { id: 4, title: 'New review submitted',     sub: '5★ review on Maldives Escapade',     time: '2h',  unread: false, icon: FiStar,      color: '#f43f5e' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsNotifOpen(false);
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const currentPage = menuItems.find(m => location.pathname.startsWith(m.path));
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const avatarLetter = user?.firstName?.[0] || user?.name?.[0] || 'A';
  const displayName = user
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Administrator'))
    : 'Administrator';
  const displayRole = user?.role || 'Super Admin';

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>

      {/* ================================================
          SIDEBAR
          ================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0d0d23 60%, #0a0a1a 100%)' }}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-5 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            {/* Animated logo icon */}
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <FiZap className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl animate-glow-pulse" />
            </div>
            <div>
              <p className="font-display font-bold text-base text-white leading-tight tracking-wide">
                Travel<span style={{ color: '#6366f1' }}>Admin</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-none">Management Portal</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {/* Label */}
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3">
            Main Navigation
          </p>

          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? {
                  background: `linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)`,
                  borderLeft: `3px solid ${item.color}`,
                } : { borderLeft: '3px solid transparent' }}
              >
                {/* Active glow bg */}
                {isActive && (
                  <div className="absolute inset-0 opacity-10 rounded-xl"
                    style={{ background: item.color }} />
                )}
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={isActive
                    ? { background: `${item.color}22`, color: item.color }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 font-semibold tracking-wide">{item.name}</span>
                {isActive && (
                  <FiChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: item.color }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* User mini card */}
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              {avatarLetter.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(244,63,94,0.08)' }}>
              <FiLogOut className="w-4 h-4" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ================================================
          MAIN CONTENT AREA
          ================================================ */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6"
          style={{
            background: 'rgba(248, 250, 252, 0.90)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          }}>

          {/* Left: Mobile toggle + breadcrumb */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <FiMenu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <FiBarChart2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Admin</span>
              </div>
              {currentPage && (
                <>
                  <FiChevronRight className="w-3 h-3 text-slate-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentPage.color }} />
                    <span className="text-xs font-bold text-slate-700">{currentPage.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: clock + notifications + profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Live clock */}
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-bold text-slate-700 leading-tight">{formatTime(currentTime)}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">{formatDate(currentTime)}</p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-slate-200" />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setIsNotifOpen(v => !v); setIsProfileOpen(false); }}
                className={`relative p-2 rounded-xl transition-all ${
                  isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse"
                    style={{ background: '#f43f5e' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50"
                  style={{ border: '1px solid rgba(226,232,240,0.8)', background: '#fff' }}>
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8faff, #f1f5f9)' }}>
                    <div>
                      <p className="font-bold text-sm text-slate-800">Notifications</p>
                      <p className="text-[10px] text-slate-400">{unreadCount} unread</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full font-bold text-white"
                      style={{ background: '#6366f1' }}>
                      {unreadCount} New
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map(n => {
                      const NIcon = n.icon;
                      return (
                        <div key={n.id}
                          className={`px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start cursor-pointer ${
                            n.unread ? 'bg-indigo-50/40' : ''
                          }`}
                          style={{ borderBottom: '1px solid #f8fafc' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${n.color}18`, color: n.color }}>
                            <NIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                              {n.unread && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: n.color }} />}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.sub}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time} ago</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <button className="text-xs font-bold transition-colors" style={{ color: '#6366f1' }}
                      onClick={() => setIsNotifOpen(false)}>
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setIsProfileOpen(v => !v); setIsNotifOpen(false); }}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all ${
                  isProfileOpen ? 'bg-indigo-50' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                  {avatarLetter.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">{displayRole}</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50"
                  style={{ border: '1px solid #e2e8f0', background: '#fff' }}>
                  {/* Profile header */}
                  <div className="px-4 py-4"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-indigo-700"
                        style={{ background: 'rgba(255,255,255,0.95)' }}>
                        {avatarLetter.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{displayName}</p>
                        <p className="text-[10px] text-indigo-200">{user?.email || 'admin@travel.com'}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <FiShield className="w-3 h-3 text-indigo-300" />
                      <span className="text-[10px] text-indigo-200 font-medium">{displayRole}</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { setIsProfileOpen(false); navigate('/admin/dashboard'); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <FiGrid className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-xl transition-colors"
                      style={{ color: '#f43f5e' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
      )}
    </div>
  );
};

export default AdminLayout;
