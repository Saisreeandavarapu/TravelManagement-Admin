import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driverApi } from '../../services/driverApi';
import { bookingApi } from '../../services/bookingApi';
import { packageApi } from '../../services/packageApi';
import Spinner from '../../components/Spinner';
import {
  FiCalendar, FiUser, FiTruck, FiClock,
  FiCheckCircle, FiXCircle, FiAlertCircle,
  FiRefreshCw, FiPackage, FiMapPin, FiUsers
} from 'react-icons/fi';

const DriverBookings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, revenue: 0 });

  const loadBookings = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      if (!user?.id) { setBookings([]); setLoading(false); setRefreshing(false); return; }

      const drivers = await driverApi.allDrivers().catch(() => []);
      const matched = Array.isArray(drivers)
        ? drivers.find(d => d.registration?.id === user.id || String(d.registration?.id) === String(user.id))
        : null;

      if (matched) {
        const pkgsData = await packageApi.allPackages().catch(() => []);
        const driverPkgIds = (Array.isArray(pkgsData) ? pkgsData : [])
          .filter(p => String(p.driverId) === String(matched.id) || p.driver?.id === matched.id)
          .map(p => p.id);

        const allBookings = await bookingApi.allBookings().catch(() => []);
        const driverBookings = (Array.isArray(allBookings) ? allBookings : []).filter(b =>
          b.driver?.id === matched.id || driverPkgIds.includes(b.aPackage?.id)
        );

        driverBookings.sort((a, b) => b.id - a.id);
        setBookings(driverBookings);

        const confirmed = driverBookings.filter(b => b.bookingStatus?.toUpperCase() === 'CONFIRMED').length;
        const pending   = driverBookings.filter(b => b.bookingStatus?.toUpperCase() === 'PENDING').length;
        const cancelled = driverBookings.filter(b => b.bookingStatus?.toUpperCase() === 'CANCELLED').length;
        const revenue   = driverBookings
          .filter(b => b.bookingStatus?.toUpperCase() === 'CONFIRMED')
          .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);

        setStats({ total: driverBookings.length, confirmed, pending, cancelled, revenue });
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load bookings.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBookings(); }, [user]);

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const styles = {
      CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    const icons = { CONFIRMED: FiCheckCircle, PENDING: FiClock, CANCELLED: FiXCircle };
    const Icon = icons[s] || FiAlertCircle;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[s] || styles.PENDING}`}>
        <Icon className="w-3.5 h-3.5" />{s}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center items-center min-h-[400px]"><Spinner /></div>;

  const statCards = [
    { label: 'Total Bookings', val: stats.total,     color: '#8b5cf6', bg: '#f5f3ff', icon: FiPackage      },
    { label: 'Confirmed',      val: stats.confirmed,  color: '#10b981', bg: '#f0fdf4', icon: FiCheckCircle  },
    { label: 'Pending',        val: stats.pending,    color: '#f59e0b', bg: '#fffbeb', icon: FiClock        },
    { label: 'Cancelled',      val: stats.cancelled,  color: '#f43f5e', bg: '#fff1f2', icon: FiXCircle      },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display">Package Bookings</h1>
          <p className="text-xs text-slate-450 mt-0.5">All bookings received on your travel packages</p>
        </div>
        <button onClick={() => loadBookings(true)} disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-black text-slate-800">{s.val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Banner */}
      {stats.confirmed > 0 && (
        <div className="rounded-2xl p-5 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', boxShadow: '0 4px 20px rgba(124,58,237,0.2)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Confirmed Revenue</p>
            <p className="text-3xl font-black mt-0.5">₹{stats.revenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <FiTruck className="w-6 h-6 text-purple-200" />
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-350">
            <FiCalendar className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-bold text-base">No Bookings Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Bookings from customers on your packages will appear here once they start booking.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const pkg = booking.aPackage || {};
            const customer = booking.registration
              ? `${booking.registration.firstName || ''} ${booking.registration.lastName || ''}`.trim()
              : 'Customer';
            return (
              <div key={booking.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-450 bg-slate-50 border px-2.5 py-1 rounded-lg">Booking #{booking.id}</span>
                      {getStatusBadge(booking.bookingStatus)}
                    </div>
                    <h3 className="font-display font-black text-slate-800 text-base leading-tight truncate">{pkg.title || 'Tour Package'}</h3>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><FiUser className="text-purple-400 w-3.5 h-3.5" />{customer}</span>
                      <span className="flex items-center gap-1.5"><FiMapPin className="text-cyan-400 w-3.5 h-3.5" />{pkg.destination || 'N/A'}</span>
                      <span className="flex items-center gap-1.5"><FiCalendar className="text-emerald-400 w-3.5 h-3.5" />{booking.travelDate || 'N/A'}</span>
                      <span className="flex items-center gap-1.5"><FiUsers className="text-amber-400 w-3.5 h-3.5" />{booking.numberOfPersons || 1} person(s)</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-black text-slate-800">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverBookings;
