import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { notifySessionExpired } from '../auth/sessionBridge';

const BASE_URL = 'https://heritage-slabs-mobile.onrender.com/api';

const api = axios.create({
    baseURL: BASE_URL,
});

// ── Request Interceptor ─────────────────────────────────────────────────────
// Automatically attaches the Bearer token to every outgoing request.
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Avoid firing multiple alerts if several requests fail at once
            const alreadyHandled = await AsyncStorage.getItem('_401_handled');
            if (!alreadyHandled) {
                await AsyncStorage.setItem('_401_handled', 'true');

                await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'authUser']);
                notifySessionExpired();

                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{
                        text: 'OK',
                        onPress: () => {
                            AsyncStorage.removeItem('_401_handled');
                        },
                    }]
                );
            }
        }
        return Promise.reject(error);
    }
);

export default api;