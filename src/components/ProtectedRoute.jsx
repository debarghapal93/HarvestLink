import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ROLE → DEFAULT DASHBOARD ROUTE
 */
export const ROLE_ROUTES = {
  farmer:    '/dashboard/farmer',
  buyer:     '/dashboard/buyer',
  logistics: '/dashboard/admin',
};

/**
 * ProtectedRoute
 * Wraps a route that requires authentication.
 * If not authenticated → redirect to /login.
 * If authenticated but wrong role → redirect to user's own dashboard.
 *
 * @param {string|string[]} allowedRoles - Role(s) that can access this route.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Not logged in → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectTo = ROLE_ROUTES[user.role] || '/login';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
