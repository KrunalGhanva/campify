import axiosClient from './axiosClient';

export const createReview = async (campgroundId, reviewData) => {
    const response = await axiosClient.post(`/campgrounds/${campgroundId}/reviews`, reviewData);
    return response.data;
};

export const deleteReview = async (campgroundId, reviewId) => {
    const response = await axiosClient.delete(`/campgrounds/${campgroundId}/reviews/${reviewId}`);
    return response.data;
};
