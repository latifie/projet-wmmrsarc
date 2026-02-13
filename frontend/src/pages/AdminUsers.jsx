import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from '../api/axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './AdminModels.css'; // Reuse existing styles for consistency

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isOnline } = useSocket();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            // Handle both formats: data.data or direct array
            const usersData = response.data.data || response.data;
            setUsers(usersData);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des utilisateurs');
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            await axios.delete(`/api/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };

    const handleToggleAdmin = async (user) => {
        const newStatus = !user.isAdmin;
        if (!window.confirm(`Voulez-vous ${newStatus ? 'promouvoir' : 'rétrograder'} cet utilisateur ?`)) return;

        try {
            await axios.put(`/api/users/${user.id}`, {
                ...user,
                isAdmin: newStatus
            });
            // Refresh list to be sure
            fetchUsers();
        } catch (err) {
            alert('Erreur lors de la mise à jour');
        }
    };

    if (loading) return <div className="admin-container">Chargement...</div>;
    if (error) return <div className="admin-container error">{error}</div>;

    return (
        <div className="page">
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', padding: '48px 24px' }}>
                <div className="page-header">
                    <div>
                        <h1>Gestion des Utilisateurs</h1>
                        <p>Gérez les comptes et permissions des utilisateurs</p>
                    </div>
                </div>

                <div className="list-grid">
                    {users.map(user => (
                        <div key={user.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                    }}>
                                        👤
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '4px', margin: 0 }}>
                                            {user.name}
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#6b6b6b', margin: 0 }}>
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        backgroundColor: isOnline(user.id) ? '#dcfce7' : '#f3f4f6',
                                        color: isOnline(user.id) ? '#166534' : '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: isOnline(user.id) ? '#22c55e' : '#9ca3af'
                                        }}></span>
                                        {isOnline(user.id) ? 'En ligne' : 'Hors ligne'}
                                    </span>

                                    <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`} style={{ fontSize: '12px' }}>
                                        {user.isAdmin ? 'Administrateur' : 'Utilisateur'}
                                    </span>
                                </div>
                            </div>

                            {user.id !== currentUser.id && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginTop: '16px',
                                    borderTop: '1px solid #f0f0f0',
                                    paddingTop: '12px'
                                }}>
                                    <button
                                        onClick={() => handleToggleAdmin(user)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: 'transparent',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            color: '#374151',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-gray-50"
                                    >
                                        {user.isAdmin ? '⬇️ Rétrograder' : '⬆️ Promouvoir'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#991b1b',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-red-200"
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminUsers;
