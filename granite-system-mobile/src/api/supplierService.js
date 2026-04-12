import api from './axiosConfig';

const supplierService = {
    getAll: () =>
        api.get('/suppliers'),

    create: (supplierData) =>
        api.post('/suppliers', supplierData),

    update: (id, supplierData) =>
        api.put(`/suppliers/${id}`, supplierData),

    delete: (id) =>
        api.delete(`/suppliers/${id}`),
};

export default supplierService;
