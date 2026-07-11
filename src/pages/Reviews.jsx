import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { reviewApi } from '../services/reviewApi';
import { packageApi } from '../services/packageApi';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import {
  FiSearch, FiStar, FiPlus, FiMessageSquare,
  FiPackage, FiTrash2, FiCalendar, FiFilter
} from 'react-icons/fi';

const StarRating = ({ rating, size = 'sm' }) => {
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`${iconSize} ${star <= rating ? 'text-amber-500 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
};

const InteractiveStars = ({ rating, onRate }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onRate(star)}
        className="focus:outline-none transition-transform hover:scale-110"
      >
        <FiStar className={`w-6 h-6 ${star <= rating ? 'text-amber-500 fill-amber-400' : 'text-slate-350 fill-slate-350'}`} />
      </button>
    ))}
  </div>
);

const Reviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    packageId: '',
    customerName: '',
    rating: 5,
    comment: '',
    reviewDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await packageApi.allPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      setPackages([
        { id: '1', title: 'Goa Golden Beach Tour' },
        { id: '2', title: 'Kerala Backwater Paradise' },
        { id: '3', title: 'Himalayan Adventure Trek' },
        { id: '4', title: 'Rajasthan Heritage Cruise' },
        { id: '5', title: 'Maldives Island Escapade' }
      ]);
    }

    try {
      const reviewData = await reviewApi.allReviews();
      const list = Array.isArray(reviewData) ? reviewData : [];
      setReviews(list);
      setFilteredReviews(list);
    } catch (err) {
      console.error(err);
      const mockReviews = [
        { id: 'REV-101', packageId: '1', customerName: 'Aarav Mehta', rating: 5, comment: 'Absolutely breathtaking! The Goa beaches were beautiful and the resort was incredibly luxury.', reviewDate: '2026-06-15' },
        { id: 'REV-102', packageId: '2', customerName: 'Ananya Iyer', rating: 4, comment: 'The backwaters of Kerala were serene. Highly recommend the houseboat experience.', reviewDate: '2026-06-14' },
        { id: 'REV-103', packageId: '3', customerName: 'Rohan Malhotra', rating: 5, comment: 'Incredible trekking in the Himalayas. The guides were professional and safety was top-notch.', reviewDate: '2026-06-16' },
        { id: 'REV-104', packageId: '1', customerName: 'Sneha Patel', rating: 3, comment: 'Goa tour was nice, but the transport vehicle was a bit delayed on day two.', reviewDate: '2026-06-12' },
        { id: 'REV-105', packageId: '4', customerName: 'Kabir Singh', rating: 5, comment: 'Stunning palaces in Jaipur! Rajasthan culture was represented beautifully. Loved it!', reviewDate: '2026-06-11' },
      ];
      setReviews(mockReviews);
      setFilteredReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  const getPackageName = (review) => {
    if (review.packageName) return review.packageName;
    const pkg = packages.find(p => String(p.id) === String(review.packageId));
    return pkg ? (pkg.title || pkg.packageName) : `Package #${review.packageId}`;
  };

  useEffect(() => {
    let result = reviews;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const pkgName = getPackageName(r).toLowerCase();
        return (
          r.id?.toString().toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q) ||
          (r.comment || '').toLowerCase().includes(q) ||
          pkgName.includes(q)
        );
      });
    }

    if (ratingFilter !== 'All') {
      const ratingNum = Number(ratingFilter);
      result = result.filter((r) => Math.round(Number(r.rating || 0)) === ratingNum);
    }

    setFilteredReviews(result);
    setCurrentPage(1);
  }, [searchQuery, ratingFilter, reviews, packages]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer review permanently?')) return;
    try {
      await reviewApi.deleteReview(id);
      showToast('Review deleted successfully', 'success');
      loadInitialData();
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review removed locally', 'success');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.packageId || !addForm.customerName.trim() || !addForm.comment.trim()) {
      showToast('Please fill all review fields', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.addReview(addForm);
      showToast('Review submitted successfully', 'success');
      setIsAddOpen(false);
      setAddForm({
        packageId: '',
        customerName: '',
        rating: 5,
        comment: '',
        reviewDate: new Date().toISOString().split('T')[0]
      });
      loadInitialData();
    } catch {
      const newReview = {
        id: `REV-${Date.now().toString().slice(-4)}`,
        ...addForm,
        reviewDate: addForm.reviewDate || new Date().toISOString().split('T')[0]
      };
      setReviews((prev) => [newReview, ...prev]);
      showToast('Review added locally (offline)', 'success');
      setIsAddOpen(false);
      setAddForm({
        packageId: '',
        customerName: '',
        rating: 5,
        comment: '',
        reviewDate: new Date().toISOString().split('T')[0]
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0.0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800 tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage reviews submitted by travelers, check overall ratings, and delete reviews.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
        >
          <FiPlus className="w-4 h-4" /> Add Review
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg. Rating', value: `${avgRating} / 5`, icon: FiStar, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Total Reviews', value: reviews.length, icon: FiMessageSquare, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Reviewed Packages', value: new Set(reviews.map((r) => r.packageId)).size, icon: FiPackage, color: '#10b981', bg: '#d1fae5' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background: s.bg, color: s.color }}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-display font-black text-slate-805 mt-1">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiSearch className="text-slate-450 w-4 h-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by customer, package, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-405"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 font-medium cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Review Card Grid Layout */}
      {loading ? (
        <div className="card h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentItems.length > 0 ? (
              currentItems.map((review) => (
                <div key={review.id} className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all relative">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                          style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                          {(review.customerName || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">{review.customerName}</h4>
                          <span className="text-[10px] text-slate-450 font-mono">#{review.id}</span>
                        </div>
                      </div>
                      <StarRating rating={Number(review.rating || 5)} />
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed mb-4 italic">
                      "{review.comment || 'No comment provided.'}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiPackage className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-500 truncate max-w-[160px]">{getPackageName(review)}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                      {review.reviewDate || 'N/A'}
                    </span>
                  </div>

                  {/* Absolute delete button */}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 absolute-delete-btn"
                    title="Delete Review"
                    style={{ position: 'absolute', top: '12px', right: '12px' }}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400 font-medium">No reviews found.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
              style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <span className="text-xs text-slate-400 font-medium">Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredReviews.length)} of {filteredReviews.length} reviews</span>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`w-7 h-7 text-xs font-bold rounded-lg border ${currentPage === i + 1 ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{i + 1}</button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Review Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Submit Customer Review">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Select Package</label>
              <select
                value={addForm.packageId}
                onChange={(e) => setAddForm({ ...addForm, packageId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                required
              >
                <option value="">-- Select Package --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    #{pkg.id} – {pkg.title || pkg.packageName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={addForm.customerName}
                onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Star Rating</label>
              <div className="flex items-center gap-3">
                <InteractiveStars rating={addForm.rating} onRate={(r) => setAddForm({ ...addForm, rating: r })} />
                <span className="text-xs font-bold text-amber-500">{addForm.rating} / 5 Stars</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Review Date</label>
              <input
                type="date"
                value={addForm.reviewDate}
                onChange={(e) => setAddForm({ ...addForm, reviewDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Review Comment</label>
            <textarea
              placeholder="Describe the traveler experience in detail..."
              value={addForm.comment}
              onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-400 outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-750 rounded-xl shadow-lg transition-colors disabled:opacity-50"
            >
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Submit Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reviews;
