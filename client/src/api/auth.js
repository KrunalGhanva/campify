import axiosClient from './axiosClient';

export const login = async (loginIdentifier, password) => {
    const response = await axiosClient.post('/login', { loginIdentifier, password });
    return response.data;
};

export const register = async (email, mobile, username, password) => {
    const response = await axiosClient.post('/register', { email, mobile, username, password });
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

export const updateProfile = async (formData) => {
    const response = await axiosClient.put('/me/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const updatePassword = async (currentPassword, newPassword) => {
    const response = await axiosClient.put('/me/password', { currentPassword, newPassword });
    return response.data;
};
