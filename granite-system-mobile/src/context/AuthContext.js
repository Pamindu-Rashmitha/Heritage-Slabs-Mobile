import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../api/authService';
import { setSessionExpiredHandler } from '../auth/sessionBridge';

const AuthContext = createContext(null);

const AUTH_USER_KEY = 'authUser';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        await AsyncStorage.multiRemove([
            'userToken',
            'userRole',
            'userId',
            AUTH_USER_KEY,
            '_401_handled',
        ]);
        setToken(null);
        setUser(null);
    }, []);

    const persistSession = useCallback(async (payload) => {
        const { token: t, _id, name, email, role } = payload;
        const u = { _id, name, email, role };
        await AsyncStorage.setItem('userToken', t);
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('userId', _id);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
        setToken(t);
        setUser(u);
    }, []);

    useEffect(() => {
        setSessionExpiredHandler(() => {
            logout();
        });
        return () => setSessionExpiredHandler(null);
    }, [logout]);

    useEffect(() => {
        (async () => {
            try {
                const t = await AsyncStorage.getItem('userToken');
                const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
                if (t && raw) {
                    setToken(t);
                    setUser(JSON.parse(raw));
                } else if (t) {
                    const id = await AsyncStorage.getItem('userId');
                    const role = await AsyncStorage.getItem('userRole');
                    if (id && role) {
                        setToken(t);
                        setUser({ _id: id, name: '', email: '', role });
                    }
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = useCallback(
        async (email, password) => {
            const response = await authService.login(email, password);
            const d = response.data;
            await persistSession({
                token: d.token,
                _id: d._id,
                name: d.name,
                email: d.email,
                role: d.role,
            });
            return d;
        },
        [persistSession]
    );

    const register = useCallback(
        async (userData) => {
            const response = await authService.register(userData);
            const d = response.data;
            if (d.token) {
                await persistSession({
                    token: d.token,
                    _id: d._id,
                    name: d.name,
                    email: d.email,
                    role: d.role || 'Customer',
                });
            }
            return d;
        },
        [persistSession]
    );

    const updateProfile = useCallback(async (id, payload) => authService.updateUser(id, payload), []);

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            login,
            register,
            logout,
            updateProfile,
            isAdmin: user?.role === 'Admin',
        }),
        [user, token, loading, login, register, logout, updateProfile]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
