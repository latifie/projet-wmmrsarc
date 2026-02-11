import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from '../api/axios';

function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/api/requests').then(r => setRequests(r.data.data || [])),
      axios.get('/api/models').then(r => setModels(r.data.data || []))
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModel) return setError('Sélectionnez un modèle');

    try {
      await axios.post('/api/requests', { aiModelId: parseInt(selectedModel) });
      setShowModal(false);
      setSelectedModel('');
      const res = await axios.get('/api/requests');
      setRequests(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const statusConfig = {
    pending: { color: '#f59e0b', text: 'En attente' },
    approved: { color: '#10b981', text: 'Approuvée' },
    rejected: { color: '#ef4444', text: 'Rejetée' }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />

      <div className="container" style={{ maxWidth: '1000px', padding: '48px 24px' }}>
        <div className="page-header">
          <div>
            <h1>Mes demandes</h1>
            <p>Gérez vos demandes de déploiement</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouvelle demande
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3>Aucune demande</h3>
            <p>Créez votre première demande de déploiement</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Créer une demande
            </button>
          </div>
        ) : (
          <div className="list-grid">
            {requests.map(req => {
              const status = statusConfig[req.status] || statusConfig.pending;
              return (
                <div key={req.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                        {req.aiModel?.name || 'Modèle inconnu'}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b6b6b' }}>
                        {req.aiModel?.description}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: status.color + '20',
                      color: status.color
                    }}>
                      {status.text}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#9b9b9b', marginBottom: '12px' }}>
                    Demande #{req.id} • {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                  </div>

                  {req.status === 'rejected' && req.rejectionReason && (
                    <div style={{
                      padding: '12px',
                      background: '#fef2f2',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#991b1b',
                      marginBottom: '12px'
                    }}>
                      <strong>Raison :</strong> {req.rejectionReason}
                    </div>
                  )}

                  {req.status === 'approved' && req.instanceId && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/chat?id=${req.instanceId}`)}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      Voir l'instance →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle demande</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label>Modèle LLM</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} required>
                  <option value="">-- Sélectionner --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requests;