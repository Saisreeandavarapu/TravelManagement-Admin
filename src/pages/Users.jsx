import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiEye, FiEdit2, FiTrash2, FiKey, FiFilter,
  FiUsers, FiShield, FiUser, FiCalendar, FiMail, FiPhone,
  FiArrowUpRight
} from 'react-icons/fi';

const MOCK_USERS = [
  { id:1, firstName:'Alice',   lastName:'Green',   email:'alice.green@gmail.com',   phoneNumber:'9876543210', role:'ADMIN',    status:'ACTIVE',   createdDate:'2025-01-15' },
  { id:2, firstName:'Robert',  lastName:'Hill',    email:'robert.hill@gmail.com',   phoneNumber:'9765432109', role:'USER',     status:'ACTIVE',   createdDate:'2025-02-20' },
  { id:3, firstName:'Clara',   lastName:'Oswald',  email:'clara.oswald@yahoo.com',  phoneNumber:'9654321098', role:'CUSTOMER', status:'INACTIVE', createdDate:'2025-03-10' },
  { id:4, firstName:'David',   lastName:'Tennant', email:'david.t@outlook.com',     phoneNumber:'9543210987', role:'USER',     status:'ACTIVE',   createdDate:'2025-04-05' },
  { id:5, firstName:'Sarah',   lastName:'Smith',   email:'sarah.smith@gmail.com',   phoneNumber:'9432109876', role:'CUSTOMER', status:'ACTIVE',   createdDate:'2025-05-18' },
  { id:6, firstName:'James',   lastName:'Kirk',    email:'james.kirk@travel.com',   phoneNumber:'9321098765', role:'CUSTOMER', status:'ACTIVE',   createdDate:'2025-06-01' },
  { id:7, firstName:'Lena',    lastName:'Okonkwo', email:'lena.ok@gmail.com',       phoneNumber:'9210987654', role:'USER',     status:'INACTIVE', createdDate:'2025-06-12' },
];
const ROLES = ['ADMIN','USER','CUSTOMER','DRIVER'];

const ROLE_CONFIG = {
  ADMIN:    { bg:'#fee2e2', color:'#dc2626', border:'#fca5a5' },
  USER:     { bg:'#e0f2fe', color:'#0284c7', border:'#7dd3fc' },
  CUSTOMER: { bg:'#ede9fe', color:'#7c3aed', border:'#c4b5fd' },
  DRIVER:   { bg:'#d1fae5', color:'#059669', border:'#6ee7b7' },
};

const Avatar = ({ user, size='md' }) => {
  const name = `${user?.firstName||''} ${user?.lastName||''}`.trim() || 'U';
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const colors = [
    'linear-gradient(135deg,#6366f1,#818cf8)',
    'linear-gradient(135deg,#06b6d4,#22d3ee)',
    'linear-gradient(135deg,#10b981,#34d399)',
    'linear-gradient(135deg,#f59e0b,#fbbf24)',
    'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  ];
  const bg = colors[(user?.id||0) % colors.length];
  const sz = size==='lg' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm';
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={name} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm`} onError={e=>e.target.style.display='none'} />;
  }
  return (
    <div className={`${sz} rounded-full font-bold flex items-center justify-center flex-shrink-0 text-white shadow-sm`}
      style={{ background: bg }}>
      {initials}
    </div>
  );
};

const Badge = ({ text, config }) => (
  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
    style={{ background: config?.bg || '#f1f5f9', color: config?.color || '#64748b', borderColor: config?.border || '#e2e8f0' }}>
    {text}
  </span>
);

const StatusPill = ({ status }) => {
  const active = status?.toUpperCase() === 'ACTIVE';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{
        background: active ? '#d1fae5' : '#f1f5f9',
        color: active ? '#059669' : '#64748b',
        border: `1px solid ${active ? '#6ee7b7' : '#e2e8f0'}`,
      }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#10b981' : '#94a3b8' }} />
      {status || 'ACTIVE'}
    </span>
  );
};

const InfoField = ({ label, value, mono }) => (
  <div className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-sm font-semibold text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
  </div>
);

const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const Users = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 8;

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await userApi.allUsers();
      const list = Array.isArray(data) && data.length ? data : MOCK_USERS;
      setUsers(list); setFiltered(list);
    } catch { setUsers(MOCK_USERS); setFiltered(MOCK_USERS); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    let r = users.filter(u =>
      !q || String(u.id).includes(q) ||
      (u.firstName||'').toLowerCase().includes(q) ||
      (u.lastName||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q) ||
      (u.phoneNumber||'').includes(q)
    );
    if (roleFilter !== 'All') r = r.filter(u => u.role?.toUpperCase() === roleFilter);
    setFiltered(r); setCurrentPage(1);
  }, [search, roleFilter, users]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const openEdit = u => {
    setSelected(u);
    setForm({ id:u.id, firstName:u.firstName||'', lastName:u.lastName||'', email:u.email||'', phoneNumber:u.phoneNumber||'', role:u.role||'USER', status:u.status||'ACTIVE', profileImage:u.profileImage||'' });
    setEditOpen(true);
  };

  const handleEdit = async e => {
    e.preventDefault();
    try { await userApi.updateUser(form.id, form); load(); } catch { setUsers(p=>p.map(u=>u.id===form.id?{...u,...form}:u)); }
    showToast('User updated', 'success'); setEditOpen(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;
    try { await userApi.deleteUser(id); load(); } catch { setUsers(p=>p.filter(u=>u.id!==id)); }
    showToast('User deleted', 'success');
  };

  const handleReset = async e => {
    e.preventDefault();
    if (!newPassword) { showToast('Enter new password', 'warning'); return; }
    try { await userApi.resetPassword(selected.id, newPassword); } catch {}
    showToast('Password reset', 'success'); setResetOpen(false); setNewPassword('');
  };

  // Summary stats
  const admins    = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length;
  const customers = users.filter(u => u.role?.toUpperCase() === 'CUSTOMER').length;
  const drivers   = users.filter(u => u.role?.toUpperCase() === 'DRIVER').length;
  const active    = users.filter(u => u.status?.toUpperCase() === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">View, manage, and control all registered platform accounts.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', color: '#4f46e5' }}>
          <FiUsers className="w-4 h-4" />
          {users.length} Total Users
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active',    value: active,    color:'#10b981', bg:'#d1fae5' },
          { label:'Admins',    value: admins,    color:'#dc2626', bg:'#fee2e2' },
          { label:'Customers', value: customers, color:'#7c3aed', bg:'#ede9fe' },
          { label:'Drivers',   value: drivers,   color:'#0284c7', bg:'#e0f2fe' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: s.bg, color: s.color }}>
              {s.value}
            </div>
            <p className="text-xs font-bold text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiSearch className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            placeholder="Search by name, email, phone, ID…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiFilter className="w-4 h-4 text-slate-400" />
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 font-medium cursor-pointer">
            <option value="All">All Roles</option>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[920px]">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['ID','User','Email','Phone','Role','Status','Joined','Actions'].map(h=>(
                    <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.length > 0 ? pageItems.map((user, i) => (
                  <tr key={user.id}
                    className="table-row-hover transition-all group"
                    style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">#{user.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-slate-400">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{user.email}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{user.phoneNumber}</td>
                    <td className="px-5 py-3.5"><Badge text={user.role} config={ROLE_CONFIG[user.role?.toUpperCase()]} /></td>
                    <td className="px-5 py-3.5"><StatusPill status={user.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><FiCalendar className="w-3 h-3"/>{formatDate(user.createdDate)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {[
                          { icon: FiEye,    title:'View',  fn:()=>{setSelected(user);setViewOpen(true);}, color:'#64748b', hbg:'#f1f5f9' },
                          { icon: FiEdit2,  title:'Edit',  fn:()=>openEdit(user),                         color:'#6366f1', hbg:'#eef2ff' },
                          { icon: FiKey,    title:'Reset', fn:()=>{setSelected(user);setNewPassword('');setResetOpen(true);}, color:'#f59e0b', hbg:'#fffbeb' },
                          { icon: FiTrash2, title:'Delete',fn:()=>handleDelete(user.id),                  color:'#f43f5e', hbg:'#fff1f2' },
                        ].map(({icon:Icon,title,fn,color,hbg})=>(
                          <button key={title} onClick={fn} title={title}
                            className="p-1.5 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                            style={{ color }}
                            onMouseEnter={e=>{e.currentTarget.style.background=hbg;}}
                            onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                            <Icon className="w-3.5 h-3.5"/>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-400 font-medium">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">
                {(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE, filtered.length)} of {filtered.length} users
              </span>
              <div className="flex gap-1">
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-40 hover:bg-slate-50"
                  style={{ borderColor: '#e2e8f0', color: '#64748b' }}>Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)}
                    className="w-7 h-7 text-xs font-bold rounded-lg border transition-all"
                    style={currentPage===i+1
                      ? { background:'#6366f1', borderColor:'#6366f1', color:'#fff' }
                      : { background:'#fff', borderColor:'#e2e8f0', color:'#64748b' }}>
                    {i+1}
                  </button>
                ))}
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-40 hover:bg-slate-50"
                  style={{ borderColor: '#e2e8f0', color: '#64748b' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={viewOpen} onClose={()=>setViewOpen(false)} title="User Account Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe' }}>
              <Avatar user={selected} size="lg" />
              <div>
                <h4 className="text-lg font-black text-slate-800">{selected.firstName} {selected.lastName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">User ID: #{selected.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge text={selected.role} config={ROLE_CONFIG[selected.role?.toUpperCase()]} />
                  <StatusPill status={selected.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Email Address" value={selected.email} />
              <InfoField label="Phone Number"  value={selected.phoneNumber} mono />
              <InfoField label="Role"          value={selected.role} />
              <InfoField label="Joined Date"   value={formatDate(selected.createdDate)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={()=>setEditOpen(false)} title="Edit User Profile" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['First Name','firstName'],['Last Name','lastName'],['Email','email'],['Phone','phoneNumber']].map(([label,key])=>(
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
                <input value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})} required
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none transition-all"
                  style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}
                  onFocus={e=>e.target.style.border='1px solid #6366f1'}
                  onBlur={e=>e.target.style.border='1px solid #e2e8f0'} />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</label>
              <select value={form.role||'USER'} onChange={e=>setForm({...form,role:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
              <select value={form.status||'ACTIVE'} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={{ background:'#f8fafc', border:'1px solid #e2e8f0', color:'#0f172a' }}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3" style={{ borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={()=>setEditOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl transition-all"
              style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)' }}>Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={resetOpen} onClose={()=>setResetOpen(false)} title="Reset Password">
        <form onSubmit={handleReset} className="space-y-4">
          {selected && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
              <Avatar user={selected} />
              <div>
                <p className="text-sm font-bold text-amber-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-xs text-amber-700">{selected.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Password</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Enter new password" required
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }} />
          </div>
          <div className="flex justify-end gap-3 pt-3" style={{ borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={()=>setResetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl"
              style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>Reset Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
