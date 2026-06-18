import api from './api';

export const reviewApi = {
  // GET /Review/all
  allReviews: async () => {
    const response = await api.get('/Review/all');
    return response.data;
  },

  // GET /Review/Package/{id}
  getPackageReviews: async (packageId) => {
    const response = await api.get(`/Review/Package/${packageId}`);
    return response.data;
  },

  // POST /Review/add
  addReview: async (reviewData) => {
    const response = await api.post('/Review/add', reviewData);
    return response.data;
  },

  // DELETE /Review/delete/{id}
  deleteReview: async (id) => {
    const response = await api.delete(`/Review/delete/${id}`);
    return response.data;
  }
};

