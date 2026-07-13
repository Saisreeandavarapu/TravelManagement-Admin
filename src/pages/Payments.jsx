import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { paymentApi } from '../services/paymentApi';
import { bookingApi } from '../services/bookingApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiTrash2, FiCreditCard,
  FiDollarSign, FiFilter, FiCalendar, FiPlus, FiCheckCircle, FiClock, FiXCircle
} from 'react-icons/fi';

const MOCK_PAYMENTS = [
  { id: 'PAY-001', bookingId: '1001', customerName: 'Alice Green', amount: 449, method: 'CREDIT_CARD', transactionId: 'TXN-982312093', status: 'CONFIRMED', paymentDate: '2026-06-15' },
  { id: 'PAY-002', bookingId: '1002', customerName: 'Robert Hill', amount: 679, method: 'UPI', transactionId: 'TXN-112390841', status: 'PENDING', paymentDate: '2026-06-16' },
  { id: 'PAY-003', bookingId: '1003', customerName: 'Clara Oswald', amount: 1319, method: 'NET_BANKING', transactionId: 'TXN-874312095', status: 'CONFIRMED', paymentDate: '2026-06-14' },
  { id: 'PAY-004', bookingId: '1004', customerName: 'David Tennant', amount: 569, method: 'DEBIT_CARD', transactionId: 'TXN-451290876', status: 'REJECTED', paymentDate: '2026-06-12' },
  { id: 'PAY-005', bookingId: '1005', customerName: 'Sarah Smith', amount: 449, method: 'UPI', transactionId: 'TXN-672901234', status: 'PENDING', paymentDate: '2026-06-17' },
];

const MOCK_BOOKINGS = [
  { id: 1, customerName: 'Alice Green', totalAmount: 898 },
  { id: 2, customerName: 'Robert Hill', totalAmount: 2716 },
  { id: 3, customerName: 'Clara Oswald', totalAmount: 2638 },
  { id: 4, customerName: 'David Tennant', totalAmount: 1707 },
  { id: 5, customerName: 'Sarah Smith', totalAmount: 898 },
];

const PAYMENT_METHODS = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH'];

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const EMPTY_ADD_FORM = {
  bookingId: '',
  amount: '',
  paymentMethod: 'UPI',
  transactionId: '',
  paymentStatus: 'PENDING',
};

const Payments = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.allPayments();
      const list = Array.isArray(data) ? data.map(p => ({
        ...p,
        bookingId: p.bookingId || p.booking?.id,
        customerName: p.customerName
          ? p.customerName
          : p.booking?.registration
            ? `${p.booking?.registration?.firstName || ''} ${p.booking?.registration?.lastName || ''}`.trim() || 'N/A'
            : 'N/A',
        method: p.method || p.paymentMethod || 'N/A',
        status: p.status || p.paymentStatus || 'PENDING',
      })) : [];

      setPayments(list.length ? list : MOCK_PAYMENTS);
      setFilteredPayments(list.length ? list : MOCK_PAYMENTS);
    } catch (err) {
      console.error(err);
      setPayments(MOCK_PAYMENTS);
      setFilteredPayments(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = async () => {
    setIsAddOpen(true);
    setAddForm(EMPTY_ADD_FORM);
    setLoadingBookings(true);
    try {
      const data = await bookingApi.allBookings();
      const list = Array.isArray(data) && data.length ? data.map(b => ({
        ...b,
        customerName: b.customerName || (b.registration ? `${b.registration.firstName} ${b.registration.lastName}` : 'N/A'),
        totalAmount: b.totalAmount || 0,
      })) : MOCK_BOOKINGS;
      setBookings(list);
    } catch {
      setBookings(MOCK_BOOKINGS);
    } finally { setLoadingBookings(false); }
  };

  const handleAddChange = (key, value) => {
    const next = { ...addForm, [key]: value };
    if (key === 'bookingId') {
      const bk = bookings.find(b => String(b.id) === String(value));
      if (bk) next.amount = bk.totalAmount;
    }
    setAddForm(next);
  };

  useEffect(() => {
    let result = payments;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.id?.toString().toLowerCase().includes(q) ||
          p.bookingId?.toString().includes(q) ||
          (p.customerName || '').toLowerCase().includes(q) ||
          (p.method || '').toLowerCase().includes(q) ||
          (p.transactionId || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status?.toUpperCase() === statusFilter.toUpperCase());
    }
    setFilteredPayments(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, payments]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await paymentApi.updateStatus(id, newStatus);
      showToast(`Payment status updated to ${newStatus}`, 'success');
      loadPayments();
    } catch {
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
      showToast(`Payment status set to ${newStatus} locally`, 'success');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record permanently?')) return;
    try {
      await paymentApi.deletePayment(id);
      showToast('Payment record deleted', 'success');
      loadPayments();
    } catch {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      showToast('Payment removed locally', 'success');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.bookingId || !addForm.amount) {
      showToast('Please select a booking and set an amount', 'warning');
      return;
    }

    const selectedBooking = bookings.find(b => String(b.id) === String(addForm.bookingId));

    const payload = {
      booking: selectedBooking ? { id: selectedBooking.id } : null,
      amount: parseFloat(addForm.amount) || 0,
      paymentMethod: addForm.paymentMethod,
      transactionId: addForm.transactionId || `TXN-${Date.now()}`,
      paymentStatus: addForm.paymentStatus,
    };

    try {
      await paymentApi.addPayment(payload);
      showToast('Payment record created successfully!', 'success');
      setIsAddOpen(false);
      setAddForm(EMPTY_ADD_FORM);
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed to create payment record.', 'error');
    }
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setIsViewOpen(true);
  };

  const getMethodIcon = (method) => {
    const m = method?.toUpperCase();
    if (m === 'CREDIT_CARD' || m === 'DEBIT_CARD') return '💳';
    if (m === 'UPI') return '📱';
    if (m === 'NET_BANKING') return '🏦';
    return '💰';
  };

  const getStatusConfig = (status) => {
    const st = status?.toUpperCase();
    if (st === 'CONFIRMED' || st === 'SUCCESS')
      return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', select: 'text-emerald-755 border-emerald-201' };
    if (st === 'PENDING')
      return { badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', select: 'text-amber-755 border-amber-201' };
    return { badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', select: 'text-rose-755 border-rose-201' };
  };

  const statusSelectColor = (s) => ({
    CONFIRMED: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    SUCCESS: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    PENDING: 'text-amber-700 border-amber-200 bg-amber-50',
    REJECTED: 'text-rose-700 border-rose-200 bg-rose-50',
  }[s?.toUpperCase()] || 'text-slate-700 border-slate-200 bg-white');

  // Stats summaries
  const totalPayments = payments.length;
  const totalVolume = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const confirmedVolume = payments.filter(p => p.status?.toUpperCase() === 'CONFIRMED').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const pendingVolume = payments.filter(p => p.status?.toUpperCase() === 'PENDING').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Payment Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verify, search, and monitor incoming booking transaction histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiPlus className="w-4 h-4" /> Add Payment
          </button>
        </div>
      </div>

      {/* Financial Status Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Volume Recorded', value: totalVolume, icon: FiDollarSign, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Confirmed Settlements', value: confirmedVolume, icon: FiCheckCircle, color: '#10b981', bg: '#d1fae5' },
          { label: 'Pending Clearances', value: pendingVolume, icon: FiClock, color: '#f59e0b', bg: '#fffbeb' },
        ].map(card => (
          <div key={card.label} className="card p-5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background: card.bg, color: card.color }}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-display font-black text-slate-850 mt-1">${card.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiSearch className="text-slate-450 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            placeholder="Search by ID, Booking ID, Customer, TXN ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 font-medium cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1050px]">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Payment ID','Booking ID','Customer','Amount','Payment Method','Transaction ID','Status','Payment Date','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((payment) => (
                    <tr key={payment.id} className="table-row-hover transition-colors group" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-650">#{payment.id}</td>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">#{payment.bookingId}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                            style={{ background: 'linear-gradient(135deg,#06b6d4,#22d3ee)' }}>
                            {(payment.customerName || 'P')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{payment.customerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-black text-emerald-600 font-mono text-sm">${payment.amount}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl w-fit">
                          {getMethodIcon(payment.method)}
                          {(payment.method || payment.paymentMethod)?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{payment.transactionId || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={payment.status || payment.paymentStatus || 'PENDING'}
                          onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border cursor-pointer focus:outline-none transition-colors ${statusSelectColor(payment.status)}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleView(payment)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(payment.id)} className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" title="Delete Record"><FiTrash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="py-16 text-center text-slate-400 font-medium">No payment records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} records</span>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage === i + 1 ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i + 1}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Payment Transaction Details">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Transaction ID</p>
                <h4 className="text-base font-extrabold text-indigo-650 font-mono">{selectedPayment.id}</h4>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${getStatusConfig(selectedPayment.status).badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedPayment.status).dot}`} />
                {selectedPayment.status || selectedPayment.paymentStatus}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Booking ID</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">#{selectedPayment.bookingId}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Customer Name</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPayment.customerName}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Amount Paid</span>
                <p className="text-lg font-black text-emerald-600 mt-1">${selectedPayment.amount}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Payment Method</span>
                <p className="text-sm font-semibold text-slate-850 mt-1 flex items-center gap-2">
                  <span>{getMethodIcon(selectedPayment.method)}</span>
                  {(selectedPayment.method || selectedPayment.paymentMethod)?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl col-span-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Transaction ID Code</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">{selectedPayment.transactionId || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl col-span-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Recorded Payment Date</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">{formatDate(selectedPayment.paymentDate)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Payment" size="lg">
        {loadingBookings ? (
          <div className="h-48 flex items-center justify-center"><Spinner /></div>
        ) : (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Booking</label>
              <select
                value={addForm.bookingId}
                onChange={e => handleAddChange('bookingId', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                required
              >
                <option value="">— Select a Booking —</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.id} — {b.customerName} (${b.totalAmount?.toLocaleString() || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-sm">$</span>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={e => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-emerald-700 focus:border-emerald-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Payment Status</label>
                <select
                  value={addForm.paymentStatus}
                  onChange={e => setAddForm({ ...addForm, paymentStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, paymentMethod: m })}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                      addForm.paymentMethod === m
                        ? 'bg-indigo-600 border-indigo-650 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm">{getMethodIcon(m)}</span>
                    <span className="truncate max-w-full px-1">{m.replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Transaction ID</label>
              <input
                type="text"
                value={addForm.transactionId}
                onChange={e => setAddForm({ ...addForm, transactionId: e.target.value })}
                placeholder="TXN-000000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 focus:border-primary-400 outline-none"
              />
            </div>

            {addForm.bookingId && (
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold truncate">
                  {getMethodIcon(addForm.paymentMethod)} {addForm.paymentMethod.replace(/_/g, ' ')} →{' '}
                  {bookings.find(b => String(b.id) === String(addForm.bookingId))?.customerName}
                </span>
                <span className="font-black text-emerald-600">${addForm.amount || 0}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={() => setAddForm(EMPTY_ADD_FORM)} className="px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Reset</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
