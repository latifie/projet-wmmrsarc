import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from '../api/axios';

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatStatuses, setChatStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedUsers, setExpandedUsers] = useState({});

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  useEffect(() => {
    fetchRequests();
    fetchChats();
  }, []);

  // Poll chat statuses
  useEffect(() => {
    if (chats.length === 0) return;

    const checkAllStatuses = async () => {
      const statuses = {};
      for (const chat of chats) {
        try {
          const response = await axios.get(`/api/chats/${chat.id}/status`);
          statuses[chat.id] = response.data.data;
        } catch (err) {
          statuses[chat.id] = { modelLoaded: false, containerReady: false };
        }
      }
      setChatStatuses(statuses);
    };

    checkAllStatuses();
    const interval = setInterval(checkAllStatuses, 10000);

    return () => clearInterval(interval);
  }, [chats]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/requests/admin/all');
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chats');
      setChats(res.data.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approuver cette demande ?')) return;
    try {
      await axios.post(`/api/requests/${id}/approve`);
      fetchRequests();
      fetchChats(); // Refresh chats list
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet :');
    if (!reason) return;
    try {
      await axios.post(`/api/requests/${id}/reject`, { reason });
      fetchRequests();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  const filtered = requests.filter(r =>
    filter === 'all' ? true : r.status === filter
  );

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

      <div className="container" style={{ maxWidth: '1200px', padding: '48px 24px' }}>
        <div className="page-header">
          <div>
            <h1>Gestion des demandes</h1>
            <p>Approuvez ou rejetez les demandes de déploiement</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                background: filter === f ? '#2c2c2c' : '#f5f5f5',
                color: filter === f ? '#ffffff' : '#2c2c2c',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              {f === 'all' ? 'Toutes' : statusConfig[f]?.text || f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3>Aucune demande</h3>
          </div>
        ) : (
          <div className="requests-list">
            {Object.entries(
              filtered.reduce((acc, req) => {
                const userId = req.user?.id || 'unknown';
                if (!acc[userId]) acc[userId] = [];
                acc[userId].push(req);
                return acc;
              }, {})
            ).map(([userId, userRequests]) => {
              const user = userRequests[0].user;
              const isExpanded = expandedUsers[userId] !== false; // Default expanded

              return (
                <div key={userId} style={{ marginBottom: '24px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                  <div
                    onClick={() => toggleUser(userId)}
                    style={{
                      padding: '16px',
                      background: '#f9f9f9',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{user?.name || 'Utilisateur inconnu'}</h3>
                      <span style={{ fontSize: '12px', color: '#666' }}>{user?.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: '#e0e0e0',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {userRequests.length} demande{userRequests.length > 1 ? 's' : ''}
                      </span>
                      <span>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="list-grid" style={{ padding: '16px', background: '#fff' }}>
                      {userRequests.map(req => {
                        const status = statusConfig[req.status];
                        return (
                          <div key={req.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                              <div>
                                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>
                                  {req.aiModel?.name}
                                </h3>
                                <div style={{ fontSize: '12px', color: '#9b9b9b' }}>
                                  #{req.id} • {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                background: status.color + '20',
                                color: status.color,
                                height: 'fit-content'
                              }}>
                                {status.text}
                              </span>
                            </div>

                            {req.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                  }}
                                >
                                  ✓ Approuver
                                </button>
                                <button
                                  onClick={() => handleReject(req.id)}
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500'
                                  }}
                                >
                                  ✕ Rejeter
                                </button>
                              </div>
                            )}

                            {req.status === 'rejected' && req.rejectionReason && (
                              <div style={{
                                padding: '12px',
                                background: '#fef2f2',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#991b1b',
                                marginTop: '12px'
                              }}>
                                <strong>Raison :</strong> {req.rejectionReason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRequests;