import api from './api';

export const imageApi = {
  // POST /images/add
  addImage: async (imageData) => {
    const headers = imageData instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
      
    const response = await api.post('/images/add', imageData, { headers });
    return response.data;
  },

  // GET /images/all
  allImages: async () => {
    const response = await api.get('/images/all');
    return response.data;
  },

  // GET /images/{id}
  getImage: async (id) => {
    const response = await api.get(`/images/${id}`);
    return response.data;
  },

  // PUT /images/update/{id}
  updateImage: async (id, imageData) => {
    const headers = imageData instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await api.put(`/images/update/${id}`, imageData, { headers });
    return response.data;
  },

  // DELETE /images/delete/{id}
  deleteImage: async (id) => {
    const response = await api.delete(`/images/delete/${id}`);
    return response.data;
  }
};
