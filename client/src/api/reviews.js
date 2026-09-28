import axiosClient from './axiosClient';

export const createReview = async (campgroundId, formData) => {
    const response = await axiosClient.post(`/campgrounds/${campgroundId}/reviews`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateReview = async (campgroundId, reviewId, formData) => {
    const response = await axiosClient.put(`/campgrounds/${campgroundId}/reviews/${reviewId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteReview = async (campgroundId, reviewId) => {
    const response = await axiosClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);
    return response.data;
};
