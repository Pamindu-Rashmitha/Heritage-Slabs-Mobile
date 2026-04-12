import api from './axiosConfig';

const orderService = {
    getAll: () =>
        api.get('/orders'),

    getMyOrders: () =>
        api.get('/orders/my'),

    create: (orderData) =>
        api.post('/orders', orderData),

    updateStatus: (id, status) =>
        api.put(`/orders/${id}`, { status }),

    delete: (id) =>
        api.delete(`/orders/${id}`),
};

export default orderService;
