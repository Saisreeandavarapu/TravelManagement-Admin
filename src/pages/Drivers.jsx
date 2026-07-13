import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { driverApi } from '../services/driverApi';
import { userApi } from '../services/userApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiEdit2, FiTrash2, FiTruck, FiPlus,
  FiToggleLeft, FiToggleRight, FiAward, FiMail, FiPhone, FiMapPin
} from 'react-icons/fi';

const MOCK_DRIVERS = [
  { id:1, driverName:'Alex Mercer',     email:'alex.mercer@travel.com',  phoneNumber:'9876543210', licenseNumber:'DL-AP-9876543', vehicleName:'Toyota HiAce',      vehicleNumber:'AP-09-AB-1234', vehicleType:'Van',       experience:'8 Years', status:'ACTIVE'   },
  { id:2, driverName:'Brian OConner',   email:'brian.oc@travel.com',     phoneNumber:'9765432109', licenseNumber:'DL-TS-1234567', vehicleName:'Nissan NV350',       vehicleNumber:'TS-10-CD-5678', vehicleType:'Mini Bus',  experience:'5 Years', status:'ACTIVE'   },
  { id:3, driverName:'Dominic Toretto', email:'dom.t@travel.com',        phoneNumber:'9654321098', licenseNumber:'DL-KA-7654321', vehicleName:'Ford Transit',       vehicleNumber:'KA-05-EF-9012', vehicleType:'Bus',       experience:'12 Years',status:'ACTIVE'   },
  { id:4, driverName:'Leticia Ortiz',   email:'leticia.o@travel.com',    phoneNumber:'9543210987', licenseNumber:'DL-MH-2345678', vehicleName:'Chevrolet Express',  vehicleNumber:'MH-12-GH-3456', vehicleType:'Van',       experience:'9 Years', status:'INACTIVE' },
  { id:5, driverName:'Roman Pearce',    email:'roman.p@travel.com',      phoneNumber:'9432109876', licenseNumber:'DL-GJ-8765432', vehicleName:'Mercedes Sprinter', vehicleNumber:'GJ-01-IJ-7890', vehicleType:'Luxury Van',experience:'4 Years', status:'ACTIVE'   },
];
const VEHICLE_TYPES = ['Van','Mini Bus','Bus','Luxury Van','SUV','Sedan','Tempo Traveller'];

const VEHICLE_COLORS = {
  'Van':         '#6366f1', 'Mini Bus':    '#06b6d4', 'Bus':        '#10b981',
  'Luxury Van':  '#f59e0b', 'SUV':         '#8b5cf6', 'Sedan':      '#f43f5e',
  'Tempo Traveller': '#64748b',
};

const InputField = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
    <input className="w-full text-sm px-3 py-2.5 rounded-xl outline-none transition-all"
      style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}
      onFocus={e=>e.target.style.border='1px solid #6366f1'}
      onBlur={e=>e.target.style.border='1px solid #e2e8f0'} {...props} />
  </div>
);

const Drivers = () => {
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 7;

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen,  setAddOpen]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const [users, setUsers] = useState([]);
  const [addForm, setAddForm] = useState({
    userId: '',
    licenseNumber: '',
    vehicleName: '',
    vehicleType: 'Van',
    experienceYears: '',
    address: '',
    city: '',
    state: '',
    status: 'PENDING'
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [drvData, usrData] = await Promise.all([
        driverApi.allDrivers().catch(() => []),
        userApi.allUsers().catch(() => [])
      ]);
      const list = Array.isArray(drvData) && drvData.length ? drvData.map(d => ({
        ...d,
        driverName: d.driverName || (d.registration ? `${d.registration.firstName} ${d.registration.lastName}` : d.name || 'N/A'),
        email: d.email || d.registration?.email || 'N/A',
        phoneNumber: d.phoneNumber || d.registration?.phoneNumber || 'N/A',
        experience: d.experience || (d.experienceYears ? `${d.experienceYears} Years` : '0 Years'),
        vehicleNumber: d.vehicleNumber || 'N/A',
        status: d.status || 'PENDING'
      })) : MOCK_DRIVERS.map(d => ({ ...d, status: d.status === 'ACTIVE' ? 'APPROVED' : 'PENDING' }));
      setDrivers(list); setFiltered(list);
      setUsers(usrData);
    } catch {
      setDrivers(MOCK_DRIVERS.map(d => ({ ...d, status: d.status === 'ACTIVE' ? 'APPROVED' : 'PENDING' })));
      setFiltered(MOCK_DRIVERS.map(d => ({ ...d, status: d.status === 'ACTIVE' ? 'APPROVED' : 'PENDING' })));
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(drivers.filter(d =>
      !q || String(d.id).includes(q) ||
      (d.driverName||'').toLowerCase().includes(q) ||
      (d.email||'').toLowerCase().includes(q) ||
      (d.licenseNumber||'').toLowerCase().includes(q) ||
      (d.vehicleName||'').toLowerCase().includes(q) ||
      (d.vehicleType||'').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, drivers]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const handleToggle = async driver => {
    const current = driver.status?.toUpperCase() || 'PENDING';
    const next = current === 'PENDING' ? 'APPROVED' : current === 'APPROVED' ? 'REJECTED' : 'PENDING';
    try { await driverApi.updateStatus(driver.id, next); load(); } catch { setDrivers(p=>p.map(d=>d.id===driver.id?{...d,status:next}:d)); }
    showToast(`Driver status → ${next}`, 'success');
  };

  const openEdit = d => {
    setSelected(d);
    setForm({ ...d, driverName: d.driverName||'', experience: d.experience?.replace(' Years','')||'' });
    setEditOpen(true);
  };

  const handleEdit = async e => {
    e.preventDefault();
    const payload = { ...form, experienceYears: parseInt(form.experience)||0 };
    try { await driverApi.updateDriver(form.id, payload); load(); showToast('Driver updated', 'success'); setEditOpen(false); }
    catch (err) { showToast('Update failed', 'error'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this driver?')) return;
    try { await driverApi.deleteDriver(id); load(); } catch { setDrivers(p=>p.filter(d=>d.id!==id)); }
    showToast('Driver deleted', 'success');
  };

  const handleAddSubmit = async e => {
    e.preventDefault();
    if (!addForm.userId) {
      showToast('Please select a user', 'warning');
      return;
    }
    const selectedUser = users.find(u => String(u.id) === String(addForm.userId));
    if (!selectedUser) {
      showToast('User not found', 'error');
      return;
    }
    const payload = {
      registration: selectedUser,
      licenseNumber: addForm.licenseNumber,
      vehicleName: addForm.vehicleName,
      vehicleType: addForm.vehicleType,
      experienceYears: parseInt(addForm.experienceYears) || parseInt(addForm.experience) || 0,
      address: addForm.address,
      city: addForm.city,
      state: addForm.state,
      status: addForm.status
    };
    try {
      await driverApi.addDriver(payload);
      showToast('Driver added successfully', 'success');
      setAddOpen(false);
      handleResetAddForm();
      load();
    } catch (err) {
      const mockNewDriver = {
        id: Date.now(),
        driverName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        email: selectedUser.email,
        phoneNumber: selectedUser.phoneNumber,
        registration: selectedUser,
        licenseNumber: addForm.licenseNumber,
        vehicleName: addForm.vehicleName,
        vehicleType: addForm.vehicleType,
        experience: `${addForm.experienceYears || addForm.experience || 0} Years`,
        address: addForm.address,
        city: addForm.city,
        state: addForm.state,
        status: addForm.status
      };
      setDrivers(p => [mockNewDriver, ...p]);
      showToast('Driver added successfully (Local)', 'success');
      setAddOpen(false);
      handleResetAddForm();
    }
  };

  const handleResetAddForm = () => {
    setAddForm({
      userId: '',
      licenseNumber: '',
      vehicleName: '',
      vehicleType: 'Van',
      experienceYears: '',
      address: '',
      city: '',
      state: '',
      status: 'PENDING'
    });
  };

  const activeDrivers   = drivers.filter(d => d.status?.toUpperCase() === 'APPROVED' || d.status?.toUpperCase() === 'ACTIVE').length;
  const inactiveDrivers = drivers.filter(d => d.status?.toUpperCase() !== 'APPROVED' && d.status?.toUpperCase() !== 'ACTIVE').length;

  const InfoRow = ({ label, value }) => (
    <div className="p-3 rounded-xl" style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-all">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Driver Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage driver profiles, vehicles, licenses and status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiPlus className="w-4 h-4" /> Add Driver
          </button>
          <div className="px-4 py-2.5 rounded-xl text-xs font-bold"
            style={{ background:'#eef2ff', color:'#4f46e5', border:'1px solid #c7d2fe' }}>
            {drivers.length} Drivers
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total',    value:drivers.length,  color:'#6366f1', bg:'#eef2ff', border:'#c7d2fe' },
          { label:'Active',   value:activeDrivers,   color:'#10b981', bg:'#d1fae5', border:'#6ee7b7' },
          { label:'Inactive', value:inactiveDrivers, color:'#f43f5e', bg:'#fee2e2', border:'#fca5a5' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
              {s.value}
            </div>
            <p className="text-xs font-bold text-slate-500">{s.label} Drivers</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
          <FiSearch className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            placeholder="Search by name, email, license, vehicle…"
            value={search} onChange={e=>setSearch(e.target.value)} />
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
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                  {['ID','Driver','Email','Phone','License','Vehicle','Vehicle No.','Type','Experience','Status','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.length > 0 ? pageItems.map(driver => {
                  const statusUpper = driver.status?.toUpperCase() || 'PENDING';
                  const isActive = statusUpper === 'APPROVED' || statusUpper === 'ACTIVE';
                  const vColor = VEHICLE_COLORS[driver.vehicleType] || '#64748b';
                  return (
                    <tr key={driver.id} className="table-row-hover transition-all group" style={{ borderBottom:'1px solid #f1f5f9' }}>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-400">#{driver.id}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                            style={{ background:'linear-gradient(135deg,#8b5cf6,#a78bfa)' }}>
                            {(driver.driverName||'D')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{driver.driverName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{driver.email}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{driver.phoneNumber}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">{driver.licenseNumber}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{driver.vehicleName}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{driver.vehicleNumber}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background:`${vColor}18`, color:vColor, border:`1px solid ${vColor}30` }}>
                          {driver.vehicleType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{driver.experience}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={()=>handleToggle(driver)}
                          className="flex items-center gap-1.5 transition-all hover:opacity-80">
                          {isActive
                            ? <FiToggleRight className="w-6 h-6" style={{ color:'#10b981' }} />
                            : <FiToggleLeft  className="w-6 h-6 text-slate-300" />}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            statusUpper === 'APPROVED' || statusUpper === 'ACTIVE'
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : statusUpper === 'PENDING'
                                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}>
                            {driver.status}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {[
                            { icon:FiEye,    title:'View',  fn:()=>{setSelected(driver);setViewOpen(true);}, color:'#64748b', hbg:'#f1f5f9' },
                            { icon:FiEdit2,  title:'Edit',  fn:()=>openEdit(driver),                         color:'#6366f1', hbg:'#eef2ff' },
                            { icon:FiTrash2, title:'Delete',fn:()=>handleDelete(driver.id),                  color:'#f43f5e', hbg:'#fff1f2' },
                          ].map(({icon:Icon,title,fn,color,hbg})=>(
                            <button key={title} onClick={fn} title={title}
                              className="p-1.5 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                              style={{ color }}
                              onMouseEnter={e=>e.currentTarget.style.background=hbg}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <Icon className="w-3.5 h-3.5"/>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={11} className="py-16 text-center text-slate-400 font-medium">No drivers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop:'1px solid #f1f5f9', background:'#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">{(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
                  style={{ borderColor:'#e2e8f0', color:'#64748b' }}>Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)}
                    className="w-7 h-7 text-xs font-bold rounded-lg border transition-all"
                    style={currentPage===i+1?{background:'#6366f1',borderColor:'#6366f1',color:'#fff'}:{background:'#fff',borderColor:'#e2e8f0',color:'#64748b'}}>
                    {i+1}
                  </button>
                ))}
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border disabled:opacity-40"
                  style={{ borderColor:'#e2e8f0', color:'#64748b' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={viewOpen} onClose={()=>setViewOpen(false)} title="Driver Profile" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', border:'1px solid #c4b5fd' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                style={{ background:'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
                {(selected.driverName||'D')[0].toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800">{selected.driverName}</h4>
                <p className="text-xs text-slate-500">Driver ID: #{selected.id}</p>
                <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold ${selected.status?.toUpperCase()==='ACTIVE'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selected.status?.toUpperCase()==='ACTIVE'?'bg-emerald-500':'bg-slate-400'}`}/>
                  {selected.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Email"        value={selected.email} />
              <InfoRow label="Phone"        value={selected.phoneNumber} />
              <InfoRow label="License No."  value={selected.licenseNumber} />
              <InfoRow label="Experience"   value={selected.experience} />
              <InfoRow label="Vehicle"      value={selected.vehicleName} />
              <InfoRow label="Vehicle No."  value={selected.vehicleNumber} />
              <InfoRow label="Vehicle Type" value={selected.vehicleType} />
              {selected.address && <InfoRow label="Address" value={selected.address} />}
              {selected.city    && <InfoRow label="City"    value={selected.city} />}
              {selected.state   && <InfoRow label="State"   value={selected.state} />}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={()=>setAddOpen(false)} title="Add New Driver" size="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registration / User</label>
              <select value={addForm.userId} onChange={e=>setAddForm({...addForm,userId:e.target.value})} required
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                <option value="">-- Choose User --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>
            <InputField label="License Number" type="text" value={addForm.licenseNumber} onChange={e=>setAddForm({...addForm,licenseNumber:e.target.value})} required />
            <InputField label="Vehicle Name" type="text" value={addForm.vehicleName} onChange={e=>setAddForm({...addForm,vehicleName:e.target.value})} required />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vehicle Type</label>
              <select value={addForm.vehicleType} onChange={e=>setAddForm({...addForm,vehicleType:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                {VEHICLE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <InputField label="Experience (Years)" type="number" value={addForm.experienceYears} onChange={e=>setAddForm({...addForm,experienceYears:e.target.value})} required min="0" />
            <InputField label="Address" type="text" value={addForm.address} onChange={e=>setAddForm({...addForm,address:e.target.value})} required />
            <InputField label="City" type="text" value={addForm.city} onChange={e=>setAddForm({...addForm,city:e.target.value})} required />
            <InputField label="State" type="text" value={addForm.state} onChange={e=>setAddForm({...addForm,state:e.target.value})} required />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
              <select value={addForm.status} onChange={e=>setAddForm({...addForm,status:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={()=>setAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100">Cancel</button>
            <button type="button" onClick={handleResetAddForm}
              className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 border border-slate-200">Reset</button>
            <button type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl"
              style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>Save</button>
          </div>
        </form>
      </Modal>
 
      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={()=>setEditOpen(false)} title="Edit Driver" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['Driver Name','driverName'],['Email','email'],['Phone','phoneNumber'],['License No.','licenseNumber'],['Vehicle Name','vehicleName'],['Vehicle No.','vehicleNumber'],['Experience','experience']].map(([label,key])=>(
              <InputField key={key} label={label} type="text" value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} required />
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vehicle Type</label>
              <select value={form.vehicleType||'Van'} onChange={e=>setForm({...form,vehicleType:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                {VEHICLE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
              <select value={form.status||'PENDING'} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3" style={{ borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={()=>setEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100">Cancel</button>
            <button type="button" onClick={() => {
              if (selected) {
                setForm({ ...selected, driverName: selected.driverName||'', experience: selected.experience?.replace(' Years','')||'' });
              }
            }} className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 border border-slate-200">Reset</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold text-white rounded-xl" style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
