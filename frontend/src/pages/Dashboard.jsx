import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    models: 0,
    deployments: 0,
    chats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch models count
        const modelsRes = await api.get('/api/models');
        const modelsCount = modelsRes.data.data ? modelsRes.data.data.length : 0;

        // Fetch requests for deployments count
        // For simple users, we count their approved requests as "active deployments"
        // For admins, we might want to fetch all requests, but the API endpoint /requests
        // returns "getMyRequests". There is no public "all active deployments" count for now.
        // We will use the user's active deployments.
        const requestsRes = await api.get('/api/requests');
        const deploymentsCount = requestsRes.data.data
          ? requestsRes.data.data.filter(r => r.status === 'approved').length
          : 0;

        // Fetch chats count
        const chatsRes = await api.get('/api/chats');
        const chatsCount = chatsRes.data.data ? chatsRes.data.data.length : 0;

        setStats({
          models: modelsCount,
          deployments: deploymentsCount,
          chats: chatsCount
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
            <div className="card-icon">🤖</div>
            <h3>Modèles disponibles</h3>
            <p className="card-value">{loading ? '-' : stats.models}</p>
            <p className="card-description">
              Llama2, Mistral, CodeLlama, etc.
            </p>
          </div>

          <div className="card"
            onClick={() => navigate('/requests')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">🚀</div>
            <h3>Déploiements actifs</h3>
            <p className="card-value">{loading ? '-' : stats.deployments}</p>
            <p className="card-description">
              Vos instances en cours
            </p>
          </div>

          <div
            className="card clickable"
            onClick={() => navigate('/chat')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">💬</div>
            <h3>Conversations</h3>
            <p className="card-value">{loading ? '-' : stats.chats}</p>
            <p className="card-description">
              Démarrez une conversation
            </p>
          </div>

          <div className="card"
            onClick={() => navigate('/requests')}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-icon">👤</div>
            <h3>Votre profil</h3>
            <p className="card-info">
              <strong>Email:</strong> {user?.email}<br />
              <strong>Rôle:</strong> {user?.isAdmin ? 'Administrateur' : 'Utilisateur'}
            </p>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Actions rapides</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => navigate('/requests')}>
              <span className="action-icon">🚀</span>
              <span>Déployer un modèle</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/dashboard')}>
              <span className="action-icon">📊</span>
              <span>Voir les statistiques</span>
            </button>
            <button className="action-btn" onClick={() => window.open('https://ollama.com', '_blank')}>
              <span className="action-icon">📚</span>
              <span>Documentation</span>
            </button>
            {user?.role === 'Admin' && (
              <button className="action-btn admin" onClick={() => navigate('/admin/requests')}>
                <span className="action-icon">👥</span>
                <span>Gestion demandes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;