import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Tableau de bord</h1>
          <p>Bienvenue, {user?.name} ! 👋</p>
        </div>

        <div className="dashboard-cards">
          <div className="card">
            <div className="card-icon"></div>
            <h3>Modèles disponibles</h3>
            <p className="card-value">5</p>
            <p className="card-description">
              Llama2, Mistral, CodeLlama, etc.
            </p>
          </div>

          <div className="card"
            onClick={() => navigate('/unauthorized')}
            style={{ cursor: 'pointer' }}
            >
            <div className="card-icon"></div>
            <h3>Déploiements actifs</h3>
            <p className="card-value">0</p>
            <p className="card-description">
              Aucune instance en cours
            </p>
          </div>

           <div 
            className="card clickable" 
            onClick={() => navigate('/chat')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">💬</div>
            <h3>Conversations</h3>
            <p className="card-value">0</p>
            <p className="card-description">
              Démarrez une conversation
            </p>
          </div>

          <div className="card"
            onClick={() => navigate('/requests')}
            style={{ cursor: 'pointer' }}
            >
            <div className="card-icon"></div>
            <h3>Votre profil</h3>
            <p className="card-info">
              <strong>Email:</strong> {user?.email}<br />
              <strong>Rôle:</strong> {user?.role}
            </p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Actions rapides</h2>
          <div className="actions-grid">
            <button className="action-btn">
              <span className="action-icon"></span>
              <span>Déployer un modèle</span>
            </button>
            <button className="action-btn">
              <span className="action-icon"></span>
              <span>Voir les statistiques</span>
            </button>
            <button className="action-btn">
              <span className="action-icon"></span>
              <span>Documentation</span>
            </button>
            {user?.role === 'Admin' && (
              <button className="action-btn admin">
                <span className="action-icon"></span>
                <span>Gestion utilisateurs</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;