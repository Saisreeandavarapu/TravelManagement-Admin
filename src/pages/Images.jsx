import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { imageApi } from '../services/imageApi';
import { packageApi } from '../services/packageApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiLink, FiExternalLink, FiImage, FiGrid, FiList } from 'react-icons/fi';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const PER_PAGE = 12; // grid handles more images nicely

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
    const urls = addForm.imageUrl.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    try {
      for (const url of urls) {
        const payload = { packageId: addForm.packageId, packageName: getPackageName(addForm.packageId), imageUrl: url };
        await imageApi.addImage(payload);
      }
      await loadAll();
      showToast('Images added successfully', 'success');
    } catch {
      const newItems = urls.map((url, i) => ({
        id: Date.now() + i,
        packageId: addForm.packageId,
        packageName: getPackageName(addForm.packageId),
        imageUrl: url
      }));
      setImages(p => [...newItems, ...p]);
      showToast('Images added locally', 'success');
    } finally {
      setAddOpen(false);
      setAddForm({ packageId: '', imageUrl: '' });
      setUploading(false);
    }
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
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Package Images</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage photo gallery linked to travel packages.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Gallery view"><FiGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Table list"><FiList className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiPlus className="w-4 h-4" /> Add Image
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full placeholder-slate-450 text-slate-705"
            placeholder="Search by package, image URL, image ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            /* Gallery / Grid View */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {pageItems.length > 0 ? pageItems.map(img => (
                <div key={img.id} className="card overflow-hidden group relative flex flex-col justify-between">
                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-100">
                    <img src={img.imageUrl} alt="preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&q=70'; }} />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a href={img.imageUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/95 rounded-xl text-slate-700 hover:text-indigo-600 transition-all shadow-md">
                        <FiExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100">
                    <p className="text-[10px] font-bold text-indigo-600 font-mono mb-1">#{img.packageId || 'No ID'}</p>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-3">{img.packageName || getPackageName(img.packageId)}</p>
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-50">
                      <button onClick={() => openEdit(img)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(img.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium">
                  <FiImage className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                  No images found.
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['ID', 'Package ID', 'Package Name', 'Image Preview', 'Image URL', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length > 0 ? pageItems.map(img => (
                      <tr key={img.id} className="table-row-hover transition-colors group" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">#{img.id}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-600">#{img.packageId}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-sm max-w-[200px] truncate">{img.packageName || getPackageName(img.packageId)}</td>
                        <td className="px-4 py-3">
                          <img src={img.imageUrl} alt="preview" className="w-16 h-11 object-cover rounded-lg border border-slate-200 shadow-sm cursor-pointer"
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&q=60'; }} />
                        </td>
                        <td className="px-4 py-3 max-w-[250px] truncate font-mono text-xs text-slate-500">{img.imageUrl}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(img)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(img.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete"><FiTrash2 className="w-3.5 h-3.5" /></button>
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
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">{(currentPage-1)*PER_PAGE+1}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length} images</span>
              <div className="flex gap-1">
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i} onClick={()=>setCurrentPage(i+1)} className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage===i+1?'bg-indigo-500 border-indigo-500 text-white':'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i+1}</button>
                ))}
                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Package Image">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Package</label>
            <select value={addForm.packageId} onChange={e => setAddForm({ ...addForm, packageId: e.target.value })} required
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <option value="">-- Select Package --</option>
              {packages.map(p => <option key={p.id} value={p.id}>#{p.id} – {p.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Image (Multiple Images - URL per line/comma)</label>
            <div className="flex gap-2 rounded-xl px-3 py-2.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <FiLink className="text-slate-450 w-4 h-4 flex-shrink-0 mt-1" />
              <textarea value={addForm.imageUrl} onChange={e => setAddForm({ ...addForm, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/photo1&#10;https://images.unsplash.com/photo2" required rows={3}
                className="bg-transparent outline-none text-sm w-full text-slate-800 placeholder-slate-450 resize-none font-mono text-xs" />
            </div>
          </div>
          {addForm.imageUrl && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preview (First Image)</label>
              <img src={addForm.imageUrl.split(/[\n,]+/)[0]} alt="preview" className="w-full h-40 object-cover rounded-xl border border-slate-200"
                onError={e => e.target.style.display = 'none'} />
            </div>
          )}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="button" onClick={() => setAddForm({ packageId: '', imageUrl: '' })} className="px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Reset</button>
            <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors disabled:opacity-60">
              {uploading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Upload
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Image Details">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Package</label>
            <select value={editForm.packageId} onChange={e => setEditForm({ ...editForm, packageId: e.target.value })}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <option value="">-- Select Package --</option>
              {packages.map(p => <option key={p.id} value={p.id}>#{p.id} – {p.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Image</label>
            <input type="url" value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} required
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none font-mono text-xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
          {editForm.imageUrl && (
            <img src={editForm.imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-slate-200"
              onError={e => e.target.style.display = 'none'} />
          )}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="button" onClick={() => setEditForm({ id: editForm.id, packageId: '', imageUrl: '' })} className="px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Reset</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Images;
