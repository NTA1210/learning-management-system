import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // For now, we'll use a simple localStorage check
  // Later you can integrate with the AuthContext
  const isAuthenticated = () => {
    // Check if user has valid session by making a request to /user endpoint
    // This is a simple implementation - you might want to use the AuthContext instead
    return localStorage.getItem('isAuthenticated') === 'true';
  };

  const getUserRole = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData).role;
      } catch {
        return null;
      }
    }
    return null;
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && getUserRole() !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
