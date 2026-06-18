import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { driverApi } from '../services/driverApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiEdit2, FiTrash2,
  FiToggleLeft, FiToggleRight, FiTruck, FiAward,
  FiMail, FiPhone, FiHash
} from 'react-icons/fi';

const MOCK_DRIVERS = [
  { id: 1, driverName: 'Alex Mercer', email: 'alex.mercer@travel.com', phoneNumber: '9876543210', licenseNumber: 'DL-AP-9876543', vehicleName: 'Toyota HiAce', vehicleNumber: 'AP-09-AB-1234', vehicleType: 'Van', experience: '8 Years', status: 'ACTIVE' },
  { id: 2, driverName: 'Brian OConner', email: 'brian.oc@travel.com', phoneNumber: '9765432109', licenseNumber: 'DL-TS-1234567', vehicleName: 'Nissan NV350', vehicleNumber: 'TS-10-CD-5678', vehicleType: 'Mini Bus', experience: '5 Years', status: 'ACTIVE' },
  { id: 3, driverName: 'Dominic Toretto', email: 'dom.t@travel.com', phoneNumber: '9654321098', licenseNumber: 'DL-KA-7654321', vehicleName: 'Ford Transit', vehicleNumber: 'KA-05-EF-9012', vehicleType: 'Bus', experience: '12 Years', status: 'ACTIVE' },
  { id: 4, driverName: 'Leticia Ortiz', email: 'leticia.o@travel.com', phoneNumber: '9543210987', licenseNumber: 'DL-MH-2345678', vehicleName: 'Chevrolet Express', vehicleNumber: 'MH-12-GH-3456', vehicleType: 'Van', experience: '9 Years', status: 'INACTIVE' },
  { id: 5, driverName: 'Roman Pearce', email: 'roman.p@travel.com', phoneNumber: '9432109876', licenseNumber: 'DL-GJ-8765432', vehicleName: 'Mercedes Sprinter', vehicleNumber: 'GJ-01-IJ-7890', vehicleType: 'Luxury Van', experience: '4 Years', status: 'ACTIVE' },
];

const VEHICLE_TYPES = ['Van', 'Mini Bus', 'Bus', 'Luxury Van', 'SUV', 'Sedan', 'Tempo Traveller'];

const StatusBadge = ({ status }) => {
  const active = status?.toUpperCase() === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status || 'ACTIVE'}
    </span>
  );
};

const Drivers = () => {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 6;

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await driverApi.allDrivers();
      const list = Array.isArray(data) && data.length ? data : MOCK_DRIVERS;
      setDrivers(list); setFiltered(list);
    } catch {
      setDrivers(MOCK_DRIVERS); setFiltered(MOCK_DRIVERS);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(drivers.filter(d =>
      !q ||
      String(d.id).includes(q) ||
      (d.driverName || d.name || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.phoneNumber || '').includes(q) ||
      (d.licenseNumber || '').toLowerCase().includes(q) ||
      (d.vehicleName || '').toLowerCase().includes(q) ||
      (d.vehicleNumber || '').toLowerCase().includes(q) ||
      (d.vehicleType || '').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, drivers]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleToggle = async (driver) => {
    const next = driver.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await driverApi.updateStatus(driver.id, next); load(); } catch {
      setDrivers(p => p.map(d => d.id === driver.id ? { ...d, status: next } : d));
    }
    showToast(`Driver status → ${next}`, 'success');
  };

  const openEdit = (d) => {
    setSelected(d);
    setForm({ ...d, driverName: d.driverName || d.name || '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await driverApi.updateDriver(form.id, form); load(); } catch {
      setDrivers(p => p.map(d => d.id === form.id ? { ...d, ...form } : d));
    }
    showToast('Driver updated successfully', 'success');
    setEditOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver record?')) return;
    try { await driverApi.deleteDriver(id); load(); } catch {
      setDrivers(p => p.filter(d => d.id !== id));
    }
    showToast('Driver deleted', 'success');
  };

  const Field = ({ label, value }) => (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-all">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Driver Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage driver profiles, vehicles, licenses and status.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2">
          Total: <span className="text-primary-600 font-bold">{drivers.length}</span> Drivers
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            placeholder="Search by name, email, license, vehicle, phone..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID','Driver Name','Email','Phone Number','License No.','Vehicle Name','Vehicle No.','Vehicle Type','Experience','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length > 0 ? pageItems.map(driver => (
                  <tr key={driver.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-400">#{driver.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-violet-200">
                          {(driver.driverName || driver.name || 'D')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">{driver.driverName || driver.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{driver.email}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{driver.phoneNumber}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">{driver.licenseNumber}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{driver.vehicleName}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{driver.vehicleNumber}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100">{driver.vehicleType}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{driver.experience}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleToggle(driver)} className="flex items-center gap-1.5 group/toggle">
                        {driver.status?.toUpperCase() === 'ACTIVE'
                          ? <FiToggleRight className="w-6 h-6 text-emerald-500" />
                          : <FiToggleLeft className="w-6 h-6 text-slate-300" />}
                        <StatusBadge status={driver.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(driver); setViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="View"><FiEye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(driver)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(driver.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={11} className="py-16 text-center text-slate-400 font-medium">No drivers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} className={`w-7 h-7 text-xs font-bold rounded-lg border transition-colors ${currentPage===i+1?'bg-primary-500 border-primary-500 text-white':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i+1}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Driver Profile Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-violet-200 text-violet-700 font-bold text-2xl flex items-center justify-center border-2 border-violet-300">
                {(selected.driverName||selected.name||'D')[0].toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{selected.driverName||selected.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Driver ID: #{selected.id}</p>
                <div className="mt-1.5"><StatusBadge status={selected.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email Address" value={selected.email} />
              <Field label="Phone Number" value={selected.phoneNumber} />
              <Field label="License Number" value={selected.licenseNumber} />
              <Field label="Experience" value={selected.experience} />
              <Field label="Vehicle Name" value={selected.vehicleName} />
              <Field label="Vehicle Number" value={selected.vehicleNumber} />
              <Field label="Vehicle Type" value={selected.vehicleType} />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Driver Details" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Driver Name','driverName','text'],
              ['Email','email','email'],
              ['Phone Number','phoneNumber','text'],
              ['License Number','licenseNumber','text'],
              ['Vehicle Name','vehicleName','text'],
              ['Vehicle Number','vehicleNumber','text'],
              ['Experience','experience','text'],
            ].map(([label, key, type]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <input type={type} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-400 outline-none transition-colors" required />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
              <select value={form.vehicleType||''} onChange={e=>setForm({...form,vehicleType:e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-400 outline-none transition-colors cursor-pointer">
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select value={form.status||'ACTIVE'} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-400 outline-none transition-colors cursor-pointer">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={()=>setEditOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-sm transition-colors">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
