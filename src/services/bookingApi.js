import api from './api';

export const bookingApi = {
  // GET /Booking/all
  allBookings: async () => {
    const response = await api.get('/Booking/all');
    return response.data;
  },

  // GET /Booking/{id}
  getBooking: async (id) => {
    const response = await api.get(`/Booking/${id}`);
    return response.data;
  },

  // PUT /Booking/update/{id}
  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/Booking/update/${id}`, bookingData);
    return response.data;
  },

  // DELETE /Booking/delete/{id}
  deleteBooking: async (id) => {
    const response = await api.delete(`/Booking/delete/${id}`);
    return response.data;
  },

  // PUT /Booking/status/{id}
  updateStatus: async (id, status) => {
    const response = await api.put(`/Booking/status/${id}`, { status }, {
      params: { status }
    });
    return response.data;
  },

  // GET /Booking/customer/{id}
  getCustomerBookings: async (customerId) => {
    const response = await api.get(`/Booking/customer/${customerId}`);
    return response.data;
  },

  // GET /Booking/package/{id}
  getPackageBookings: async (packageId) => {
    const response = await api.get(`/Booking/package/${packageId}`);
    return response.data;
  },

  // POST /Booking/add
  addBooking: async (bookingData) => {
    const response = await api.post('/Booking/add', bookingData);
    return response.data;
  },

  // GET /Booking/count
  getBookingCount: async () => {
    const response = await api.get('/Booking/count');
    return response.data;
  }
};
