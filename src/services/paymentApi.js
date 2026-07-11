import api from './api';

export const paymentApi = {
  // GET /Payments/all
  allPayments: async () => {
    const response = await api.get('/Payments/all');
    return response.data;
  },

  // GET /Payments/{id}
  getPayment: async (id) => {
    const response = await api.get(`/Payments/${id}`);
    return response.data;
  },

  // PUT /Payments/update/{id}
  updatePayment: async (id, paymentData) => {
    const response = await api.put(`/Payments/update/${id}`, paymentData);
    return response.data;
  },

  // DELETE /Payments/delete/{id}
  deletePayment: async (id) => {
    const response = await api.delete(`/Payments/delete/${id}`);
    return response.data;
  },

  // PUT /Payments/status/{id}
  updateStatus: async (id, status) => {
    // Send status as a query param only (e.g. PUT /Payments/status/5?status=CONFIRMED)
    const response = await api.put(`/Payments/status/${id}`, null, {
      params: { status }
    });
    return response.data;
  },

  // GET /Payments/count
  getPaymentCount: async () => {
    const response = await api.get('/Payments/count');
    return response.data;
  },

  // GET /Payments/confrimCount (Note spelling match: confrimCount)
  getConfirmPaymentCount: async () => {
    const response = await api.get('/Payments/confrimCount');
    return response.data;
  },

  // GET /Payments/pendingCount
  getPendingPaymentCount: async () => {
    const response = await api.get('/Payments/pendingCount');
    return response.data;
  },

  // POST /Payments/add
  addPayment: async (paymentData) => {
    const response = await api.post('/Payments/add', paymentData);
    return response.data;
  },

  // GET /Payments/rejectCount
  getRejectPaymentCount: async () => {
    const response = await api.get('/Payments/rejectCount');
    return response.data;
  }
};
