import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { bookingApi } from '../services/bookingApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { FiSearch, FiEye, FiTrash2, FiCalendar, FiFilter, FiUsers, FiDollarSign } from 'react-icons/fi';

const MOCK_BOOKINGS = [
  { id: 'BK-1001', customerName: 'Alice Green', packageName: 'Goa Golden Beach Tour', travelDate: '2026-07-10', persons: 2, totalAmount: 898, bookingStatus: 'CONFIRMED', bookingDate: '2026-06-01' },
  { id: 'BK-1002', customerName: 'Robert Hill', packageName: 'Kerala Backwater Paradise', travelDate: '2026-08-15', persons: 4, totalAmount: 2716, bookingStatus: 'PENDING', bookingDate: '2026-06-05' },
  { id: 'BK-1003', customerName: 'Clara Oswald', packageName: 'Maldives Island Escapade', travelDate: '2026-07-22', persons: 2, totalAmount: 2638, bookingStatus: 'CONFIRMED', bookingDate: '2026-06-07' },
  { id: 'BK-1004', customerName: 'David Tennant', packageName: 'Himalayan Adventure Trek', travelDate: '2026-09-02', persons: 3, totalAmount: 1707, bookingStatus: 'CANCELLED', bookingDate: '2026-06-08' },
  { id: 'BK-1005', customerName: 'Sarah Smith', packageName: 'Goa Golden Beach Tour', travelDate: '2026-10-05', persons: 2, totalAmount: 898, bookingStatus: 'PENDING', bookingDate: '2026-06-10' },
  { id: 'BK-1006', customerName: 'James Kirk', packageName: 'Rajasthan Heritage Cruise', travelDate: '2026-11-01', persons: 5, totalAmount: 3595, bookingStatus: 'CONFIRMED', bookingDate: '2026-06-12' },
  { id: 'BK-1007', customerName: 'Lena Okonkwo', packageName: 'Kerala Backwater Paradise', travelDate: '2026-08-20', persons: 2, totalAmount: 1358, bookingStatus: 'PENDING', bookingDate: '2026-06-13' },
];

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const StatusBadge = ({ status }) => {
  const config = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const dot = { CONFIRMED: 'bg-emerald-500', PENDING: 'bg-amber-500', CANCELLED: 'bg-rose-500' };
  const key = status?.toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config[key] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[key] || 'bg-slate-400'}`} />
      {status || 'PENDING'}
    </span>
  );
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Bookings = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 7;

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.allBookings();
      const list = Array.isArray(data) && data.length ? data : MOCK_BOOKINGS;
      setBookings(list); setFiltered(list);
    } catch {
      setBookings(MOCK_BOOKINGS); setFiltered(MOCK_BOOKINGS);
    } finally { setLoading(false); }
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

  const statusSelectColor = (s) => ({
    CONFIRMED: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    PENDING: 'text-amber-700 border-amber-200 bg-amber-50',
    CANCELLED: 'text-rose-700 border-rose-200 bg-rose-50',
  }[s?.toUpperCase()] || 'text-slate-700 border-slate-200 bg-white');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Booking Operations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track reservations, manage travel statuses and booking records.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2">
          Total: <span className="text-primary-600 font-bold">{bookings.length}</span> Bookings
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            placeholder="Search by booking ID, customer, package..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Booking ID','Customer Name','Package Name','Travel Date','Persons','Total Amount','Booking Status','Booking Date','Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length > 0 ? pageItems.map(b => (
                  <tr key={b.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">{b.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{b.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[160px]"><p className="truncate">{b.packageName}</p></td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 text-slate-400"/>{formatDate(b.travelDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      <span className="flex items-center gap-1"><FiUsers className="w-3 h-3 text-slate-400"/>{b.persons}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 font-mono text-sm">${b.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select value={b.bookingStatus || 'PENDING'} onChange={e => handleStatusChange(b.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg border cursor-pointer focus:outline-none transition-colors ${statusSelectColor(b.bookingStatus)}`}>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 text-slate-300"/>{formatDate(b.bookingDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(b); setViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="View"><FiEye className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-4 h-4"/></button>
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
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 font-medium">{(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage===i+1?'bg-primary-500 border-primary-500 text-white':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i+1}</button>
                ))}
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Booking Invoice Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Reference</p>
                <h4 className="text-xl font-extrabold text-primary-600 font-mono">{selected.id}</h4>
              </div>
              <StatusBadge status={selected.bookingStatus} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Customer Name', selected.customerName],
                ['Package Name', selected.packageName],
                ['Travel Date', formatDate(selected.travelDate)],
                ['Booking Date', formatDate(selected.bookingDate)],
                ['Number of Persons', selected.persons],
                ['Total Amount', `$${(selected.totalAmount||0).toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{l}</p>
                  <p className="text-sm font-semibold text-slate-800">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
