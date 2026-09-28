import axiosClient from './axiosClient';

// ── Stats ──────────────────────────────────────────────────────
export const getAdminStats = async () => {
    const r = await axiosClient.get('/admin/stats');
    return r.data;
};

// ── Users ──────────────────────────────────────────────────────
export const getAdminUsers = async (params = {}) => {
    const r = await axiosClient.get('/admin/users', { params });
    return r.data;
};

export const toggleUserRole = async (id) => {
    const r = await axiosClient.put(`/admin/users/${id}/role`);
    return r.data;
};

export const toggleUserSuspend = async (id) => {
    const r = await axiosClient.put(`/admin/users/${id}/suspend`);
    return r.data;
};

export const deleteAdminUser = async (id) => {
    const r = await axiosClient.delete(`/admin/users/${id}`);
    return r.data;
};

// ── Campgrounds ────────────────────────────────────────────────
export const getAdminCampgrounds = async (params = {}) => {
    const r = await axiosClient.get('/admin/campgrounds', { params });
    return r.data;
};

export const deleteAdminCampground = async (id) => {
    const r = await axiosClient.delete(`/admin/campgrounds/${id}`);
    return r.data;
};

// ── Reviews ────────────────────────────────────────────────────
export const getAdminReviews = async (params = {}) => {
    const r = await axiosClient.get('/admin/reviews', { params });
    return r.data;
};

export const deleteAdminReview = async (id) => {
    const r = await axiosClient.delete(`/admin/reviews/${id}`);
    return r.data;
};
