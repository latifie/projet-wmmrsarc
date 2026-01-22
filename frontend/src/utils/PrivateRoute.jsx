import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à afficher si authentifié
 * @param {boolean} props.requireAdmin - Si true, nécessite le rôle Admin
 */
function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Attendre le chargement de l'état d'authentification
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  // Si non authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si admin requis mais utilisateur n'est pas admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Utilisateur autorisé, afficher le composant
  return children;
}

export default PrivateRoute;