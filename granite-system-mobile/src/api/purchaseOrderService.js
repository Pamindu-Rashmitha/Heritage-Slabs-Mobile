import api from './axiosConfig';

const purchaseOrderService = {
    getAll: () =>
        api.get('/purchase-orders'),

    create: (poData) =>
        api.post('/purchase-orders', poData),

    updateStatus: (id, status) =>
        api.put(`/purchase-orders/${id}`, { status }),

    delete: (id) =>
        api.delete(`/purchase-orders/${id}`),
};

export default purchaseOrderService;
