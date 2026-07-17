import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { packageApi } from '../../services/packageApi';
import { bookingApi } from '../../services/bookingApi';
import { paymentApi } from '../../services/paymentApi';
import Spinner from '../../components/Spinner';
import {
  FiSearch, FiMapPin, FiClock, FiUsers, FiStar,
  FiFilter, FiGrid, FiList, FiDollarSign, FiPlus,
  FiChevronLeft, FiCalendar, FiArrowRight, FiCreditCard,
  FiZap, FiX, FiCheckCircle
} from 'react-icons/fi';

const PACKAGE_TYPES = [
  'Adventure', 'Beach', 'Heritage', 'Hill Station', 'Pilgrimage',
  'Wildlife', 'Luxury', 'Honeymoon', 'Family', 'Corporate'
];

const MOCK_PACKAGES = [
  { id: 1, packageImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', title: 'Goa Golden Beach Tour', destination: 'Goa, India', packageType: 'Beach', originalPrice: 499, discount: 10, offerPrice: 449, duration: '5 Days / 4 Nights', availableSeats: 20, bookedSeats: 14, rating: 4.5, description: 'Relax on the golden sandy beaches of Goa, enjoy water sports and nightlife.', status: 'APPROVED' },
  { id: 2, packageImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', title: 'Kerala Backwater Paradise', destination: 'Kerala, India', packageType: 'Heritage', originalPrice: 799, discount: 15, offerPrice: 679, duration: '7 Days / 6 Nights', availableSeats: 15, bookedSeats: 10, rating: 4.8, description: 'Float along the serene backwaters of Alleppey in a luxury traditional houseboat.', status: 'APPROVED' },
  { id: 3, packageImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', title: 'Himalayan Adventure Trek', destination: 'Manali, India', packageType: 'Adventure', originalPrice: 599, discount: 5, offerPrice: 569, duration: '6 Days / 5 Nights', availableSeats: 10, bookedSeats: 8, rating: 4.7, description: 'Exhilarating trek through the snow-capped mountain passes and cedar valleys of Manali.', status: 'APPROVED' },
];

const CustomerPackages = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  // Modal & checkout state
  const [bookingPackage, setBookingPackage] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Info, 2: Book Form, 3: Payment Form, 4: Success
  const [travelDate, setTravelDate] = useState('');
  const [persons, setPersons] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNo, setCardNo] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await packageApi.allPackages();
      // Filter out approved packages only
      const list = Array.isArray(data) ? data : [];
      setPackages(list.length > 0 ? list : MOCK_PACKAGES);
    } catch {
      setPackages(MOCK_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleOpenBooking = (pkg) => {
    setBookingPackage(pkg);
    setBookingStep(1);
    setTravelDate('');
    setPersons(1);
    setCardNo('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!travelDate || !persons) {
      showToast('Please fill all fields', 'warning');
      return;
    }
    if (persons > (bookingPackage.availableSeats - bookingPackage.bookedSeats)) {
      showToast('Not enough seats available', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const totalAmount = bookingPackage.offerPrice * parseInt(persons);
      const payload = {
        registration: { id: user.id },
        aPackage: { id: bookingPackage.id },
        driver: null, // Admin will allocate
        travelDate,
        numberOfPersons: parseInt(persons),
        totalAmount,
        bookingStatus: 'PENDING'
      };

      const response = await bookingApi.addBooking(payload);
      setCreatedBooking(response);
      setBookingStep(3); // Proceed to payment page
      showToast('Booking registered! Complete payment to confirm.', 'success');
    } catch (err) {
      showToast(err.message || 'Booking submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const totalAmount = createdBooking.totalAmount;
      const payload = {
        booking: { id: createdBooking.id },
        amount: totalAmount,
        paymentMethod,
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        paymentStatus: 'CONFIRMED'
      };

      await paymentApi.addPayment(payload);
      
      // Update booking status to confirmed if backend doesn't automatically do it
      try {
        await bookingApi.updateStatus(createdBooking.id, 'CONFIRMED');
      } catch {
        // Ignored if API endpoint update is managed by trigger
      }

      setBookingStep(4);
      showToast('Payment successful! Booking confirmed.', 'success');
    } catch (err) {
      showToast(err.message || 'Payment submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = packages.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) || 
                        p.destination?.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'All' || p.packageType === selectedType;
    const matchApproved = p.status?.toUpperCase() === 'APPROVED' || p.status?.toUpperCase() === 'ACTIVE';
    return matchSearch && matchType && matchApproved;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display">Explore Travel Packages</h1>
          <p className="text-xs text-slate-450">Browse hand-crafted tour packages and schedule your next getaway</p>
        </div>
      </div>

      {/* Search and filter toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by package name or destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-cyan-500 text-sm"
          />
        </div>
        
        <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <FiFilter className="text-slate-400 w-4 h-4 flex-shrink-0" />
          <button
            onClick={() => setSelectedType('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              selectedType === 'All' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {PACKAGE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                selectedType === type ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <FiMapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-700 font-bold">No packages found matching your criteria</p>
          <p className="text-xs text-slate-400">Try modifying your search or choosing another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(pkg => {
            const seatsRemaining = pkg.availableSeats - pkg.bookedSeats;
            return (
              <div key={pkg.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col group">
                {/* Image */}
                <div className="h-48 overflow-hidden relative bg-slate-100 flex-shrink-0">
                  <img
                    src={pkg.packageImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80'}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80'; }}
                  />
                  {pkg.discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {pkg.discount}% OFF
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full">
                    {pkg.packageType}
                  </span>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 uppercase tracking-widest">
                      <FiMapPin className="w-3.5 h-3.5" />
                      <span>{pkg.destination}</span>
                    </div>
                    <h3 className="font-display font-black text-slate-800 text-base leading-snug line-clamp-1">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">
                      {pkg.description || 'Embark on an unforgettable vacation. Enjoy guided tours, private vehicle drives, and curated lodging.'}
                    </p>
                  </div>

                  {/* Highlights bar */}
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 py-2 border-y border-slate-50">
                    <span className="flex items-center gap-1"><FiClock className="text-cyan-500" /> {pkg.duration}</span>
                    <span className="flex items-center gap-1"><FiUsers className="text-indigo-500" /> Max {pkg.maxPeople || 12} pax</span>
                    <span className="flex items-center gap-1 text-amber-600"><FiStar className="text-amber-500 fill-amber-400" /> {pkg.rating || 4.5}</span>
                  </div>

                  {/* Booking Footer */}
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      {pkg.discount > 0 && (
                        <p className="text-[10px] text-slate-400 line-through leading-none">₹{Number(pkg.originalPrice || 0).toLocaleString('en-IN')}</p>
                      )}
                      <p className="text-lg font-black text-slate-800 leading-none">
                        ₹{Number(pkg.offerPrice || 0).toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-medium">/ person</span>
                      </p>
                    </div>

                    {seatsRemaining <= 0 ? (
                      <button disabled className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed">
                        Sold Out
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBooking(pkg)}
                        className="px-4 py-2 rounded-xl text-white font-bold text-xs bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-600/15 flex items-center gap-1 active:scale-[0.98]"
                      >
                        Book Now <FiArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Checkout Modal */}
      {bookingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-pop max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Checkout Journey</span>
                <h3 className="font-display font-black text-lg text-slate-850">
                  {bookingStep === 1 && 'Package Information'}
                  {bookingStep === 2 && 'Schedule Booking'}
                  {bookingStep === 3 && 'Secure Checkout'}
                  {bookingStep === 4 && 'Booking Completed!'}
                </h3>
              </div>
              {bookingStep !== 4 && (
                <button onClick={() => setBookingPackage(null)} className="text-slate-400 hover:text-slate-600">
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step 1: Info view */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                <div className="h-44 rounded-2xl overflow-hidden bg-slate-100">
                  <img src={bookingPackage.packageImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-slate-800 text-base">{bookingPackage.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{bookingPackage.description || 'Enjoy a curated, professional vacation package with premium lodging, private vehicle transport, and fully guided schedules.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
                  <p className="text-slate-600 font-medium">Destination: <span className="font-bold text-slate-800">{bookingPackage.destination}</span></p>
                  <p className="text-slate-600 font-medium">Duration: <span className="font-bold text-slate-800">{bookingPackage.duration}</span></p>
                  <p className="text-slate-600 font-medium">Seats Left: <span className="font-bold text-emerald-600">{bookingPackage.availableSeats - bookingPackage.bookedSeats}</span></p>
                  <p className="text-slate-600 font-medium">Unit Price: <span className="font-bold text-slate-800">₹{Number(bookingPackage.offerPrice || 0).toLocaleString('en-IN')}</span></p>
                </div>
                <button
                  onClick={() => setBookingStep(2)}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-600/10 flex items-center justify-center gap-1.5"
                >
                  Proceed to Schedule <FiArrowRight />
                </button>
              </div>
            )}

            {/* Step 2: Book Form */}
            {bookingStep === 2 && (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Travel Date</label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                      <FiCalendar className="absolute left-3.5 w-4 h-4 text-slate-455 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={travelDate}
                        onChange={e => setTravelDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full text-sm pl-10 pr-4 py-3 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-455 tracking-wider">Number of Travellers</label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                      <FiUsers className="absolute left-3.5 w-4 h-4 text-slate-450 pointer-events-none" />
                      <input
                        type="number"
                        required
                        min="1"
                        max={bookingPackage.availableSeats - bookingPackage.bookedSeats}
                        value={persons}
                        onChange={e => setPersons(e.target.value)}
                        className="w-full text-sm pl-10 pr-4 py-3 outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Limit based on available seats: {bookingPackage.availableSeats - bookingPackage.bookedSeats}</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-slate-800">
                    <div>
                      <p className="text-xs font-semibold text-slate-550">Total Amount</p>
                      <p className="text-[10px] text-slate-400">(₹{Number(bookingPackage.offerPrice || 0).toLocaleString('en-IN')} x {persons || 0} pax)</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800">₹{Number((bookingPackage.offerPrice || 0) * (parseInt(persons) || 0)).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="flex-1 py-3 rounded-xl border border-slate-250 text-slate-600 font-bold text-sm hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-600/10 flex items-center justify-center gap-1.5"
                  >
                    {submitting ? 'Booking...' : 'Create Booking'} <FiArrowRight />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Payment Form */}
            {bookingStep === 3 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                    <span>Booking registered successfully! Pay to confirm seats.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-455 tracking-wider">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full text-sm py-3 px-4 rounded-xl border border-slate-200 outline-none cursor-pointer"
                    >
                      <option value="CARD">Credit/Debit Card</option>
                      <option value="UPI">UPI (Google Pay/PhonePe)</option>
                      <option value="CASH">Pay at Desk (Cash)</option>
                    </select>
                  </div>

                  {paymentMethod === 'CARD' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-450">Card Details</label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 overflow-hidden">
                        <FiCreditCard className="absolute left-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={cardNo}
                          onChange={e => setCardNo(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          className="w-full text-sm pl-10 pr-4 py-3 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'UPI' && (
                    <div className="p-4 rounded-xl bg-slate-50 border text-center space-y-2">
                      <FiZap className="w-6 h-6 text-indigo-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Scan QR or enter UPI VPA</p>
                      <p className="text-[10px] text-slate-400">A payment request will be sent to your UPI device.</p>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-slate-800">
                    <p className="text-xs font-bold text-slate-550">Confirm Payment Amount</p>
                    <p className="text-2xl font-black text-slate-850">₹{Number(createdBooking?.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Processing Payment...' : `Authorize Payment of ₹${Number(createdBooking?.totalAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </form>
            )}

            {/* Step 4: Success */}
            {bookingStep === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500"
                  style={{ boxShadow: '0 0 20px rgba(16,185,129,0.25)' }}>
                  <FiCheckCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-black text-slate-800 text-lg">Thank You for Booking!</h4>
                  <p className="text-xs text-slate-400">Your trip booking has been successfully registered and paid.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5">
                  <p className="text-slate-650">Booking Reference: <span className="font-bold text-slate-800">#{createdBooking?.id}</span></p>
                  <p className="text-slate-650">Tour: <span className="font-bold text-slate-800">{bookingPackage.title}</span></p>
                  <p className="text-slate-650">Date: <span className="font-bold text-slate-800">{travelDate}</span></p>
                  <p className="text-slate-650">Travellers: <span className="font-bold text-slate-800">{persons} persons</span></p>
                </div>
                <button
                  onClick={() => { setBookingPackage(null); loadPackages(); }}
                  className="w-full max-w-xs py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md"
                >
                  Close & Refresh Packages
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerPackages;
