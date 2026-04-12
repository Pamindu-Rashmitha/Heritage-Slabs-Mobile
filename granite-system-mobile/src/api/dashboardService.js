import api from './axiosConfig';

const dashboardService = {
    getStats: () =>
        api.get('/dashboard/stats'),
};

export default dashboardService;    
