import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { packageApi } from '../services/packageApi';
import { imageApi } from '../services/imageApi';
import { driverApi } from '../services/driverApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye,
  FiToggleLeft, FiToggleRight, FiStar, FiMapPin,
  FiClock, FiUsers, FiGrid, FiList, FiPercent,
  FiImage, FiUploadCloud, FiChevronLeft, FiChevronRight, FiLink
} from 'react-icons/fi';

const PACKAGE_TYPES = [
  'Adventure','Beach','Heritage','Hill Station','Pilgrimage',
  'Wildlife','Luxury','Honeymoon','Family','Corporate',
];

const MOCK_PACKAGES = [
  { id: 1, packageImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', title: 'Goa Golden Beach Tour',       destination: 'Goa, India',     packageType: 'Beach',       originalPrice: 499,  discount: 10, offerPrice: 449,  duration: '5 Days / 4 Nights', availableSeats: 20, bookedSeats: 14, rating: 4.5, status: 'ACTIVE' },
  { id: 2, packageImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', title: 'Kerala Backwater Paradise',   destination: 'Kerala, India',  packageType: 'Heritage',    originalPrice: 799,  discount: 15, offerPrice: 679,  duration: '7 Days / 6 Nights', availableSeats: 15, bookedSeats: 10, rating: 4.8, status: 'ACTIVE' },
  { id: 3, packageImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', title: 'Himalayan Adventure Trek',    destination: 'Manali, India',  packageType: 'Adventure',   originalPrice: 599,  discount: 5,  offerPrice: 569,  duration: '6 Days / 5 Nights', availableSeats: 10, bookedSeats: 8,  rating: 4.7, status: 'ACTIVE' },
  { id: 4, packageImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80', title: 'Rajasthan Heritage Cruise',   destination: 'Jaipur, India',  packageType: 'Heritage',    originalPrice: 899,  discount: 20, offerPrice: 719,  duration: '8 Days / 7 Nights', availableSeats: 25, bookedSeats: 20, rating: 4.6, status: 'INACTIVE' },
  { id: 5, packageImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80', title: 'Maldives Island Escapade',    destination: 'Maldives',       packageType: 'Luxury',      originalPrice: 1499, discount: 12, offerPrice: 1319, duration: '5 Days / 4 Nights', availableSeats: 12, bookedSeats: 6,  rating: 4.9, status: 'ACTIVE' },
];

const MOCK_IMAGES_FLAT = [
  { id: 101, packageId: 1, imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { id: 102, packageId: 1, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80' },
  { id: 103, packageId: 2, imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80' },
  { id: 104, packageId: 2, imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80' },
  { id: 105, packageId: 3, imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
  { id: 106, packageId: 4, imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80' },
  { id: 107, packageId: 5, imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80' },
];

const EMPTY_FORM = {
  packageImage: '', title: '', destination: '', packageType: 'Beach',
  originalPrice: '', discount: '0', offerPrice: '', duration: '',
  availableSeats: '', bookedSeats: '0', rating: '4.5', status: 'PENDING',
  description: '', driverId: '', durationDays: '', maxPeople: ''
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg w-fit">
    <FiStar className="text-amber-500 fill-amber-400 w-3 h-3" />
    <span className="text-amber-700 font-bold text-[11px]">{Number(rating).toFixed(1)}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();
  const styles = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };
  const dots = { APPROVED: 'bg-emerald-500', PENDING: 'bg-amber-500', REJECTED: 'bg-red-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[s] || styles.PENDING}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[s] || dots.PENDING}`} />
      {s}
    </span>
  );
};

const calcOffer = (price, disc) => {
  const p = parseFloat(price || 0), d = parseFloat(disc || 0);
  return isNaN(p) ? '' : Math.round(p - (p * d) / 100).toString();
};

/* ── Image Gallery Strip ── */
const ImageStrip = ({ images, onManage }) => {
  const [idx, setIdx] = useState(0);
  const visible = images.slice(0, 6);
  const cover = visible[idx]?.imageUrl || null;

  return (
    <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
      {cover ? (
        <img src={cover} alt="package"
          className="w-full h-full object-cover transition-all duration-500"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=70'; }} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
          <FiImage className="w-10 h-10" />
          <span className="text-xs font-semibold">No images yet</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Thumbnail dots */}
      {visible.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {visible.map((img, i) => (
            <button key={img.id} onClick={() => setIdx(i)}
              className={`w-7 h-7 rounded-md overflow-hidden border-2 transition-all ${i === idx ? 'border-white scale-110 shadow-lg' : 'border-white/40 opacity-70 hover:opacity-100'}`}>
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=60&q=50'; }} />
            </button>
          ))}
          {images.length > 6 && (
            <div className="w-7 h-7 rounded-md bg-black/60 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white/40">
              +{images.length - 6}
            </div>
          )}
        </div>
      )}

      {/* Arrows */}
      {visible.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + visible.length) % visible.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all">
            <FiChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % visible.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all">
            <FiChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Photo count */}
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold">
        <FiImage className="w-3 h-3" />
        {images.length} Photo{images.length !== 1 ? 's' : ''}
      </div>

      {/* Manage button */}
      <button onClick={onManage}
        className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold hover:bg-white transition-all shadow-sm">
        <FiUploadCloud className="w-3.5 h-3.5" /> Manage
      </button>
    </div>
  );
};

/* ── Form fields ── */
const PackageFormFields = ({ form, onChange, drivers = [] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* Driver select */}
    <div className="sm:col-span-2 space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Driver</label>
      <select value={form.driverId || ''} onChange={e => onChange('driverId', e.target.value)}
        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <option value="">— Select Driver —</option>
        {drivers.map(d => (
          <option key={d.id} value={d.id}>{d.driverName || `Driver #${d.id}`}</option>
        ))}
      </select>
    </div>
    {[
      { label: 'Package Title', key: 'title', placeholder: 'e.g. Goa Beach Tour', type: 'text', required: true },
      { label: 'Original Price ($)', key: 'originalPrice', placeholder: '999', type: 'number', required: true },
      { label: 'Discount Percentage (%)', key: 'discount', placeholder: '0', type: 'number', required: false },
      { label: 'Duration (Days)', key: 'durationDays', placeholder: 'e.g. 5', type: 'number', required: true },
      { label: 'Maximum People', key: 'maxPeople', placeholder: 'e.g. 20', type: 'number', required: true },
    ].map(field => (
      <div key={field.key} className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{field.label}</label>
        <input type={field.type} value={form[field.key] || ''} onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder} required={field.required}
          min={field.type === 'number' ? '0' : undefined}
          className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
      </div>
    ))}
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Offer Price ($) <span className="text-emerald-600">(auto)</span>
      </label>
      <input value={form.offerPrice || ''} readOnly disabled
        className="w-full text-sm px-3 py-2.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 cursor-not-allowed" />
    </div>
    {/* Description textarea */}
    <div className="sm:col-span-2 space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
      <textarea value={form.description || ''} onChange={e => onChange('description', e.target.value)}
        placeholder="Describe the travel package..."
        rows={3}
        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
      <select value={form.status || 'PENDING'} onChange={e => onChange('status', e.target.value)}
        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <option value="PENDING">PENDING</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
      </select>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
const Packages = () => {
  const { showToast } = useToast();
  const [packages, setPackages]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode]   = useState('grid');
  const PER_PAGE = 6;

  const [drivers, setDrivers] = useState([]);
  const [addOpen, setAddOpen]   = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [imgOpen, setImgOpen]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [addForm, setAddForm]   = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput]   = useState('');

  // ── Normalize raw API image → uniform shape ──
  // Real API: { id, imageUrl, aPackage: { id, title, ... } }
  const normalizeImg = (img) => ({
    id: img.id,
    packageId: img.packageId ?? img.aPackage?.id ?? img.package?.id ?? null,
    imageUrl: img.imageUrl || img.image_url || img.url || '',
  });

  // ── Normalize raw API package → uniform shape ──
  // Real API: { id, title, originalPrice, discountPercentage, offerPrice, durationDays, maxPeople, status, description }
  const normalizePkg = (pkg) => ({
    ...pkg,
    title:          pkg.title || pkg.packageName || pkg.name || 'Untitled',
    destination:    pkg.destination || pkg.location || pkg.place || '',
    packageType:    pkg.packageType || pkg.type || pkg.category || 'General',
    originalPrice:  pkg.originalPrice || pkg.price || 0,
    discount:       pkg.discount ?? pkg.discountPercentage ?? 0,
    offerPrice:     pkg.offerPrice || pkg.offer_price ||
                    Math.round((pkg.originalPrice || 0) * (1 - (pkg.discountPercentage || 0) / 100)) || 0,
    duration:       pkg.duration || (pkg.durationDays ? `${pkg.durationDays} Day${pkg.durationDays !== 1 ? 's' : ''}` : 'N/A'),
    durationDays:   pkg.durationDays || (pkg.duration ? parseInt(pkg.duration) || '' : ''),
    availableSeats: pkg.availableSeats || pkg.maxPeople || pkg.seats || 0,
    maxPeople:      pkg.maxPeople || pkg.availableSeats || 0,
    bookedSeats:    pkg.bookedSeats || 0,
    rating:         pkg.rating || 0,
    status:         pkg.status || 'PENDING',
    packageImage:   pkg.packageImage || null,
    description:    pkg.description || '',
    driverId:       pkg.driverId || pkg.driver?.id || '',
  });

  const getImagesForPkg = useCallback(
    (pkgId) => allImages.filter(img => String(img.packageId) === String(pkgId)),
    [allImages]
  );

  const enrichWithImages = (pkgList, imgList) =>
    pkgList.map(pkg => ({
      ...pkg,
      packageImage:
        pkg.packageImage ||
        imgList.find(img => String(img.packageId) === String(pkg.id))?.imageUrl ||
        null,
    }));

  const load = async () => {
    setLoading(true);
    try {
      const [pkgRes, imgRes, drvRes] = await Promise.allSettled([
        packageApi.allPackages(),
        imageApi.allImages(),
        driverApi.allDrivers(),
      ]);

      const rawPkgs = pkgRes.status === 'fulfilled' && Array.isArray(pkgRes.value) && pkgRes.value.length
        ? pkgRes.value : MOCK_PACKAGES;
      const rawImgs = imgRes.status === 'fulfilled' && Array.isArray(imgRes.value) && imgRes.value.length
        ? imgRes.value : MOCK_IMAGES_FLAT;
      const rawDrivers = drvRes.status === 'fulfilled' && Array.isArray(drvRes.value)
        ? drvRes.value.map(d => ({
            ...d,
            driverName: d.driverName || (d.registration ? `${d.registration.firstName} ${d.registration.lastName}` : d.name || 'N/A')
          }))
        : [];

      setDrivers(rawDrivers);

      const pkgList = rawPkgs.map(normalizePkg);
      const imgList = rawImgs.map(normalizeImg);

      setAllImages(imgList);
      const enriched = enrichWithImages(pkgList, imgList);
      setPackages(enriched);
      setFiltered(enriched);
    } catch {
      setAllImages(MOCK_IMAGES_FLAT);
      setPackages(MOCK_PACKAGES);
      setFiltered(MOCK_PACKAGES);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reloadImages = async () => {
    try {
      const data = await imageApi.allImages();
      const rawImgs = Array.isArray(data) && data.length ? data : MOCK_IMAGES_FLAT;
      const imgList = rawImgs.map(normalizeImg);
      setAllImages(imgList);
      setPackages(prev => enrichWithImages(prev, imgList));
      setFiltered(prev => enrichWithImages(prev, imgList));
    } catch { /* keep existing */ }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(packages.filter(p =>
      !q ||
      String(p.id).includes(q) ||
      (p.title || p.packageName || '').toLowerCase().includes(q) ||
      (p.destination || '').toLowerCase().includes(q) ||
      (p.packageType || '').toLowerCase().includes(q)
    ));
    setCurrentPage(1);
  }, [search, packages]);

  const handleFormChange = (setter) => (key, val) => {
    setter(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'originalPrice' || key === 'discount')
        next.offerPrice = calcOffer(
          key === 'originalPrice' ? val : next.originalPrice,
          key === 'discount' ? val : next.discount
        );
      return next;
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await packageApi.addPackage(addForm); load(); }
    catch { setPackages(p => [{ id: Date.now(), ...addForm }, ...p]); }
    showToast('Package added successfully', 'success');
    setAddOpen(false); setAddForm(EMPTY_FORM);
  };

  const openEdit = (pkg) => {
    setSelected(pkg);
    setEditForm({ ...pkg, originalPrice: pkg.originalPrice || pkg.price || '', discount: pkg.discount || '0' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try { await packageApi.updatePackage(editForm.id, editForm); load(); }
    catch { setPackages(p => p.map(x => x.id === editForm.id ? { ...x, ...editForm } : x)); }
    showToast('Package updated', 'success');
    setEditOpen(false);
  };

  const handleToggle = async (pkg) => {
    const next = pkg.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await packageApi.updateStatus(pkg.id, next); load(); }
    catch { setPackages(p => p.map(x => x.id === pkg.id ? { ...x, status: next } : x)); }
    showToast(`Package ${next.toLowerCase()}d`, 'success');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package permanently?')) return;
    try { await packageApi.deletePackage(id); load(); }
    catch { setPackages(p => p.filter(x => x.id !== id)); }
    showToast('Package deleted', 'success');
  };

  const openImageManager = (pkg) => { setSelected(pkg); setUrlInput(''); setImgOpen(true); };

  const handleUploadFile = async (file) => {
    if (!selected) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('packageId', selected.id);
    formData.append('imageUrl', file);
    try {
      await imageApi.addImage(formData);
      showToast('Image uploaded!', 'success');
      await reloadImages();
    } catch {
      showToast('Upload failed — showing locally', 'warning');
      const localUrl = URL.createObjectURL(file);
      setAllImages(prev => [...prev, { id: Date.now(), packageId: selected.id, imageUrl: localUrl }]);
    } finally { setUploading(false); }
  };

  const handleAddUrl = async (e) => {
    e.preventDefault();
    if (!urlInput.trim() || !selected) return;
    setUploading(true);
    const payload = { packageId: selected.id, imageUrl: urlInput };
    try {
      await imageApi.addImage(payload);
      showToast('Image added via URL', 'success');
      await reloadImages();
      setUrlInput('');
    } catch {
      showToast('Saved locally (API unavailable)', 'info');
      setAllImages(prev => [...prev, { id: Date.now(), ...payload }]);
      setUrlInput('');
    } finally { setUploading(false); }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await imageApi.deleteImage(imgId);
      showToast('Image deleted', 'success');
      await reloadImages();
    } catch {
      showToast('Removed locally', 'warning');
      setAllImages(prev => prev.filter(img => img.id !== imgId));
    }
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Packages Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage packages with their photo galleries, pricing and availability.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <FiGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <FiList className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiPlus className="w-4 h-4" /> Add Package
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
          <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            placeholder="Search by title, destination, type..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <>
          {/* ── GRID ── */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.length > 0 ? pageItems.map(pkg => {
                const pkgImages = getImagesForPkg(pkg.id);
                const hasDiscount = parseFloat(pkg.discount || 0) > 0;
                return (
                  <div key={pkg.id} className="card overflow-hidden flex flex-col group relative"
                    style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
                    
                    {/* Gallery Strip */}
                    <ImageStrip images={pkgImages} onManage={() => openImageManager(pkg)} />

                    {/* Type + Discount tags (float over bottom of strip) */}
                    <div className="px-5 pt-3 pb-0 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                        {pkg.packageType}
                      </span>
                      {hasDiscount && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 flex items-center gap-0.5">
                          <FiPercent className="w-2.5 h-2.5" />{pkg.discount}% OFF
                        </span>
                      )}
                      <StatusBadge status={pkg.status} />
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{pkg.id}</span>
                          <StarRating rating={pkg.rating || 0} />
                        </div>
                        <h3 className="font-display font-bold text-slate-800 text-base line-clamp-1 mb-1">
                          {pkg.title || pkg.packageName}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                          <FiMapPin className="w-3.5 h-3.5 text-rose-500" />{pkg.destination}
                        </p>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                            <FiClock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{pkg.duration || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                            <FiUsers className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{pkg.availableSeats || 0} Seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {hasDiscount && (
                            <p className="text-[11px] text-slate-400 line-through font-mono leading-none">${pkg.originalPrice || pkg.price}</p>
                          )}
                          <p className="text-lg font-black text-emerald-600 font-mono leading-tight">${pkg.offerPrice || pkg.originalPrice}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelected(pkg); setViewOpen(true); }}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="View Details">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(pkg)}
                            className="p-2 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-colors" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggle(pkg)}
                            className="p-2 rounded-xl transition-colors hover:bg-slate-100" title="Toggle Status">
                            {pkg.status?.toUpperCase() === 'ACTIVE'
                              ? <FiToggleRight className="w-5 h-5 text-emerald-500" />
                              : <FiToggleLeft className="w-5 h-5 text-slate-300" />}
                          </button>
                          <button onClick={() => handleDelete(pkg.id)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full py-16 text-center text-slate-400 font-medium">No packages found.</div>
              )}
            </div>
          ) : (
            /* ── TABLE ── */
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1150px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['ID','Gallery','Title','Destination','Type','Price','Discount','Offer','Duration','Seats','Rating','Status','Actions'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length > 0 ? pageItems.map(pkg => {
                      const pkgImages = getImagesForPkg(pkg.id);
                      return (
                        <tr key={pkg.id} className="table-row-hover transition-colors group" style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-400">#{pkg.id}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-0.5">
                              {pkgImages.length > 0 ? (
                                <>
                                  {pkgImages.slice(0, 3).map((img, i) => (
                                    <img key={img.id} src={img.imageUrl} alt=""
                                      className="w-9 h-9 object-cover rounded-lg border-2 border-white shadow-sm"
                                      style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 10 - i }}
                                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=80&q=50'; }} />
                                  ))}
                                  {pkgImages.length > 3 && (
                                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 border-2 border-white" style={{ marginLeft: '-8px', zIndex: 1 }}>
                                      +{pkgImages.length - 3}
                                    </div>
                                  )}
                                  <button onClick={() => openImageManager(pkg)}
                                    className="ml-1 p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors" title="Manage images">
                                    <FiImage className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => openImageManager(pkg)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                  <FiPlus className="w-3 h-3" /> Add Photos
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 text-sm max-w-[160px] truncate">{pkg.title || pkg.packageName}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5 text-rose-500"/>{pkg.destination}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg">{pkg.packageType}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-slate-400 font-mono line-through">${pkg.originalPrice || pkg.price}</td>
                          <td className="px-4 py-3.5 text-xs font-bold text-amber-600 font-mono">{pkg.discount > 0 ? `${pkg.discount}%` : '—'}</td>
                          <td className="px-4 py-3.5 text-sm font-black text-emerald-600 font-mono">${pkg.offerPrice || pkg.originalPrice}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5 text-slate-400"/>{pkg.duration}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1"><FiUsers className="w-3.5 h-3.5 text-slate-400"/>{pkg.availableSeats}</span>
                          </td>
                          <td className="px-4 py-3.5"><StarRating rating={pkg.rating || 0}/></td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => handleToggle(pkg)} className="flex items-center gap-1.5">
                              {pkg.status?.toUpperCase() === 'ACTIVE'
                                ? <FiToggleRight className="w-6 h-6 text-emerald-500"/>
                                : <FiToggleLeft className="w-6 h-6 text-slate-300"/>}
                              <StatusBadge status={pkg.status}/>
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setSelected(pkg); setViewOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"><FiEye className="w-3.5 h-3.5"/></button>
                              <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-colors"><FiEdit2 className="w-3.5 h-3.5"/></button>
                              <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"><FiTrash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={13} className="py-16 text-center text-slate-400 font-medium">No packages found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-medium">{(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length} packages</span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage === i + 1 ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View Modal ── */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Package Details" size="lg">
        {selected && (() => {
          const pkgImages = getImagesForPkg(selected.id);
          return (
            <div className="space-y-4">
              {pkgImages.length > 0 && (
                <div className="rounded-2xl overflow-hidden h-52">
                  <ImageStrip images={pkgImages} onManage={() => { setViewOpen(false); openImageManager(selected); }} />
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">{selected.title || selected.packageName}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><FiMapPin className="w-4 h-4 text-rose-500"/>{selected.destination}</p>
                </div>
                <StatusBadge status={selected.status}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Type', selected.packageType], ['Duration', selected.duration],
                  ['Original', `$${selected.originalPrice || selected.price}`], ['Discount', `${selected.discount}%`],
                  ['Offer Price', `$${selected.offerPrice}`], ['Seats Available', selected.availableSeats],
                  ['Booked Seats', selected.bookedSeats], ['Rating', `${selected.rating} / 5`],
                  ['Gallery Photos', `${pkgImages.length} image${pkgImages.length !== 1 ? 's' : ''}`],
                ].map(([l, v]) => (
                  <div key={l} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{l}</p>
                    <p className="text-sm font-semibold text-slate-800">{v || '—'}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setViewOpen(false); openImageManager(selected); }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                <FiImage className="w-4 h-4"/> Manage Package Images
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* ── Add Modal ── */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Tour Package" size="xl">
        <form onSubmit={handleAdd} className="space-y-4">
          <PackageFormFields form={addForm} onChange={handleFormChange(setAddForm)} drivers={drivers} />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="button" onClick={() => setAddForm(EMPTY_FORM)} className="px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Reset</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">Save</button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Package" size="xl">
        <form onSubmit={handleEdit} className="space-y-4">
          <PackageFormFields form={editForm} onChange={handleFormChange(setEditForm)} drivers={drivers} />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="button" onClick={() => setEditForm(prev => ({ ...EMPTY_FORM, id: prev.id }))} className="px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">Reset</button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-sm transition-colors">Save</button>
          </div>
        </form>
      </Modal>

      {/* ── Manage Images Modal ── */}
      <Modal isOpen={imgOpen} onClose={() => setImgOpen(false)}
        title={`📸 Images — ${selected?.title || selected?.packageName || ''}`} size="2xl">
        {selected && (() => {
          const pkgImages = getImagesForPkg(selected.id);
          return (
            <div className="space-y-6">
              {/* Uploaders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Image File</p>
                  <div onClick={() => document.getElementById('pkg-img-file').click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 min-h-[130px] transition-all">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="sm"/>
                        <span className="text-xs font-semibold text-slate-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <FiUploadCloud className="w-8 h-8 text-slate-300 mb-2"/>
                        <p className="text-xs font-bold text-slate-600">Click to upload</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, JPEG</p>
                      </>
                    )}
                    <input type="file" id="pkg-img-file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleUploadFile(e.target.files[0])}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add via Image URL</p>
                  <form onSubmit={handleAddUrl} className="space-y-3">
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <FiLink className="text-slate-400 w-4 h-4 flex-shrink-0"/>
                      <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="bg-transparent outline-none text-sm w-full text-slate-800 placeholder-slate-400" required/>
                    </div>
                    {urlInput && (
                      <img src={urlInput} alt="preview" className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        onError={e => e.target.style.display = 'none'}/>
                    )}
                    <button type="submit" disabled={uploading || !urlInput.trim()}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {uploading ? 'Adding...' : 'Add Image URL'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Gallery ({pkgImages.length} image{pkgImages.length !== 1 ? 's' : ''})
                  </p>
                </div>
                {pkgImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {pkgImages.map(img => (
                      <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                        <img src={img.imageUrl} alt="Gallery"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&q=60'; }}/>
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleDeleteImage(img.id)}
                            className="p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-lg">
                            <FiTrash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FiImage className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                    <p className="text-sm text-slate-400 font-semibold">No images yet for this package.</p>
                    <p className="text-xs text-slate-400 mt-1">Upload a file or paste an image URL above.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Packages;
