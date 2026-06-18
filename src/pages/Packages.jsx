import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { packageApi } from '../services/packageApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye,
  FiToggleLeft, FiToggleRight, FiStar, FiMapPin,
  FiDollarSign, FiPercent, FiClock, FiUsers
} from 'react-icons/fi';

const PACKAGE_TYPES = ['Adventure', 'Beach', 'Heritage', 'Hill Station', 'Pilgrimage', 'Wildlife', 'Luxury', 'Honeymoon', 'Family', 'Corporate'];

const MOCK_PACKAGES = [
  { id: 1, packageImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=70', title: 'Goa Golden Beach Tour', destination: 'Goa, India', packageType: 'Beach', originalPrice: 499, discount: 10, offerPrice: 449, duration: '5 Days / 4 Nights', availableSeats: 20, bookedSeats: 14, rating: 4.5, status: 'ACTIVE' },
  { id: 2, packageImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=70', title: 'Kerala Backwater Paradise', destination: 'Kerala, India', packageType: 'Heritage', originalPrice: 799, discount: 15, offerPrice: 679, duration: '7 Days / 6 Nights', availableSeats: 15, bookedSeats: 10, rating: 4.8, status: 'ACTIVE' },
  { id: 3, packageImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=70', title: 'Himalayan Adventure Trek', destination: 'Manali, India', packageType: 'Adventure', originalPrice: 599, discount: 5, offerPrice: 569, duration: '6 Days / 5 Nights', availableSeats: 10, bookedSeats: 8, rating: 4.7, status: 'ACTIVE' },
  { id: 4, packageImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=70', title: 'Rajasthan Heritage Cruise', destination: 'Jaipur, India', packageType: 'Heritage', originalPrice: 899, discount: 20, offerPrice: 719, duration: '8 Days / 7 Nights', availableSeats: 25, bookedSeats: 20, rating: 4.6, status: 'INACTIVE' },
  { id: 5, packageImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=400&q=70', title: 'Maldives Island Escapade', destination: 'Maldives', packageType: 'Luxury', originalPrice: 1499, discount: 12, offerPrice: 1319, duration: '5 Days / 4 Nights', availableSeats: 12, bookedSeats: 6, rating: 4.9, status: 'ACTIVE' },
];

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1">
    <span className="text-amber-400 font-bold text-xs">{Number(rating).toFixed(1)}</span>
    <div className="flex">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const active = status?.toUpperCase() === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status || 'ACTIVE'}
    </span>
  );
};

const EMPTY_FORM = { packageImage: '', title: '', destination: '', packageType: 'Beach', originalPrice: '', discount: '0', offerPrice: '', duration: '', availableSeats: '', bookedSeats: '0', rating: '4.5', status: 'ACTIVE' };

const Packages = () => {
  const { showToast } = useToast();
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 6;

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await packageApi.allPackages();
      const list = Array.isArray(data) && data.length ? data : MOCK_PACKAGES;
      setPackages(list); setFiltered(list);
    } catch {
      setPackages(MOCK_PACKAGES); setFiltered(MOCK_PACKAGES);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(packages.filter(p =>
      !q || String(p.id).includes(q) ||
      (p.title || p.packageName || '').toLowerCase().includes(q) ||
      (p.destination || '').toLowerCase().includes(q) ||
      (p.packageType || '').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, packages]);

  // Auto-calculate offer price
  const calcOffer = (price, disc) => {
    const p = parseFloat(price || 0), d = parseFloat(disc || 0);
    return isNaN(p) ? '' : Math.round(p - (p * d) / 100).toString();
  };

  const handleAddChange = (key, val) => {
    const next = { ...addForm, [key]: val };
    if (key === 'originalPrice' || key === 'discount') next.offerPrice = calcOffer(key === 'originalPrice' ? val : next.originalPrice, key === 'discount' ? val : next.discount);
    setAddForm(next);
  };
  const handleEditChange = (key, val) => {
    const next = { ...editForm, [key]: val };
    if (key === 'originalPrice' || key === 'discount') next.offerPrice = calcOffer(key === 'originalPrice' ? val : next.originalPrice, key === 'discount' ? val : next.discount);
    setEditForm(next);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await packageApi.addPackage(addForm); load(); } catch {
      setPackages(p => [{ id: Date.now(), ...addForm }, ...p]);
    }
    showToast('Package added successfully', 'success');
    setAddOpen(false); setAddForm(EMPTY_FORM);
  };

  const openEdit = (pkg) => {
    setSelected(pkg);
    const base = { ...pkg, originalPrice: pkg.originalPrice || pkg.price || '', discount: pkg.discount || '0', offerPrice: pkg.offerPrice || '' };
    setEditForm(base);
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await packageApi.updatePackage(editForm.id, editForm); load(); } catch {
      setPackages(p => p.map(x => x.id === editForm.id ? { ...x, ...editForm } : x));
    }
    showToast('Package updated', 'success');
    setEditOpen(false);
  };

  const handleToggle = async (pkg) => {
    const next = pkg.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await packageApi.updateStatus(pkg.id, next); load(); } catch {
      setPackages(p => p.map(x => x.id === pkg.id ? { ...x, status: next } : x));
    }
    showToast(`Package ${next.toLowerCase()}`, 'success');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try { await packageApi.deletePackage(id); load(); } catch {
      setPackages(p => p.filter(x => x.id !== id));
    }
    showToast('Package deleted', 'success');
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const PackageFormFields = ({ form, onChange }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package Image URL</label>
        <input value={form.packageImage||''} onChange={e=>onChange('packageImage',e.target.value)} placeholder="https://images.unsplash.com/..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
        {form.packageImage && <img src={form.packageImage} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200" onError={e=>e.target.style.display='none'} />}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package Title</label>
        <input value={form.title||''} onChange={e=>onChange('title',e.target.value)} placeholder="e.g. Goa Beach Tour" required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
        <input value={form.destination||''} onChange={e=>onChange('destination',e.target.value)} placeholder="e.g. Goa, India" required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package Type</label>
        <select value={form.packageType||'Beach'} onChange={e=>onChange('packageType',e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
          {PACKAGE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</label>
        <input value={form.duration||''} onChange={e=>onChange('duration',e.target.value)} placeholder="e.g. 5 Days / 4 Nights"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Price ($)</label>
        <input type="number" value={form.originalPrice||''} onChange={e=>onChange('originalPrice',e.target.value)} placeholder="999" required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount (%)</label>
        <input type="number" value={form.discount||'0'} onChange={e=>onChange('discount',e.target.value)} min="0" max="100"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offer Price ($) <span className="text-emerald-600 font-semibold">(auto)</span></label>
        <input value={form.offerPrice||''} readOnly disabled
          className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700 cursor-not-allowed" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Seats</label>
        <input type="number" value={form.availableSeats||''} onChange={e=>onChange('availableSeats',e.target.value)} placeholder="20"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booked Seats</label>
        <input type="number" value={form.bookedSeats||'0'} onChange={e=>onChange('bookedSeats',e.target.value)} min="0"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating (0-5)</label>
        <input type="number" value={form.rating||'4.5'} onChange={e=>onChange('rating',e.target.value)} min="0" max="5" step="0.1"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none transition-colors" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
        <select value={form.status||'ACTIVE'} onChange={e=>onChange('status',e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Packages Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Publish tours, configure pricing, discounts, seats and availability.</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-primary-600 transition-all active:scale-[0.98]">
          <FiPlus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            placeholder="Search by title, destination, type..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID','Image','Title','Destination','Type','Original Price','Discount','Offer Price','Duration','Avail. Seats','Booked','Rating','Status','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length > 0 ? pageItems.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">#{pkg.id}</td>
                    <td className="px-4 py-3">
                      {pkg.packageImage
                        ? <img src={pkg.packageImage} alt={pkg.title} className="w-14 h-10 object-cover rounded-lg border border-slate-200" onError={e=>e.target.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&q=60'} />
                        : <div className="w-14 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 text-xs">No img</div>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-sm max-w-[160px]">
                      <p className="truncate">{pkg.title || pkg.packageName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 text-rose-400"/>{pkg.destination}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg border border-sky-100">{pkg.packageType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500 font-mono line-through">${pkg.originalPrice || pkg.price}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-600">{pkg.discount > 0 ? `${pkg.discount}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 font-mono">${pkg.offerPrice}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1"><FiClock className="w-3 h-3 text-slate-400"/>{pkg.duration || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1"><FiUsers className="w-3 h-3 text-slate-400"/>{pkg.availableSeats || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{pkg.bookedSeats ?? '—'}</td>
                    <td className="px-4 py-3"><StarRating rating={pkg.rating || 0} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(pkg)} className="flex items-center gap-1.5">
                        {pkg.status?.toUpperCase() === 'ACTIVE'
                          ? <FiToggleRight className="w-6 h-6 text-emerald-500"/>
                          : <FiToggleLeft className="w-6 h-6 text-slate-300"/>}
                        <StatusBadge status={pkg.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>{setSelected(pkg);setViewOpen(true);}} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="View"><FiEye className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>openEdit(pkg)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>handleDelete(pkg.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={14} className="py-16 text-center text-slate-400 font-medium">No packages found.</td></tr>
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
      <Modal isOpen={viewOpen} onClose={()=>setViewOpen(false)} title="Package Details" size="lg">
        {selected && (
          <div className="space-y-4">
            {selected.packageImage && <img src={selected.packageImage} alt={selected.title} className="w-full h-48 object-cover rounded-2xl border border-slate-200" onError={e=>e.target.style.display='none'} />}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selected.title || selected.packageName}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><FiMapPin className="w-4 h-4 text-rose-400"/>{selected.destination}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Package Type',selected.packageType],['Duration',selected.duration],['Original Price',`$${selected.originalPrice||selected.price}`],['Discount',`${selected.discount}%`],['Offer Price',`$${selected.offerPrice}`],['Available Seats',selected.availableSeats],['Booked Seats',selected.bookedSeats],['Rating',`${selected.rating} / 5`]].map(([l,v])=>(
                <div key={l} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{l}</p>
                  <p className="text-sm font-semibold text-slate-800">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={()=>setAddOpen(false)} title="Add New Tour Package" size="xl">
        <form onSubmit={handleAdd} className="space-y-4">
          <PackageFormFields form={addForm} onChange={handleAddChange} />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={()=>setAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-sm transition-colors">Add Package</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={()=>setEditOpen(false)} title="Edit Package Details" size="xl">
        <form onSubmit={handleEdit} className="space-y-4">
          <PackageFormFields form={editForm} onChange={handleEditChange} />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={()=>setEditOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-sm transition-colors">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Packages;
