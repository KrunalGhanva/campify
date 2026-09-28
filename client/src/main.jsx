import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';
import './styles/app.css';

import { AuthProvider } from './context/AuthContext';
import { FlashProvider } from './context/FlashContext';

// Public layout & pages
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import CampgroundList from './pages/CampgroundList';
import CampgroundShow from './pages/CampgroundShow';
import CampgroundNew from './pages/CampgroundNew';
import CampgroundEdit from './pages/CampgroundEdit';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import ErrorPage from './pages/ErrorPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Forbidden from './pages/Forbidden';

// Admin layout & pages
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCampgrounds from './pages/admin/AdminCampgrounds';
import AdminReviews from './pages/admin/AdminReviews';

const router = createBrowserRouter([
  // ── Public site ───────────────────────────────────────────────
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />
  },
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/campgrounds",        element: <CampgroundList /> },
      {
        path: "/campgrounds/new",
        element: <ProtectedRoute><CampgroundNew /></ProtectedRoute>
      },
      { path: "/campgrounds/:id",    element: <CampgroundShow /> },
      {
        path: "/campgrounds/:id/edit",
        element: <ProtectedRoute><CampgroundEdit /></ProtectedRoute>
      },
      { path: "/about",    element: <About /> },
      { path: "/contact",  element: <Contact /> },
      { path: "/login",    element: <Login /> },
      { path: "/register", element: <Register /> },
      {
        path: "/profile",
        element: <ProtectedRoute><UserProfile /></ProtectedRoute>
      },
      { path: "/forbidden", element: <Forbidden /> },
    ]
  },

  // ── Admin panel ───────────────────────────────────────────────
  {
    path: "/admin",
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    errorElement: <ErrorPage />,
    children: [
      // Default redirect: /admin → /admin/dashboard
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard",   element: <AdminDashboard /> },
      { path: "users",       element: <AdminUsers /> },
      { path: "campgrounds", element: <AdminCampgrounds /> },
      { path: "reviews",     element: <AdminReviews /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <FlashProvider>
        <RouterProvider router={router} />
      </FlashProvider>
    </AuthProvider>
  </React.StrictMode>,
);
