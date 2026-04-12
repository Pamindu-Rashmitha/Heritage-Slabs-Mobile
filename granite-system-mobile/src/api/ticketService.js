import api from './axiosConfig';

const ticketService = {
    getAll: () =>
        api.get('/tickets'),

    getMyTickets: () =>
        api.get('/tickets/my'),

    create: (ticketData) =>
        api.post('/tickets', ticketData),

    update: (id, payload) =>
        api.put(`/tickets/${id}`, payload),

    delete: (id) =>
        api.delete(`/tickets/${id}`),
};

export default ticketService;
