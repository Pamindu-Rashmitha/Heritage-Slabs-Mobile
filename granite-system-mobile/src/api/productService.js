import api from './axiosConfig';

const productService = {
    getAll: () =>
        api.get('/products'),

    create: (formData) =>
        api.post('/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    update: (id, payload, isFormData = false) => {
        const config = isFormData
            ? { headers: { 'Content-Type': 'multipart/form-data' } }
            : {};
        return api.put(`/products/${id}`, payload, config);
    },

    delete: (id) =>
        api.delete(`/products/${id}`),

    submitReview: (reviewData) =>
        api.post('/products/review-order', reviewData),
};

export default productService;
