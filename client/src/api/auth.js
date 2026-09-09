import axiosClient from './axiosClient';

export const login = async (username, password) => {
    const response = await axiosClient.post('/login', { username, password });
    return response.data;
};

export const register = async (email, username, password) => {
    const response = await axiosClient.post('/register', { email, username, password });
    return response.data;
};

export const logout = async () => {
    const response = await axiosClient.post('/logout');
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await axiosClient.get('/me');
    return response.data;
};
