import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { packageApi } from '../../services/packageApi';
import { driverApi } from '../../services/driverApi';
import Spinner from '../../components/Spinner';
import {
  FiPackage, FiMapPin, FiClock, FiUsers, FiPlus, FiX,
  FiCheck, FiArrowRight, FiPercent, FiUploadCloud,
  FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiStar, FiTag
} from 'react-icons/fi';

const PACKAGE_TYPES = [
  'Adventure', 'Beach', 'Heritage', 'Hill Station', 'Pilgrimage',
  'Wildlife', 'Luxury', 'Honeymoon', 'Family', 'Corporate'
];

const StatusBadge = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();
  const map = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACTIVE:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[s] || map.PENDING}`}>
      {s === 'APPROVED' || s === 'ACTIVE' ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertTriangle className="w-3 h-3" />}
      {s}
    </span>
  );
};

const DriverPackagesAdd = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myPackages, setMyPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [packageType, setPackageType] = useState('Beach');
  const [duration, setDuration] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [availableSeats, setAvailableSeats] = useState('');
  const [maxPeople, setMaxPeople] = useState('');
  const [description, setDescription] = useState('');
  const [packageImage, setPackageImage] = useState('');

  const resolveAndLoad = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      if (!user?.id) return;
      const list = await driverApi.allDrivers();
      const matched = list.find(d => d.registration?.id === user.id || String(d.registration?.id) === String(user.id));
      if (matched) {
        setDriverId(matched.id);
        // Load all packages for this driver
        const allPkgs = await packageApi.allPackages().catch(() => []);
        const mine = (Array.isArray(allPkgs) ? allPkgs : []).filter(p =>
          String(p.driverId) === String(matched.id) || p.driver?.id === matched.id
        );
        mine.sort((a, b) => b.id - a.id);
        setMyPackages(mine);
      } else {
        showToast('Driver profile not found. Please complete your profile first.', 'warning');
      }
    } catch {
      showToast('Could not load packages.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) resolveAndLoad();
    else setLoading(false);
  }, [user]);

  const offerPrice = Math.round(
    parseFloat(originalPrice || 0) -
    (parseFloat(originalPrice || 0) * parseFloat(discount || 0)) / 100
  ).toString();

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!driverId) { showToast('Cannot submit. Driver profile not resolved.', 'error'); return; }
    if (!title || !destination || !originalPrice || !availableSeats) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        destination: destination.trim(),
        packageType,
        originalPrice: parseFloat(originalPrice),
        discount: parseFloat(discount),
        offerPrice: parseFloat(offerPrice),
        duration: duration || '5 Days / 4 Nights',
        availableSeats: parseInt(availableSeats),
        bookedSeats: 0,
        rating: 5.0,
        status: 'PENDING',
        description: description.trim(),
        packageImage: packageImage.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
        driverId,
        driver: { id: driverId },
        durationDays: parseInt(duration.split(' ')[0]) || 5,
        maxPeople: parseInt(maxPeople) || 12
      };
      await packageApi.addPackage(payload);
      showToast('Package submitted! Awaiting admin approval.', 'success');
      // Reset form
      setTitle(''); setDestination(''); setPackageType('Beach');
      setDuration(''); setOriginalPrice(''); setDiscount('0');
      setAvailableSeats(''); setMaxPeople(''); setDescription(''); setPackageImage('');
      setShowForm(false);
      resolveAndLoad(true);
    } catch (err) {
      showToast(err.message || 'Failed to submit package.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[400px]"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display">My Packages</h1>
          <p className="text-xs text-slate-450 mt-0.5">Manage your tour packages and add new ones for travellers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => resolveAndLoad(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${showForm ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}`}>
            {showForm ? <><FiX className="w-3.5 h-3.5" /> Close Form</> : <><FiPlus className="w-3.5 h-3.5" /> Add New Package</>}
          </button>
        </div>
      </div>

      {/* Add Package Form (collapsible) */}
      {showForm && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
          <h2 className="text-base font-black text-slate-800 font-display mb-5 pb-3 border-b flex items-center gap-2">
            <FiPlus className="text-emerald-500" /> Configure New Package
          </h2>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            {/* Package Basics */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 border-b pb-2">1. Package Essentials</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Package Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Goa Golden Beach Tour"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Destination</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <FiMapPin className="absolute left-3.5 text-slate-400 w-4 h-4" />
                    <input type="text" required value={destination} onChange={e => setDestination(e.target.value)}
                      placeholder="e.g. Goa, India" className="w-full text-sm pl-10 pr-4 py-2.5 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Package Category</label>
                  <select value={packageType} onChange={e => setPackageType(e.target.value)}
                    className="w-full text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none cursor-pointer">
                    {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Duration</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <FiClock className="absolute left-3.5 text-slate-400 w-4 h-4" />
                    <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
                      placeholder="e.g. 5 Days / 4 Nights" className="w-full text-sm pl-10 pr-4 py-2.5 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Max Travellers Capacity</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <FiUsers className="absolute left-3.5 text-slate-400 w-4 h-4" />
                    <input type="number" min="1" value={maxPeople} onChange={e => setMaxPeople(e.target.value)}
                      placeholder="e.g. 12" className="w-full text-sm pl-10 pr-4 py-2.5 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Seats */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 border-b pb-2">2. Seat Availability & Pricing (₹)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Original Price (₹)</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                    <input type="number" required min="1" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                      placeholder="4999" className="w-full text-sm pl-8 pr-4 py-2.5 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Discount (%)</label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <FiPercent className="absolute left-3.5 text-slate-400 w-4 h-4" />
                    <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)}
                      placeholder="10" className="w-full text-sm pl-10 pr-4 py-2.5 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Seats Capacity</label>
                  <input type="number" required min="1" value={availableSeats} onChange={e => setAvailableSeats(e.target.value)}
                    placeholder="20" className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 outline-none" />
                </div>
              </div>
              {originalPrice && (
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Traveller Offer Price</p>
                    <p className="text-[10px] text-slate-400">(₹{originalPrice} − {discount}% discount)</p>
                  </div>
                  <p className="text-2xl font-black text-slate-850">₹{offerPrice}</p>
                </div>
              )}
            </div>

            {/* Media & Description */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 border-b pb-2">3. Media & Description</h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Cover Image URL</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                  <FiUploadCloud className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  <input type="url" value={packageImage} onChange={e => setPackageImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo..." className="w-full text-sm pl-10 pr-4 py-2.5 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Package Description</label>
                <textarea rows="4" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Give a descriptive itinerary or list lodging and amenities..."
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none focus:border-emerald-500" />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
              {submitting ? 'Submitting Package...' : 'Publish Tour Package'} <FiArrowRight />
            </button>
          </form>
        </div>
      )}

      {/* My Packages List */}
      {myPackages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <FiPackage className="w-8 h-8 text-slate-300" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-bold text-base">No Packages Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Click "Add New Package" above to create your first travel package and start accepting bookings.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {myPackages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              {/* Package Image */}
              <div className="relative h-36 overflow-hidden bg-slate-100">
                <img
                  src={pkg.packageImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=70'}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=70'; }}
                />
                <div className="absolute top-3 left-3"><StatusBadge status={pkg.status} /></div>
                <div className="absolute top-3 right-3">
                  <span className="bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {pkg.packageType || 'Tour'}
                  </span>
                </div>
              </div>

              {/* Package Info */}
              <div className="p-4 flex flex-col flex-1 space-y-3">
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm leading-tight">{pkg.title}</h3>
                  <p className="text-[11px] text-slate-450 flex items-center gap-1 mt-0.5">
                    <FiMapPin className="w-3 h-3 text-cyan-500" /> {pkg.destination}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> {pkg.duration || 'N/A'}</span>
                  <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" /> {pkg.availableSeats} seats</span>
                  <span className="flex items-center gap-1"><FiStar className="w-3 h-3 text-amber-400" /> {pkg.rating || '5.0'}</span>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    {pkg.discount > 0 && (
                      <p className="text-[10px] text-slate-400 line-through leading-none">₹{Number(pkg.originalPrice).toLocaleString('en-IN')}</p>
                    )}
                    <p className="text-base font-black text-slate-800">₹{Number(pkg.offerPrice || pkg.originalPrice || 0).toLocaleString('en-IN')}</p>
                  </div>
                  {pkg.discount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <FiTag className="w-3 h-3" /> {pkg.discount}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverPackagesAdd;
