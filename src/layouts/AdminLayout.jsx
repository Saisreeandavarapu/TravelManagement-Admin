import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FiGrid,
  FiUsers,
  FiTruck,
  FiPackage,
  FiImage,
  FiCalendar,
  FiCreditCard,
  FiStar,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiSearch,
  FiUser
} from 'react-icons/fi';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [notifications] = useState([
    { id: 1, text: 'New booking reservation #1024 received', time: '5m ago', read: false },
    { id: 2, text: 'Driver Alex updated status to Active', time: '20m ago', read: false },
    { id: 3, text: 'Payment confirm of $1,250 received', time: '1h ago', read: true },
    { id: 4, text: 'Review added for Package "Goa Tour"', time: '2h ago', read: true }
  ]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FiGrid },
    { name: 'Users', path: '/admin/users', icon: FiUsers },
    { name: 'Drivers', path: '/admin/drivers', icon: FiTruck },
    { name: 'Packages', path: '/admin/packages', icon: FiPackage },
    { name: 'Images', path: '/admin/images', icon: FiImage },
    { name: 'Bookings', path: '/admin/bookings', icon: FiCalendar },
    { name: 'Payments', path: '/admin/payments', icon: FiCreditCard },
    { name: 'Reviews', path: '/admin/reviews', icon: FiStar },
  ];

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 border-r border-slate-800 transform lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo & Close Button (Mobile only) */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
                T
              </span>
              <span className="font-semibold text-lg tracking-wider text-white font-sans">
                TRAVEL<span className="text-primary-400 font-bold">ADMIN</span>
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="mt-6 px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/15'
                      : 'hover:bg-slate-900/60 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Logout Button) */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-450 hover:bg-rose-950/20 hover:text-rose-400 transition-colors duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          {/* Left: Mobile Sidebar Toggle & Search */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            {/* Decorative Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 w-72 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
              <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search dashboard..."
                className="bg-transparent border-none outline-none text-sm w-full text-slate-750 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                className={`p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all ${
                  isNotificationsOpen ? 'bg-slate-100 text-slate-800' : ''
                }`}
              >
                <div className="relative">
                  <FiBell className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    2
                  </span>
                </div>
              </button>

              {/* Notification Dropdown Panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Notifications</span>
                    <button className="text-xs text-primary-500 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-slate-50 transition-colors flex gap-2.5 border-b border-slate-50 last:border-0 ${
                          !notif.read ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!notif.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{notif.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm border border-primary-200">
                  {user?.name ? user.name[0].toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-450 leading-tight font-medium">
                    {user?.role || 'Super Admin'}
                  </p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{user?.name || 'Admin Account'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@travelwebsite.com'}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/admin/dashboard');
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-650 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" />
                      Dashboard Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4 text-rose-450" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}
    </div>
  );
};

export default AdminLayout;
