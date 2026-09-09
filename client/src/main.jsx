import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';
import './styles/app.css';

import { AuthProvider } from './context/AuthContext';
import { FlashProvider } from './context/FlashContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CampgroundList from './pages/CampgroundList';
import CampgroundShow from './pages/CampgroundShow';
import CampgroundNew from './pages/CampgroundNew';
import CampgroundEdit from './pages/CampgroundEdit';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorPage from './pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />
  },
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/campgrounds",
        element: <CampgroundList />,
      },
      {
        path: "/campgrounds/new",
        element: (
          <ProtectedRoute>
            <CampgroundNew />
          </ProtectedRoute>
        ),
      },
      {
        path: "/campgrounds/:id",
        element: <CampgroundShow />,
      },
      {
        path: "/campgrounds/:id/edit",
        element: (
          <ProtectedRoute>
            <CampgroundEdit />
          </ProtectedRoute>
        ),
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      }
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
