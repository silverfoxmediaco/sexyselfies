import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const userRole = localStorage.getItem('userRole');

  console.log('ProtectedAdminRoute check:', { token: !!token, userRole });

  return token ? children : <Navigate to='/admin/login' />;
};

export default ProtectedAdminRoute;
