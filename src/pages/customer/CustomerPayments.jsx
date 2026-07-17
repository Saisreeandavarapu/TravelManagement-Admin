import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookingApi } from '../../services/bookingApi';
import { paymentApi } from '../../services/paymentApi';
import Spinner from '../../components/Spinner';
import {
  FiCreditCard, FiCalendar, FiDollarSign, FiPlus,
  FiCheckCircle, FiXCircle, FiClock, FiAlertCircle,
  FiZap, FiX, FiRefreshCw
} from 'react-icons/fi';

const CustomerPayments = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [payments, setPayments] = useState([]);
  const [unpaidBookings, setUnpaidBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pay modal state
  const [payBooking, setPayBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNo, setCardNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      const [allBkData, allPayData] = await Promise.all([
        bookingApi.getCustomerBookings(user.id).catch(() => []),
        paymentApi.allPayments().catch(() => [])
      ]);

      const bookings = Array.isArray(allBkData) ? allBkData : [];
      const paymentList = Array.isArray(allPayData) ? allPayData : [];
      
      const bookingIds = bookings.map(b => b.id);
      
      // Filter customer's payments
      const userPayments = paymentList.filter(p => bookingIds.includes(p.booking?.id));
      setPayments(userPayments);

      // Find bookings that do not have any CONFIRMED payments
      const paidBookingIds = paymentList
        .filter(p => p.paymentStatus?.toUpperCase() === 'CONFIRMED' || p.paymentStatus?.toUpperCase() === 'APPROVED')
        .map(p => p.booking?.id);

      const unpaid = bookings.filter(b => 
        !paidBookingIds.includes(b.id) && 
        b.bookingStatus?.toUpperCase() !== 'CANCELLED'
      );
      setUnpaidBookings(unpaid);

    } catch (err) {
      console.error(err);
      showToast('Could not load payment history.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleOpenPay = (booking) => {
    setPayBooking(booking);
    setPaymentMethod('CARD');
    setCardNo('');
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        booking: { id: payBooking.id },
        amount: payBooking.totalAmount,
        paymentMethod,
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        paymentStatus: 'CONFIRMED'
      };

      await paymentApi.addPayment(payload);
      
      try {
        await bookingApi.updateStatus(payBooking.id, 'CONFIRMED');
      } catch {
        // Safe fail
      }

      showToast('Payment successful!', 'success');
      setPayBooking(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Payment registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const styles = {
      CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-250',
      APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-250',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-250',
      FAILED:    'bg-rose-50 text-rose-700 border-rose-250',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[s] || styles.PENDING}`}>
        <span className={`w-1 h-1 rounded-full ${s === 'CONFIRMED' || s === 'APPROVED' ? 'bg-emerald-500' : s === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`} />
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
    <div className="space-y-8 animate-fade-up">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display">Payments Ledger</h1>
          <p className="text-xs text-slate-450">Review billing receipts and pay for outstanding scheduled bookings</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Unpaid / Pending Payments Alert Area */}
      {unpaidBookings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-800 font-display">Unpaid Travel Bookings Pending</h2>
              <p className="text-xs text-amber-700 mt-0.5">
                You have {unpaidBookings.length} booking(s) awaiting payments. Complete payments to ensure booking confirmation.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unpaidBookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl p-4 border border-amber-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs font-black text-slate-800 truncate max-w-[200px]">{b.aPackage?.title || 'Tour booking'}</p>
                  <p className="text-[10px] text-slate-400">Date: {b.travelDate} • Price: ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={() => handleOpenPay(b)}
                  className="px-3.5 py-1.5 bg-amber-550 hover:bg-amber-600 text-white rounded-xl text-[11px] font-black shadow-md shadow-amber-500/10 active:scale-[0.98]"
                >
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
          <FiCreditCard className="text-cyan-600" />
          Receipt History
        </h2>

        {payments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <FiCreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-bold">No Payment Receipts Found</p>
            <p className="text-xs text-slate-400">Your transaction history will be shown here once you make payments.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-450 border-b border-slate-100">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Booking Ref</th>
                    <th className="px-6 py-4">Tour Title</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors text-slate-750">
                      <td className="px-6 py-4 font-mono font-bold text-slate-600">
                        {p.transactionId || `TXN-${p.id}`}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        #{p.booking?.id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 truncate max-w-[200px]">
                        {p.booking?.aPackage?.title || 'Tour Booking'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-500">
                        {p.paymentMethod || 'CARD'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(p.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {payBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-pop">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Complete Purchase</span>
                <h3 className="font-display font-black text-lg text-slate-850">Pay for Booking #{payBooking.id}</h3>
              </div>
              <button onClick={() => setPayBooking(null)} className="text-slate-400 hover:text-slate-650">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-slate-700">{payBooking.aPackage?.title}</p>
                <p className="text-[11px] text-slate-450">Date: {payBooking.travelDate} • Persons: {payBooking.numberOfPersons}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full text-sm py-3 px-4 rounded-xl border border-slate-205 outline-none cursor-pointer"
                >
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CASH">Pay at Counter (Cash)</option>
                </select>
              </div>

              {paymentMethod === 'CARD' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Card Number</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <FiCreditCard className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={cardNo}
                      onChange={e => setCardNo(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="w-full text-sm pl-10 pr-4 py-3 outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-xl bg-slate-50 text-center space-y-2">
                  <FiZap className="w-6 h-6 text-indigo-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Enter UPI ID or scan QR</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-slate-800">
                <p className="text-xs font-bold text-slate-550">Billing Amount</p>
                <p className="text-2xl font-black text-slate-800">₹{Number(payBooking.totalAmount || 0).toLocaleString('en-IN')}</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
              >
                {submitting ? 'Authorizing...' : `Pay ₹${Number(payBooking.totalAmount || 0).toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPayments;
