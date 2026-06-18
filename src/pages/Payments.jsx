import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { paymentApi } from '../services/paymentApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiTrash2, FiCreditCard,
  FiDollarSign, FiFilter, FiCalendar, FiHash
} from 'react-icons/fi';

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

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentApi.allPayments();
      const list = Array.isArray(data) ? data : [];
      setPayments(list);
      setFilteredPayments(list);
    } catch (err) {
      console.error(err);
      showToast('Could not load payments; displaying offline defaults.', 'warning');
      const mock = [
        { id: 'PAY-001', bookingId: '1001', customerName: 'Alice Green', amount: 449, method: 'CREDIT_CARD', transactionId: 'TXN-982312093', status: 'CONFIRMED', paymentDate: '2026-06-15' },
        { id: 'PAY-002', bookingId: '1002', customerName: 'Robert Hill', amount: 679, method: 'UPI', transactionId: 'TXN-112390841', status: 'PENDING', paymentDate: '2026-06-16' },
        { id: 'PAY-003', bookingId: '1003', customerName: 'Clara Oswald', amount: 1319, method: 'NET_BANKING', transactionId: 'TXN-874312095', status: 'CONFIRMED', paymentDate: '2026-06-14' },
        { id: 'PAY-004', bookingId: '1004', customerName: 'David Tennant', amount: 569, method: 'DEBIT_CARD', transactionId: 'TXN-451290876', status: 'REJECTED', paymentDate: '2026-06-12' },
        { id: 'PAY-005', bookingId: '1005', customerName: 'Sarah Smith', amount: 449, method: 'UPI', transactionId: 'TXN-672901234', status: 'PENDING', paymentDate: '2026-06-17' },
        { id: 'PAY-006', bookingId: '1006', customerName: 'James Kirk', amount: 1199, method: 'CREDIT_CARD', transactionId: 'TXN-908123049', status: 'CONFIRMED', paymentDate: '2026-06-11' },
        { id: 'PAY-007', bookingId: '1007', customerName: 'Lena Okonkwo', amount: 749, method: 'NET_BANKING', transactionId: 'TXN-223409815', status: 'PENDING', paymentDate: '2026-06-13' },
        { id: 'PAY-008', bookingId: '1008', customerName: 'Vikram Malhotra', amount: 899, method: 'UPI', transactionId: 'TXN-554210987', status: 'CONFIRMED', paymentDate: '2026-06-18' },
        { id: 'PAY-009', bookingId: '1009', customerName: 'Priya Sharma', amount: 1050, method: 'CREDIT_CARD', transactionId: 'TXN-334120986', status: 'CONFIRMED', paymentDate: '2026-06-10' }
      ];
      setPayments(mock);
      setFilteredPayments(mock);
    } finally {
      setLoading(false);
    }
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
    if (st === 'CONFIRMED')
      return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', select: 'text-emerald-700 border-emerald-200' };
    if (st === 'PENDING')
      return { badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', select: 'text-amber-700 border-amber-200' };
    return { badge: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', select: 'text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight font-sans">Payment Transactions</h1>
        <p className="text-xs sm:text-sm text-slate-450 mt-0.5">
          Monitor all financial transactions, verify payment statuses, and view transaction details.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
          <FiSearch className="text-slate-400 w-4.5 h-4.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, Booking ID, Customer, TXN ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="h-60 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-100 text-slate-450 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Payment ID</th>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Payment Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentItems.length > 0 ? (
                  currentItems.map((payment) => {
                    const cfg = getStatusConfig(payment.status);
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-primary-600">{payment.id}</td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">#{payment.bookingId}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{payment.customerName || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600 font-mono text-sm">${payment.amount}</td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg w-fit">
                            {getMethodIcon(payment.method)}
                            {payment.method?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{payment.transactionId || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <select
                            value={payment.status || 'PENDING'}
                            onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border bg-white cursor-pointer focus:outline-none ${cfg.select}`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <FiCalendar className="text-slate-400 w-3.5 h-3.5" />
                            {payment.paymentDate || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleView(payment)}
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No payment records found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-450 font-bold">
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} records
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => handlePageChange(i + 1)}
                    className={`w-7 h-7 text-xs font-semibold rounded-lg border transition-colors ${currentPage === i + 1 ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Payment Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Payment Transaction Details">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment ID</p>
                <h4 className="text-base font-extrabold text-primary-600 font-mono">{selectedPayment.id}</h4>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${getStatusConfig(selectedPayment.status).badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedPayment.status).dot}`} />
                {selectedPayment.status}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Booking ID</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">#{selectedPayment.bookingId}</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Customer Name</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{selectedPayment.customerName || 'N/A'}</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Amount Paid</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">${selectedPayment.amount}</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Payment Method</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-2">
                  <span>{getMethodIcon(selectedPayment.method)}</span>
                  {selectedPayment.method?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Transaction ID</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">{selectedPayment.transactionId || 'N/A'}</p>
              </div>
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Payment Date</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 font-mono">{selectedPayment.paymentDate || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
