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
    const response = await api.put(`/Payments/status/${id}`, { status }, {
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

  // GET /Payments/rejectCount
  getRejectPaymentCount: async () => {
    const response = await api.get('/Payments/rejectCount');
    return response.data;
  }
};
