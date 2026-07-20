import api from './api';

export const packageApi = {
  // GET /Packages/allPackages
  allPackages: async () => {
    const response = await api.get('/Packages/allPackages');
    return response.data;
  },

  // GET /Packages/{id}
  getPackage: async (id) => {
    const response = await api.get(`/Packages/${id}`);
    return response.data;
  },

  // POST /Packages/add
  addPackage: async (packageData) => {
    const response = await api.post('/Packages/add', packageData);
    return response.data;
  },

  // PUT /packages/update/{id}
  updatePackage: async (id, packageData) => {
    const response = await api.put(`/packages/update/${id}`, packageData);
    return response.data;
  },

  // DELETE /Packages/delete/{id}
  deletePackage: async (id) => {
    const response = await api.delete(`/Packages/delete/${id}`);
    return response.data;
  },

  // PUT /Packages/status/{id}
  updateStatus: async (id, status) => {
    const response = await api.put(`/Packages/status/${id}`, { status }, {
      params: { status }
    });
    return response.data;
  },

  // GET /Packages/count
  getPackageCount: async () => {
    const response = await api.get('/Packages/count');
    return response.data;
  }
};
