import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          🤖 LLMHub
        </Link>

        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Tableau de bord
          </Link>
          <Link to="/chat" className="navbar-link">
            Chat
          </Link>
          <Link to="/requests" className="navbar-link">
            Demandes
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/models" className="navbar-link">
                Gérer les Modèles
              </Link>
              <Link to="/admin/users" className="navbar-link">
                Utilisateurs
              </Link>
              <Link to="/admin/requests" className="navbar-link admin">
                Administration
              </Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.isAdmin ? 'Admin' : 'User'}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;