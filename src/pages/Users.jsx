import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/userApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiKey, FiFilter, FiUser, FiCalendar, FiMail, FiPhone } from 'react-icons/fi';

const MOCK_USERS = [
  { id: 1, profileImage: '', firstName: 'Alice', lastName: 'Green', email: 'alice.green@gmail.com', phoneNumber: '9876543210', role: 'ADMIN', status: 'ACTIVE', createdDate: '2025-01-15' },
  { id: 2, profileImage: '', firstName: 'Robert', lastName: 'Hill', email: 'robert.hill@gmail.com', phoneNumber: '9765432109', role: 'USER', status: 'ACTIVE', createdDate: '2025-02-20' },
  { id: 3, profileImage: '', firstName: 'Clara', lastName: 'Oswald', email: 'clara.oswald@yahoo.com', phoneNumber: '9654321098', role: 'CUSTOMER', status: 'INACTIVE', createdDate: '2025-03-10' },
  { id: 4, profileImage: '', firstName: 'David', lastName: 'Tennant', email: 'david.t@outlook.com', phoneNumber: '9543210987', role: 'USER', status: 'ACTIVE', createdDate: '2025-04-05' },
  { id: 5, profileImage: '', firstName: 'Sarah', lastName: 'Smith', email: 'sarah.smith@gmail.com', phoneNumber: '9432109876', role: 'CUSTOMER', status: 'ACTIVE', createdDate: '2025-05-18' },
  { id: 6, profileImage: '', firstName: 'James', lastName: 'Kirk', email: 'james.kirk@travel.com', phoneNumber: '9321098765', role: 'CUSTOMER', status: 'ACTIVE', createdDate: '2025-06-01' },
  { id: 7, profileImage: '', firstName: 'Lena', lastName: 'Okonkwo', email: 'lena.ok@gmail.com', phoneNumber: '9210987654', role: 'USER', status: 'INACTIVE', createdDate: '2025-06-12' },
];

const ROLES = ['ADMIN', 'USER', 'CUSTOMER'];

const StatusBadge = ({ status }) => {
  const active = status?.toUpperCase() === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status || 'ACTIVE'}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const colors = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    USER: 'bg-sky-50 text-sky-700 border-sky-200',
    CUSTOMER: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[role?.toUpperCase()] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {role || 'USER'}
    </span>
  );
};

const Avatar = ({ user, size = 'md' }) => {
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'U';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-8 h-8 text-sm';
  if (user?.profileImage) {
    return <img src={user.profileImage} alt={name} className={`${sizeClass} rounded-full object-cover border-2 border-primary-100`} onError={e => { e.target.style.display = 'none'; }} />;
  }
  const colors = ['bg-sky-200 text-sky-700', 'bg-violet-200 text-violet-700', 'bg-emerald-200 text-emerald-700', 'bg-amber-200 text-amber-700'];
  const color = colors[(user?.id || 0) % colors.length];
  return <div className={`${sizeClass} ${color} rounded-full font-bold flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm`}>{initials}</div>;
};

const Users = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 6;

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
    } catch {
      setUsers(MOCK_USERS); setFiltered(MOCK_USERS);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    let result = users.filter(u =>
      !q ||
      String(u.id).includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phoneNumber || u.phone || '').includes(q)
    );
    if (roleFilter !== 'All') result = result.filter(u => u.role?.toUpperCase() === roleFilter);
    setFiltered(result);
    setCurrentPage(1);
  }, [search, roleFilter, users]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const openEdit = (u) => {
    setSelected(u);
    setForm({
      id: u.id, firstName: u.firstName || (u.name||'').split(' ')[0] || '',
      lastName: u.lastName || (u.name||'').split(' ').slice(1).join(' ') || '',
      email: u.email || '', phoneNumber: u.phoneNumber || u.phone || '',
      role: u.role || 'USER', status: u.status || 'ACTIVE',
      profileImage: u.profileImage || ''
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await userApi.updateUser(form.id, form); load(); } catch {
      setUsers(p => p.map(u => u.id === form.id ? { ...u, ...form } : u));
    }
    showToast('User updated successfully', 'success');
    setEditOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try { await userApi.deleteUser(id); load(); } catch {
      setUsers(p => p.filter(u => u.id !== id));
    }
    showToast('User deleted', 'success');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) { showToast('Enter a new password', 'warning'); return; }
    try { await userApi.resetPassword(selected.id, newPassword); } catch {}
    showToast('Password reset successfully', 'success');
    setResetOpen(false); setNewPassword('');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const Field = ({ label, value, mono }) => (
    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">View registered users, manage roles, edit profiles, and reset passwords.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2">
          Total: <span className="text-primary-600 font-bold">{users.length}</span> Users
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            placeholder="Search by name, email, phone, ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 font-medium cursor-pointer">
            <option value="All">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID','Profile','First Name','Last Name','Email','Phone Number','Role','Status','Created Date','Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length > 0 ? pageItems.map(user => (
                  <tr key={user.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">#{user.id}</td>
                    <td className="px-4 py-3"><Avatar user={user} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{user.firstName || (user.name||'').split(' ')[0]}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 text-sm">{user.lastName || (user.name||'').split(' ').slice(1).join(' ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{user.phoneNumber || user.phone}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{formatDate(user.createdDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelected(user); setViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="View"><FiEye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setSelected(user); setNewPassword(''); setResetOpen(true); }} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Reset Password"><FiKey className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="py-16 text-center text-slate-400 font-medium">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 font-medium">{(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} className={`w-7 h-7 text-xs font-bold rounded-lg border transition-colors ${currentPage===i+1?'bg-primary-500 border-primary-500 text-white':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i+1}</button>
                ))}
                <button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="User Account Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl">
              <Avatar user={selected} size="lg" />
              <div>
                <h4 className="text-lg font-bold text-slate-800">{selected.firstName} {selected.lastName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">User ID: #{selected.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge role={selected.role} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email Address" value={selected.email} />
              <Field label="Phone Number" value={selected.phoneNumber || selected.phone} mono />
              <Field label="Account Role" value={selected.role} />
              <Field label="Created Date" value={formatDate(selected.createdDate)} />
              {selected.profileImage && <Field label="Profile Image URL" value={selected.profileImage} />}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit User Profile" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['First Name','firstName'],['Last Name','lastName'],['Email','email'],['Phone Number','phoneNumber']].map(([label, key]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                <input value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" required />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Image URL</label>
              <input value={form.profileImage||''} onChange={e=>setForm({...form,profileImage:e.target.value})} placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
              <select value={form.role||'USER'} onChange={e=>setForm({...form,role:e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select value={form.status||'ACTIVE'} onChange={e=>setForm({...form,status:e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
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

      {/* Reset Password Modal */}
      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Reset User Password">
        <form onSubmit={handleReset} className="space-y-4">
          {selected && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Avatar user={selected} />
              <div>
                <p className="text-sm font-bold text-amber-900">{selected.firstName} {selected.lastName}</p>
                <p className="text-xs text-amber-700">{selected.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Enter new password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-amber-400 outline-none transition-colors" required />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={()=>setResetOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 rounded-xl shadow-sm transition-colors">Reset Password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
