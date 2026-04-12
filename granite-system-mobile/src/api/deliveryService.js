import api from './axiosConfig';

const deliveryService = {
    getAll: () =>
        api.get('/deliveries'),

    create: (deliveryData) =>
        api.post('/deliveries', deliveryData),

    updateStatus: (id, status) =>
        api.put(`/deliveries/${id}`, { status }),

    delete: (id) =>
        api.delete(`/deliveries/${id}`),
};

export default deliveryService;
