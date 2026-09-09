import axiosClient from './axiosClient';

export const getAllCampgrounds = async () => {
    const response = await axiosClient.get('/campgrounds');
    return response.data;
};

export const getCampground = async (id) => {
    const response = await axiosClient.get(`/campgrounds/${id}`);
    return response.data;
};

export const createCampground = async (formData) => {
    // Requires formData because of image upload (multipart/form-data)
    const response = await axiosClient.post('/campgrounds', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateCampground = async (id, formData) => {
    // Put using formData
    const response = await axiosClient.put(`/campgrounds/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteCampground = async (id) => {
    const response = await axiosClient.delete(`/campgrounds/${id}`);
    return response.data;
};
