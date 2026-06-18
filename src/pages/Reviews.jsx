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
          className={`${iconSize} ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
};

const InteractiveStars = ({ rating, onRate }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onRate(star)}
        className="focus:outline-none transition-transform hover:scale-110"
      >
        <FiStar className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`} />
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

  // Add review modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    packageId: '',
    customerName: '',
    rating: 5,
    comment: '',
    reviewDate: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  // Load packages and reviews on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    // 1. Fetch Packages first
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

    // 2. Fetch Reviews
    try {
      const reviewData = await reviewApi.allReviews();
      const list = Array.isArray(reviewData) ? reviewData : [];
      setReviews(list);
      setFilteredReviews(list);
    } catch (err) {
      console.error(err);
      showToast('Could not load reviews; displaying default reviews.', 'warning');
      const mockReviews = [
        { id: 'REV-101', packageId: '1', customerName: 'Aarav Mehta', rating: 5, comment: 'Absolutely breathtaking! The Goa beaches were beautiful and the resort was incredibly luxury.', reviewDate: '2026-06-15' },
        { id: 'REV-102', packageId: '2', customerName: 'Ananya Iyer', rating: 4, comment: 'The backwaters of Kerala were serene. Highly recommend the houseboat experience.', reviewDate: '2026-06-14' },
        { id: 'REV-103', packageId: '3', customerName: 'Rohan Malhotra', rating: 5, comment: 'Incredible trekking in the Himalayas. The guides were professional and safety was top-notch.', reviewDate: '2026-06-16' },
        { id: 'REV-104', packageId: '1', customerName: 'Sneha Patel', rating: 3, comment: 'Goa tour was nice, but the transport vehicle was a bit delayed on day two.', reviewDate: '2026-06-12' },
        { id: 'REV-105', packageId: '4', customerName: 'Kabir Singh', rating: 5, comment: 'Stunning palaces in Jaipur! Rajasthan culture was represented beautifully. Loved it!', reviewDate: '2026-06-11' },
        { id: 'REV-106', packageId: '5', customerName: 'Priya Nair', rating: 5, comment: 'The Maldives trip was pure bliss. Crystal clear water and outstanding hospitality.', reviewDate: '2026-06-17' },
        { id: 'REV-107', packageId: '2', customerName: 'Vikram Rao', rating: 4, comment: 'Loved Kerala. The food was extremely spicy but absolutely delicious.', reviewDate: '2026-06-13' }
      ];
      setReviews(mockReviews);
      setFilteredReviews(mockReviews);
    } finally {
      setLoading(false);
    }
  };

  // Helper to map packageName
  const getPackageName = (review) => {
    if (review.packageName) return review.packageName;
    const pkg = packages.find(p => String(p.id) === String(review.packageId));
    return pkg ? (pkg.title || pkg.packageName) : `Package #${review.packageId}`;
  };

  // Search & Filter Effect
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
      // Local fallback
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

  // Pagination
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight font-sans">Customer Reviews</h1>
          <p className="text-xs sm:text-sm text-slate-450 mt-0.5">
            Manage reviews submitted by travelers, check overall ratings, and delete reviews.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-primary-500/15 hover:bg-primary-600 transition-all active:scale-[0.98]"
        >
          <FiPlus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <FiStar className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Rating</p>
            <h3 className="text-2xl font-extrabold text-slate-800">
              {avgRating}<span className="text-sm font-semibold text-slate-400"> / 5</span>
            </h3>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center">
            <FiMessageSquare className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{reviews.length}</h3>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <FiPackage className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reviewed Packages</p>
            <h3 className="text-2xl font-extrabold text-slate-800">
              {new Set(reviews.map((r) => r.packageId)).size}
            </h3>
          </div>
        </div>
      </div>

      {/* Universal Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
          <FiSearch className="text-slate-400 w-4.5 h-4.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, Customer Name, Package Name, or Comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
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

      {/* Table Section */}
      {loading ? (
        <div className="h-60 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-55 border-b border-slate-100 text-slate-450 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Review ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Package Name</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Review Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentItems.length > 0 ? (
                  currentItems.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary-600">{review.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{review.customerName || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-650 max-w-xs truncate">
                        <span className="flex items-center gap-1.5">
                          <FiPackage className="text-slate-400 w-3.5 h-3.5 flex-shrink-0" />
                          {getPackageName(review)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <StarRating rating={Number(review.rating || 5)} />
                          <span className="text-[10px] font-bold text-amber-500">{review.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2" title={review.comment}>
                          {review.comment || 'No comment provided.'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <FiCalendar className="text-slate-400 w-3.5 h-3.5" />
                          {review.reviewDate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Review"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No review records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-450 font-bold">
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredReviews.length)} of {filteredReviews.length} reviews
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => handlePageChange(i + 1)}
                    className={`w-7 h-7 text-xs font-semibold rounded-lg border transition-colors ${currentPage === i + 1 ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Review Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Submit New Customer Review">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Package</label>
              <select
                value={addForm.packageId}
                onChange={(e) => setAddForm({ ...addForm, packageId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-500 outline-none transition-colors cursor-pointer"
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
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={addForm.customerName}
                onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Star Rating</label>
              <div className="flex items-center gap-3">
                <InteractiveStars rating={addForm.rating} onRate={(r) => setAddForm({ ...addForm, rating: r })} />
                <span className="text-sm font-bold text-amber-500">{addForm.rating} / 5 Stars</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Date</label>
              <input
                type="date"
                value={addForm.reviewDate}
                onChange={(e) => setAddForm({ ...addForm, reviewDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:border-primary-500 outline-none transition-colors cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Comment</label>
            <textarea
              placeholder="Describe the traveler experience in detail..."
              value={addForm.comment}
              onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:border-primary-500 outline-none transition-colors resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 rounded-xl shadow-lg transition-colors disabled:opacity-50"
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
