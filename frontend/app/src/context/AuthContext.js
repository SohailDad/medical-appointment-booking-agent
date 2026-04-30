import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        loadStoredData();

    }, []);

    const loadStoredData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                // Configure axios for subsequent requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (e) {
            console.error('Failed to load auth data', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData, authToken) => {
        try {
            await AsyncStorage.setItem('token', authToken);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setToken(authToken);
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        } catch (e) {
            console.error('Login storage error', e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        } catch (e) {
            console.error('Logout storage error', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            logout,
            isAuthenticated: !!token,
            role: user?.role || null,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
