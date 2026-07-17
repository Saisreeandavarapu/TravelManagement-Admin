import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driverApi } from '../../services/driverApi';
import { bookingApi } from '../../services/bookingApi';
import { paymentApi } from '../../services/paymentApi';
import Spinner from '../../components/Spinner';
import {
  FiCreditCard, FiCalendar, FiDollarSign, FiClock,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiUser
} from 'react-icons/fi';

const DriverPayments = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      // 1. Resolve Driver ID
      const drivers = await driverApi.allDrivers().catch(() => []);
      const matched = drivers.find(d => d.registration?.id === user.id);
      
      if (matched) {
        // 2. Fetch all bookings and payments
        const [allBkData, allPayData] = await Promise.all([
          bookingApi.allBookings().catch(() => []),
          paymentApi.allPayments().catch(() => [])
        ]);

        const bookings = Array.isArray(allBkData) ? allBkData : [];
        const paymentList = Array.isArray(allPayData) ? allPayData : [];

        // 3. Find booking IDs assigned to this driver
        // Matches if driver field on booking is this driver, OR if booking package driver matches
        const driverBookingIds = bookings
          .filter(b => b.driver?.id === matched.id || b.aPackage?.driverId === matched.id)
          .map(b => b.id);

        // Filter payments matching those bookings
        const driverPayments = paymentList.filter(p => driverBookingIds.includes(p.booking?.id));
        setPayments(driverPayments);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not fetch received payments.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPayments();
    }
  }, [user]);

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const styles = {
      CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
      FAILED:    'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[s] || styles.PENDING}`}>
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
          <h1 className="text-2xl font-black text-slate-800 font-display">Payment Receives</h1>
          <p className="text-xs text-slate-455">Monitor tour payments and earnings received for your routes</p>
        </div>
        <button
          onClick={() => loadPayments(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Payments', val: payments.length, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Confirmed', val: payments.filter(p => ['CONFIRMED','APPROVED'].includes((p.paymentStatus||'').toUpperCase())).length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Total Received', val: `₹${payments.filter(p => ['CONFIRMED','APPROVED'].includes((p.paymentStatus||'').toUpperCase())).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN')}`, color: '#7c3aed', bg: '#f5f3ff' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <FiCreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-700 font-bold">No Payments Received</p>
          <p className="text-xs text-slate-400">Transactions will be listed once customers book and pay for your packages.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-450 border-b border-slate-100">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Booking Ref</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {payments.map(p => {
                  const client = p.booking?.registration 
                    ? `${p.booking.registration.firstName} ${p.booking.registration.lastName}`
                    : 'Traveller Client';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-500">
                        {p.transactionId || `TXN-${p.id}`}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        #{p.booking?.id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center text-[9px] font-black uppercase">
                          {client[0]}
                        </div>
                        {client}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-550">
                        {p.paymentMethod || 'CARD'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(p.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverPayments;
