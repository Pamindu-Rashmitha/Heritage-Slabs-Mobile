import api from './axiosConfig';

const vehicleService = {
    getAll: () =>
        api.get('/vehicles'),

    create: (vehicleData) =>
        api.post('/vehicles', vehicleData),

    update: (id, vehicleData) =>
        api.put(`/vehicles/${id}`, vehicleData),

    delete: (id) =>
        api.delete(`/vehicles/${id}`),
};

export default vehicleService;
