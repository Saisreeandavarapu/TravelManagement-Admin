import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reviewApi } from '../../services/reviewApi';
import { packageApi } from '../../services/packageApi';
import { bookingApi } from '../../services/bookingApi';
import Spinner from '../../components/Spinner';
import {
  FiStar, FiMessageSquare, FiPlus, FiX, FiCheckCircle,
  FiTrash2, FiCalendar, FiMapPin, FiRefreshCw
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
        <FiStar className={`w-6 h-6 ${star <= rating ? 'text-amber-500 fill-amber-400' : 'text-slate-300 fill-slate-200'}`} />
      </button>
    ))}
  </div>
);

const CustomerReviews = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [reviews, setReviews] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add review modal state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      const [allPkgData, allRevData] = await Promise.all([
        packageApi.allPackages().catch(() => []),
        reviewApi.allReviews().catch(() => [])
      ]);

      const pkgs = Array.isArray(allPkgData) ? allPkgData : [];
      const revs = Array.isArray(allRevData) ? allRevData : [];
      setPackages(pkgs);

      // Filter reviews matching user's full name
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const userRevs = revs.filter(r => 
        (r.customerName || '').toLowerCase() === fullName
      );
      setReviews(userRevs);
    } catch (err) {
      console.error(err);
      showToast('Could not fetch reviews.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedPkgId || !comment.trim()) {
      showToast('Please select a package and provide comments.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        packageId: selectedPkgId,
        customerName: `${user.firstName} ${user.lastName}`,
        rating: parseInt(rating),
        comment: comment.trim(),
        reviewDate: new Date().toISOString().split('T')[0]
      };

      await reviewApi.addReview(payload);
      showToast('Review submitted successfully!', 'success');
      setIsOpen(false);
      setSelectedPkgId('');
      setRating(5);
      setComment('');
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPackageTitle = (pkgId) => {
    const found = packages.find(p => String(p.id) === String(pkgId));
    return found ? found.title : 'Destination Tour';
  };

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
          <h1 className="text-2xl font-black text-slate-800 font-display">My Reviews</h1>
          <p className="text-xs text-slate-450">View and write reviews about travel destinations and trip packages</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 shadow-md shadow-cyan-600/15 transition-all"
          >
            <FiPlus /> Write Review
          </button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-350">
            <FiMessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-bold text-base">No Reviews Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">You haven't authored any reviews yet. Share feedback on trips you've enjoyed!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map(rev => (
            <div key={rev.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <StarRating rating={rev.rating} />
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <FiCalendar /> {rev.reviewDate || 'Recent'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-800 text-sm leading-snug">
                  {getPackageTitle(rev.packageId)}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center font-bold text-[10px] text-cyan-600">
                  {user.firstName[0].toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-450 font-bold">
                  By {rev.customerName || 'You'}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-pop">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-650">Share Feedback</span>
                <h3 className="font-display font-black text-lg text-slate-850">Write Package Review</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-650">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select Travel Package</label>
                <select
                  required
                  value={selectedPkgId}
                  onChange={e => setSelectedPkgId(e.target.value)}
                  className="w-full text-sm py-3 px-4 rounded-xl border border-slate-205 outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Select Tour --</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Star Rating</label>
                <div className="flex items-center p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <InteractiveStars rating={rating} onRate={setRating} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Your Experience Comments</label>
                <textarea
                  required
                  rows="4"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share details of your lodging, transport, guide support, and overall excitement..."
                  className="w-full text-sm px-4 py-3 rounded-xl border border-slate-205 outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerReviews;
