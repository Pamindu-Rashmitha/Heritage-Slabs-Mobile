import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';

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

// ── Response Interceptor ────────────────────────────────────────────────────
// Handles 401 Unauthorized globally — clears session and redirects to Login.
let navigationRef = null;

export const setNavigationRef = (ref) => {
    navigationRef = ref;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Avoid firing multiple alerts if several requests fail at once
            const alreadyHandled = await AsyncStorage.getItem('_401_handled');
            if (!alreadyHandled) {
                await AsyncStorage.setItem('_401_handled', 'true');

                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userRole');
                await AsyncStorage.removeItem('userId');

                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{
                        text: 'OK',
                        onPress: () => {
                            AsyncStorage.removeItem('_401_handled');
                            if (navigationRef) {
                                navigationRef.dispatch(
                                    CommonActions.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                    })
                                );
                            }
                        },
                    }]
                );
            }
        }
        return Promise.reject(error);
    }
);

export default api;