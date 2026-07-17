import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FiGrid, FiPlusSquare, FiCreditCard, FiStar,
  FiLogOut, FiMenu, FiX, FiBell, FiChevronRight,
  FiTruck, FiUser, FiBarChart2, FiCalendar
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard & Profile', path: '/driver/dashboard',    icon: FiGrid,       color: '#8b5cf6' },
  { name: 'My Packages',         path: '/driver/packages-add', icon: FiPlusSquare,  color: '#10b981' },
  { name: 'Bookings',            path: '/driver/bookings',     icon: FiCalendar,    color: '#f59e0b' },
  { name: 'Payment Receives',    path: '/driver/payments',     icon: FiCreditCard,  color: '#06b6d4' },
  { name: 'Reviews',             path: '/driver/reviews',      icon: FiStar,        color: '#f43f5e' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'New Package Status', sub: 'Your Goa Beach Tour has been approved by admin.', time: '1h', unread: true, icon: FiPlusSquare, color: '#10b981' },
];

const DriverLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

  const avatarLetter = user?.firstName?.[0] || user?.name?.[0] || 'D';
  const displayName = user
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Partner Driver'))
    : 'Guest Driver';
  const displayRole = user ? 'Partner Driver' : 'Browse Only';

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)' }}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-5 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/driver/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
              <FiTruck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-base text-white leading-tight tracking-wide">
                Driver<span style={{ color: '#a78bfa' }}>Portal</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Partner Center</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-3">
            Driver Services
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  isActive ? 'text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? {
                  background: `linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)`,
                  borderLeft: `3px solid ${item.color}`,
                } : { borderLeft: '3px solid transparent' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={isActive
                    ? { background: `${item.color}22`, color: item.color }
                    : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1 tracking-wide">{item.name}</span>
                {isActive && (
                  <FiChevronRight className="w-3.5 h-3.5 opacity-65" style={{ color: item.color }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}>
              {avatarLetter.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{displayRole}</p>
            </div>
          </div>
          {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-950/20 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.08)' }}>
              <FiLogOut className="w-4 h-4" />
            </div>
            Sign Out
          </button>
          )}
          {!user && (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-purple-400 hover:bg-purple-950/20 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
              <FiLogOut className="w-4 h-4" />
            </div>
            Login / Register
          </button>
          )}
        </div>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-white/85 backdrop-blur-md border-b border-slate-100">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <FiTruck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Driver</span>
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

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-bold text-slate-700 leading-tight">{formatTime(currentTime)}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-none">{formatDate(currentTime)}</p>
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200" />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setIsNotifOpen(v => !v); setIsProfileOpen(false); }}
                className={`relative p-2 rounded-xl transition-all ${
                  isNotifOpen ? 'bg-purple-50 text-purple-650' : 'text-slate-500 hover:bg-slate-55'
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

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl overflow-hidden border border-slate-100 bg-white z-50">
                  <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                    <div>
                      <p className="font-bold text-sm text-slate-800">Notifications</p>
                      <p className="text-[10px] text-slate-400">{unreadCount} unread</p>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map(n => {
                      const NIcon = n.icon;
                      return (
                        <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start border-b border-slate-50">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${n.color}15`, color: n.color }}>
                            <NIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{n.sub}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{n.time} ago</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setIsProfileOpen(v => !v); setIsNotifOpen(false); }}
                className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-all ${
                  isProfileOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 2px 8px rgba(139,92,246,0.3)' }}>
                  {avatarLetter.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{displayName}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">Partner</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl overflow-hidden border border-slate-100 bg-white z-50">
                  <div className="px-4 py-4 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    <p className="font-bold text-sm">{displayName}</p>
                    <p className="text-[10px] text-purple-100">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { setIsProfileOpen(false); navigate('/driver/dashboard'); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" />
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
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

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/60 backdrop-blur-sm"
        />
      )}
    </div>
  );
};

export default DriverLayout;
