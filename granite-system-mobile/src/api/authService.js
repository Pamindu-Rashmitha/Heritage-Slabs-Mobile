import api from './axiosConfig';

const authService = {
    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    register: (userData) =>
        api.post('/auth/register', userData),

    getUsers: () =>
        api.get('/auth/users'),

    getUserById: (id) =>
        api.get(`/auth/user/${id}`),

    updateUser: (id, payload) =>
        api.patch(`/auth/update/${id}`, payload),

    deleteUser: (id) =>
        api.delete(`/auth/delete/${id}`),
};

export default authService;
