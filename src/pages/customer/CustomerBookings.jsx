import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../services/bookingApi';
import Spinner from '../../components/Spinner';
import {
  FiCalendar, FiUser, FiTruck, FiDollarSign, FiClock,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw,
  FiSlash
} from 'react-icons/fi';

const CustomerBookings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      const data = await bookingApi.getCustomerBookings(user.id);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast('Could not load booking records from API.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    try {
      await bookingApi.updateStatus(id, 'CANCELLED');
      showToast('Booking cancelled successfully.', 'success');
      loadBookings(true);
    } catch (err) {
      showToast(err.message || 'Failed to cancel booking.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const styles = {
      CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-250',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-250',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-250',
    };
    const icons = {
      CONFIRMED: FiCheckCircle,
      PENDING:   FiClock,
      CANCELLED: FiXCircle,
    };
    const Icon = icons[s] || FiAlertCircle;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[s] || styles.PENDING}`}>
        <Icon className="w-3.5 h-3.5" />
        {s}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display">My Bookings</h1>
          <p className="text-xs text-slate-450">Review, track, and manage your booked travel packages</p>
        </div>
        <button
          onClick={() => loadBookings(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-350">
            <FiCalendar className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-bold text-base">No Bookings Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">You haven't scheduled any tours yet. Click 'Browse Packages' in the sidebar to schedule your first adventure!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map(booking => {
            const pkg = booking.aPackage || {};
            const driver = booking.driver || null;
            const isCancelable = booking.bookingStatus?.toUpperCase() === 'PENDING';
            
            return (
              <div key={booking.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                
                {/* Package & details info */}
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-450 bg-slate-50 border px-2.5 py-1 rounded-lg">
                      Booking #{booking.id}
                    </span>
                    {getStatusBadge(booking.bookingStatus)}
                  </div>

                  <div>
                    <h3 className="font-display font-black text-slate-800 text-lg leading-tight">
                      {pkg.title || 'Custom Tour Package'}
                    </h3>
                    <p className="text-xs text-slate-450 mt-1 flex items-center gap-1.5">
                      <FiCalendar className="text-cyan-500 w-3.5 h-3.5" />
                      Travel Date: <span className="font-bold text-slate-700">{booking.travelDate || 'N/A'}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-550 pt-2">
                    <span className="flex items-center gap-1.5">
                      <FiUser className="text-slate-400" />
                      Travellers: <span className="font-bold text-slate-800">{booking.numberOfPersons} persons</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiDollarSign className="text-slate-400" />
                      Total Price: <span className="font-bold text-slate-800">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </span>
                    {driver && (
                      <span className="flex items-center gap-1.5">
                        <FiTruck className="text-slate-400" />
                        Driver: <span className="font-bold text-indigo-650">{driver.driverName || driver.name || 'Assigned'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0 items-center justify-end">
                  {isCancelable && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FiSlash className="w-3.5 h-3.5" />
                      Cancel Booking
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default CustomerBookings;
