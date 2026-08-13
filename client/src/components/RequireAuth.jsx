import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

// Gates child routes behind sign-in. Redirects to /login (remembering where
// the user was headed) until an auth session exists.
export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null; // wait until we've checked storage

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
