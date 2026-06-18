import api from './api';

export const userApi = {
  // GET /registration/allUsers
  allUsers: async () => {
    const response = await api.get('/registration/allUsers');
    return response.data;
  },

  // GET /registration/users/{id}
  getUser: async (id) => {
    const response = await api.get(`/registration/users/${id}`);
    return response.data;
  },

  // PUT /registration/update/{id}
  updateUser: async (id, userData) => {
    const response = await api.put(`/registration/update/${id}`, userData);
    return response.data;
  },

  // DELETE /registration/delete/{id}
  deleteUser: async (id) => {
    const response = await api.delete(`/registration/delete/${id}`);
    return response.data;
  },

  // PUT /registration/resetPassword/{id}
  // Supporting both JSON body and request params for high compatibility
  resetPassword: async (id, password) => {
    const response = await api.put(`/registration/resetPassword/${id}`, { password }, {
      params: { password } // In case the backend expects query parameter
    });
    return response.data;
  },

  // GET /registration/count
  getUserCount: async () => {
    const response = await api.get('/registration/count');
    return response.data;
  }
};
