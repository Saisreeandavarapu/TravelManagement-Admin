import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { imageApi } from '../services/imageApi';
import { packageApi } from '../services/packageApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiLink, FiUpload, FiExternalLink, FiImage } from 'react-icons/fi';

const MOCK_IMAGES = [
  { id: 1, packageId: 1, packageName: 'Goa Golden Beach Tour', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70' },
  { id: 2, packageId: 2, packageName: 'Kerala Backwater Paradise', imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=70' },
  { id: 3, packageId: 3, packageName: 'Himalayan Adventure Trek', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=70' },
  { id: 4, packageId: 4, packageName: 'Rajasthan Heritage Cruise', imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=70' },
  { id: 5, packageId: 5, packageName: 'Maldives Island Escapade', imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=70' },
];

const MOCK_PACKAGES = [
  { id: 1, title: 'Goa Golden Beach Tour' },
  { id: 2, title: 'Kerala Backwater Paradise' },
  { id: 3, title: 'Himalayan Adventure Trek' },
  { id: 4, title: 'Rajasthan Heritage Cruise' },
  { id: 5, title: 'Maldives Island Escapade' },
];

const Images = () => {
  const { showToast } = useToast();
  const [images, setImages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 8;

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [addForm, setAddForm] = useState({ packageId: '', imageUrl: '' });
  const [editForm, setEditForm] = useState({ id: '', packageId: '', imageUrl: '' });

  useEffect(() => {
    loadAll();
    packageApi.allPackages()
      .then(d => setPackages(Array.isArray(d) && d.length ? d.map(p => ({ id: p.id, title: p.title || p.packageName })) : MOCK_PACKAGES))
      .catch(() => setPackages(MOCK_PACKAGES));
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await imageApi.allImages();
      const list = Array.isArray(data) && data.length ? data : MOCK_IMAGES;
      setImages(list); setFiltered(list);
    } catch {
      setImages(MOCK_IMAGES); setFiltered(MOCK_IMAGES);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(images.filter(img =>
      !q || String(img.id).includes(q) ||
      String(img.packageId).includes(q) ||
      (img.packageName || '').toLowerCase().includes(q) ||
      (img.imageUrl || '').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, images]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const getPackageName = (id) => packages.find(p => String(p.id) === String(id))?.title || `Package #${id}`;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.packageId || !addForm.imageUrl.trim()) { showToast('Fill all fields', 'warning'); return; }
    setUploading(true);
    const payload = { packageId: addForm.packageId, packageName: getPackageName(addForm.packageId), imageUrl: addForm.imageUrl };
    try { await imageApi.addImage(payload); loadAll(); } catch {
      setImages(p => [{ id: Date.now(), ...payload }, ...p]);
    }
    showToast('Image added successfully', 'success');
    setAddOpen(false); setAddForm({ packageId: '', imageUrl: '' }); setUploading(false);
  };

  const openEdit = (img) => {
    setSelected(img);
    setEditForm({ id: img.id, packageId: String(img.packageId || ''), imageUrl: img.imageUrl || '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = { ...editForm, packageName: getPackageName(editForm.packageId) };
    try { await imageApi.updateImage(editForm.id, payload); loadAll(); } catch {
      setImages(p => p.map(x => x.id === editForm.id ? { ...x, ...payload } : x));
    }
    showToast('Image updated', 'success'); setEditOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image record?')) return;
    try { await imageApi.deleteImage(id); loadAll(); } catch {
      setImages(p => p.filter(x => x.id !== id));
    }
    showToast('Image deleted', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Package Images</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage photo gallery linked to travel packages.</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-primary-600 transition-all active:scale-[0.98]">
          <FiPlus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-700"
            placeholder="Search by image ID, package ID, package name, URL..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Package ID', 'Package Name', 'Image Preview', 'Image URL', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length > 0 ? pageItems.map(img => (
                  <tr key={img.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">#{img.id}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-600">#{img.packageId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-sm max-w-[180px]">
                      <p className="truncate">{img.packageName || getPackageName(img.packageId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative group/img">
                        <img
                          src={img.imageUrl}
                          alt="preview"
                          className="w-20 h-14 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&q=60'; }}
                        />
                        <a href={img.imageUrl} target="_blank" rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity">
                          <FiExternalLink className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-xs text-slate-500 font-mono truncate" title={img.imageUrl}>{img.imageUrl}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(img)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(img.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <FiImage className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-medium">No images found.</p>
                    </td>
                  </tr>
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

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Package Image">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Package</label>
            <select value={addForm.packageId} onChange={e => setAddForm({ ...addForm, packageId: e.target.value })} required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
              <option value="">-- Select Package --</option>
              {packages.map(p => <option key={p.id} value={p.id}>#{p.id} – {p.title}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image URL</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-primary-400 transition-all">
              <FiLink className="text-slate-400 w-4 h-4 flex-shrink-0" />
              <input type="url" value={addForm.imageUrl} onChange={e => setAddForm({ ...addForm, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/..." required
                className="bg-transparent outline-none text-sm w-full text-slate-800 placeholder-slate-400" />
            </div>
          </div>
          {addForm.imageUrl && (
            <img src={addForm.imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-slate-200"
              onError={e => e.target.style.display = 'none'} />
          )}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-sm transition-colors disabled:opacity-60">
              {uploading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Image
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Image Details">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Package</label>
            <select value={editForm.packageId} onChange={e => setEditForm({ ...editForm, packageId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none cursor-pointer">
              <option value="">-- Select Package --</option>
              {packages.map(p => <option key={p.id} value={p.id}>#{p.id} – {p.title}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image URL</label>
            <input type="url" value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 outline-none font-mono text-xs" />
          </div>
          {editForm.imageUrl && (
            <img src={editForm.imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-slate-200"
              onError={e => e.target.style.display = 'none'} />
          )}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-sm transition-colors">Update Image</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Images;
