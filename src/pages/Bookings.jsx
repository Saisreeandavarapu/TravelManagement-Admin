import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { bookingApi } from '../services/bookingApi';
import { userApi } from '../services/userApi';
import { packageApi } from '../services/packageApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiTrash2, FiCalendar, FiFilter, FiUsers,
  FiDollarSign, FiPlus, FiChevronRight, FiCheckCircle, FiClock, FiXCircle
} from 'react-icons/fi';

const MOCK_BOOKINGS = [
  { id: 'BK-1001', customerName: 'Alice Green', packageName: 'Goa Golden Beach Tour', travelDate: '2026-07-10', persons: 2, totalAmount: 898, bookingStatus: 'CONFIRMED', bookingDate: '2026-06-01' },
  { id: 'BK-1002', customerName: 'Robert Hill', packageName: 'Kerala Backwater Paradise', travelDate: '2026-08-15', persons: 4, totalAmount: 2716, bookingStatus: 'PENDING', bookingDate: '2026-06-05' },
  { id: 'BK-1003', customerName: 'Clara Oswald', packageName: 'Maldives Island Escapade', travelDate: '2026-07-22', persons: 2, totalAmount: 2638, bookingStatus: 'CONFIRMED', bookingDate: '2026-06-07' },
  { id: 'BK-1004', customerName: 'David Tennant', packageName: 'Himalayan Adventure Trek', travelDate: '2026-09-02', persons: 3, totalAmount: 1707, bookingStatus: 'CANCELLED', bookingDate: '2026-06-08' },
  { id: 'BK-1005', customerName: 'Sarah Smith', packageName: 'Goa Golden Beach Tour', travelDate: '2026-10-05', persons: 2, totalAmount: 898, bookingStatus: 'PENDING', bookingDate: '2026-06-10' },
];

const MOCK_USERS = [
  { id: 1, firstName: 'Alice', lastName: 'Green', email: 'alice.green@gmail.com', role: 'CUSTOMER' },
  { id: 2, firstName: 'Robert', lastName: 'Hill', email: 'robert.hill@gmail.com', role: 'USER' },
  { id: 5, firstName: 'Sarah', lastName: 'Smith', email: 'sarah.smith@gmail.com', role: 'CUSTOMER' },
];

const MOCK_PACKAGES = [
  { id: 1, title: 'Goa Golden Beach Tour', offerPrice: 449 },
  { id: 2, title: 'Kerala Backwater Paradise', offerPrice: 679 },
  { id: 3, title: 'Himalayan Adventure Trek', offerPrice: 569 },
  { id: 4, title: 'Rajasthan Heritage Cruise', offerPrice: 719 },
  { id: 5, title: 'Maldives Island Escapade', offerPrice: 1319 },
];

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const StatusBadge = ({ status }) => {
  const isConfirmed = status?.toUpperCase() === 'CONFIRMED';
  const isPending = status?.toUpperCase() === 'PENDING';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
      isConfirmed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
      isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-rose-50 text-rose-700 border-rose-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isConfirmed ? 'bg-emerald-500' :
        isPending ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
      {status || 'PENDING'}
    </span>
  );
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY_ADD_FORM = {
  customerId: '',
  packageId: '',
  travelDate: '',
  numberOfPersons: '1',
  totalAmount: '',
  bookingStatus: 'PENDING',
};

const Bookings = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 8;

  const [viewOpen, setViewOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.allBookings();
      const list = Array.isArray(data) && data.length ? data.map(b => ({
        ...b,
        customerName: b.customerName || (b.registration ? `${b.registration.firstName} ${b.registration.lastName}` : 'N/A'),
        packageName: b.packageName || b.aPackage?.title || 'N/A',
        persons: b.persons || b.numberOfPersons || 0,
        totalAmount: b.totalAmount || 0,
        bookingStatus: b.bookingStatus || 'PENDING',
      })) : MOCK_BOOKINGS;
      setBookings(list); setFiltered(list);
    } catch {
      setBookings(MOCK_BOOKINGS); setFiltered(MOCK_BOOKINGS);
    } finally { setLoading(false); }
  };

  const openAddModal = async () => {
    setAddOpen(true);
    setAddForm(EMPTY_ADD_FORM);
    setLoadingMeta(true);
    try {
      const [usersData, pkgsData] = await Promise.all([
        userApi.allUsers().catch(() => MOCK_USERS),
        packageApi.allPackages().catch(() => MOCK_PACKAGES),
      ]);
      setUsers(Array.isArray(usersData) && usersData.length ? usersData : MOCK_USERS);
      setPackages(Array.isArray(pkgsData) && pkgsData.length ? pkgsData : MOCK_PACKAGES);
    } catch {
      setUsers(MOCK_USERS);
      setPackages(MOCK_PACKAGES);
    } finally { setLoadingMeta(false); }
  };

  const handleAddChange = (key, value) => {
    const next = { ...addForm, [key]: value };
    const selectedPkg = packages.find(p => String(p.id) === String(key === 'packageId' ? value : next.packageId));
    const persons = parseInt(key === 'numberOfPersons' ? value : next.numberOfPersons) || 1;
    if (selectedPkg) {
      next.totalAmount = (selectedPkg.offerPrice || selectedPkg.price || 0) * persons;
    }
    setAddForm(next);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    let result = bookings.filter(b =>
      !q ||
      String(b.id).toLowerCase().includes(q) ||
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.packageName || '').toLowerCase().includes(q)
    );
    if (statusFilter !== 'All') result = result.filter(b => b.bookingStatus?.toUpperCase() === statusFilter);
    setFiltered(result); setCurrentPage(1);
  }, [search, statusFilter, bookings]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleStatusChange = async (id, status) => {
    try { await bookingApi.updateStatus(id, status); load(); } catch {
      setBookings(p => p.map(b => b.id === id ? { ...b, bookingStatus: status } : b));
    }
    showToast(`Booking status → ${status}`, 'success');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;
    try { await bookingApi.deleteBooking(id); load(); } catch {
      setBookings(p => p.filter(b => b.id !== id));
    }
    showToast('Booking deleted', 'success');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.customerId || !addForm.packageId || !addForm.travelDate) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const selectedUser = users.find(u => String(u.id) === String(addForm.customerId));
    const selectedPkg = packages.find(p => String(p.id) === String(addForm.packageId));

    const payload = {
      registration: selectedUser ? { id: selectedUser.id } : null,
      aPackage: selectedPkg ? { id: selectedPkg.id } : null,
      travelDate: addForm.travelDate,
      numberOfPersons: parseInt(addForm.numberOfPersons) || 1,
      totalAmount: parseFloat(addForm.totalAmount) || 0,
      bookingStatus: addForm.bookingStatus,
    };

    try {
      await bookingApi.addBooking(payload);
      showToast('Booking created successfully!', 'success');
      setAddOpen(false);
      setAddForm(EMPTY_ADD_FORM);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to create booking.', 'error');
    }
  };

  const statusSelectColor = (s) => ({
    CONFIRMED: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    PENDING: 'text-amber-700 border-amber-200 bg-amber-50',
    CANCELLED: 'text-rose-700 border-rose-200 bg-rose-50',
  }[s?.toUpperCase()] || 'text-slate-700 border-slate-200 bg-white');

  // Stats summaries
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter(b => b.bookingStatus?.toUpperCase() === 'CONFIRMED').length;
  const pendingCount = bookings.filter(b => b.bookingStatus?.toUpperCase() === 'PENDING').length;
  const cancelledCount = bookings.filter(b => b.bookingStatus?.toUpperCase() === 'CANCELLED').length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Booking Operations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track reservations, manage travel statuses, and booking invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiPlus className="w-4 h-4" /> Add Booking
          </button>
          <div className="px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
            {totalCount} Total Bookings
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, icon: FiPlus, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Confirmed', value: confirmedCount, icon: FiCheckCircle, color: '#10b981', bg: '#d1fae5' },
          { label: 'Pending', value: pendingCount, icon: FiClock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Cancelled', value: cancelledCount, icon: FiXCircle, color: '#f43f5e', bg: '#fee2e2' },
        ].map(card => (
          <div key={card.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background: card.bg, color: card.color }}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-black text-slate-800 leading-none mt-1">{card.value}</p>
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
            placeholder="Search by booking ID, customer, package..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 font-medium cursor-pointer">
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[980px]">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Booking ID','Customer','Package Name','Travel Date','Persons','Total Amount','Booking Status','Booking Date','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.length > 0 ? pageItems.map(b => (
                  <tr key={b.id} className="table-row-hover transition-colors group" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-600">#{b.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                          {(b.customerName || 'C')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{b.customerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700 max-w-[180px] truncate">{b.packageName}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5 text-slate-400"/>{formatDate(b.travelDate)}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5"><FiUsers className="w-3.5 h-3.5 text-slate-400"/>{b.persons || b.numberOfPersons}</span>
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-800 font-mono text-sm">${(b.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <select value={b.bookingStatus || 'PENDING'} onChange={e => handleStatusChange(b.id, e.target.value)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border cursor-pointer focus:outline-none transition-colors ${statusSelectColor(b.bookingStatus)}`}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(b); setViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="View Details"><FiEye className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" title="Delete Booking"><FiTrash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="py-16 text-center text-slate-400 font-medium">No bookings found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">{(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length} bookings</span>
              <div className="flex gap-1">
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage===i+1?'bg-indigo-500 border-indigo-500 text-white':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i+1}</button>
                ))}
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal (Receipt style) */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Booking Invoice Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl">
              <div>
                <p className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Booking Ref ID</p>
                <h4 className="text-xl font-black text-indigo-600 font-mono">#{selected.id}</h4>
              </div>
              <StatusBadge status={selected.bookingStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                ['Customer Name', selected.customerName],
                ['Package Name', selected.packageName],
                ['Travel Date', formatDate(selected.travelDate)],
                ['Booking Date', formatDate(selected.bookingDate)],
                ['Number of Persons', selected.persons || selected.numberOfPersons],
                ['Total Amount', `$${(selected.totalAmount||0).toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{l}</p>
                  <p className="text-sm font-semibold text-slate-850">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Booking Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Create New Booking" size="lg">
        {loadingMeta ? (
          <div className="h-48 flex items-center justify-center"><Spinner /></div>
        ) : (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Select Customer</label>
              <select
                value={addForm.customerId}
                onChange={e => handleAddChange('customerId', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                required
              >
                <option value="">— Choose a Customer —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Select Package</label>
              <select
                value={addForm.packageId}
                onChange={e => handleAddChange('packageId', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                required
              >
                <option value="">— Choose a Package —</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.packageName} — ${p.offerPrice || p.price || '?'}/person
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Travel Date</label>
                <input
                  type="date"
                  value={addForm.travelDate}
                  onChange={e => handleAddChange('travelDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Number of Persons</label>
                <input
                  type="number"
                  min="1"
                  value={addForm.numberOfPersons}
                  onChange={e => handleAddChange('numberOfPersons', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">
                  Total Amount <span className="text-emerald-600 font-semibold">(auto)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    value={addForm.totalAmount}
                    onChange={e => setAddForm({ ...addForm, totalAmount: e.target.value })}
                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl pl-7 pr-3 py-2.5 text-sm font-bold text-emerald-700 focus:border-emerald-455 outline-none cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Booking Status</label>
                <select
                  value={addForm.bookingStatus}
                  onChange={e => setAddForm({ ...addForm, bookingStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {addForm.customerId && addForm.packageId && (
              <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold truncate max-w-[280px]">
                  {users.find(u => String(u.id) === String(addForm.customerId))?.firstName || ''} →{' '}
                  {packages.find(p => String(p.id) === String(addForm.packageId))?.title || ''}
                </span>
                <span className="font-black text-emerald-600">${addForm.totalAmount || 0}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">Create Booking</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
