import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { driverApi } from '../../services/driverApi';
import { packageApi } from '../../services/packageApi';
import { reviewApi } from '../../services/reviewApi';
import Spinner from '../../components/Spinner';
import {
  FiStar, FiMessageSquare, FiCalendar, FiUser,
  FiAward, FiRefreshCw
} from 'react-icons/fi';

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <FiStar
        key={star}
        className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-500 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
      />
    ))}
  </div>
);

const DriverReviews = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(5.0);

  const loadReviews = async (isRef = false) => {
    if (isRef) setRefreshing(true); else setLoading(true);
    try {
      // 1. Resolve Driver ID
      const drivers = await driverApi.allDrivers().catch(() => []);
      const matched = drivers.find(d => d.registration?.id === user.id);

      if (matched) {
        // 2. Fetch packages and reviews
        const [pkgsData, revsData] = await Promise.all([
          packageApi.allPackages().catch(() => []),
          reviewApi.allReviews().catch(() => [])
        ]);

        const packages = Array.isArray(pkgsData) ? pkgsData : [];
        const reviewsList = Array.isArray(revsData) ? revsData : [];

        // 3. Find packages hosted by this driver
        const driverPkgIds = packages
          .filter(p => String(p.driverId) === String(matched.id) || p.driver?.id === matched.id)
          .map(p => String(p.id));

        // 4. Filter reviews matching driver package IDs
        const driverReviews = reviewsList.filter(r => 
          driverPkgIds.includes(String(r.packageId))
        );

        setReviews(driverReviews);

        // Calculate average rating
        if (driverReviews.length > 0) {
          const sum = driverReviews.reduce((acc, curr) => acc + curr.rating, 0);
          setRatingAverage(Number((sum / driverReviews.length).toFixed(1)));
        } else {
          setRatingAverage(5.0);
        }

      } else {
        setReviews([]);
      }
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
      loadReviews();
    }
  }, [user]);

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
          <h1 className="text-2xl font-black text-slate-805 font-display">Customer Reviews</h1>
          <p className="text-xs text-slate-455">Read testimonials and track your rating score across packages</p>
        </div>
        <button
          onClick={() => loadReviews(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-205 rounded-xl text-xs font-bold text-slate-655 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {reviews.length > 0 && (
        <div className="bg-gradient-to-r from-purple-550 to-indigo-600 rounded-3xl p-6 text-white flex justify-between items-center shadow-md">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Aggregate Score</p>
            <p className="text-3xl font-black">{ratingAverage} out of 5</p>
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(ratingAverage)} />
              <span className="text-[10px] text-purple-200 font-semibold">({reviews.length} reviews)</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-purple-200">
            <FiAward className="w-6 h-6" />
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <FiMessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-705 font-bold">No Reviews Submitted</p>
          <p className="text-xs text-slate-400">Reviews for your scheduled packages will be displayed here.</p>
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
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-650 flex items-center justify-center text-[9px] font-black uppercase">
                  <FiUser className="w-3 h-3 text-purple-600" />
                </div>
                <p className="text-[10px] text-slate-455 font-bold">
                  By {rev.customerName || 'Anonymous Traveller'}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DriverReviews;
