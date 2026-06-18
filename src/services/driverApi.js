import api from './api';

export const driverApi = {
  // GET /Driver/allDetails
  allDrivers: async () => {
    const response = await api.get('/Driver/allDetails');
    return response.data;
  },

  // GET /Driver/details/{id}
  getDriver: async (id) => {
    const response = await api.get(`/Driver/details/${id}`);
    return response.data;
  },

  // PUT /Driver/updateDetails/{id}
  updateDriver: async (id, driverData) => {
    const response = await api.put(`/Driver/updateDetails/${id}`, driverData);
    return response.data;
  },

  // DELETE /Driver/deleteDetails/{id}
  deleteDriver: async (id) => {
    const response = await api.delete(`/Driver/deleteDetails/${id}`);
    return response.data;
  },

  // PUT /Driver/status/{id}
  // Supporting both JSON body and query parameter
  updateStatus: async (id, status) => {
    const response = await api.put(`/Driver/status/${id}`, { status }, {
      params: { status }
    });
    return response.data;
  },

  // POST /Driver/details
  addDriver: async (driverData) => {
    const response = await api.post('/Driver/details', driverData);
    return response.data;
  },

  // GET /Driver/count
  getDriverCount: async () => {
    const response = await api.get('/Driver/count');
    return response.data;
  }
};
