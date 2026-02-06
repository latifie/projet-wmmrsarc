import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import './AdminModels.css';

const AdminModels = () => {
    const [models, setModels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'search'

    // Fetch existing models
    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/models');
            if (response.data.status) {
                setModels(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
            setError('Impossible de charger les modèles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    // Search Ollama models
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        setError(null);
        setSearchResults([]);

        try {
            const response = await axios.get(`/api/models/search?q=${encodeURIComponent(searchQuery)}`);
            if (response.data.status) {
                setSearchResults(response.data.data);
                if (response.data.data.length === 0) {
                    setError('Aucun modèle trouvé.');
                }
            } else {
                setError('Erreur lors de la recherche.');
            }
        } catch (err) {
            console.error('Search failed:', err);
            setError('Erreur lors de la recherche (Ollama est-il accessible ?).');
        } finally {
            setSearchLoading(false);
        }
    };

    // Add a model
    const handleAdd = async (modelName, description) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await axios.post('/api/models', {
                name: modelName,
                description: description
            });

            if (response.data.status) {
                setSuccessMessage(`Modèle "${modelName}" ajouté avec succès.`);
                fetchModels();
                setActiveTab('list'); // Switch back to list view on success
            }
        } catch (err) {
            console.error('Failed to add model:', err);
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout du modèle.');
        } finally {
            setLoading(false);
        }
    };

    // Delete a model
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${name}" ?`)) return;

        setLoading(true);
        try {
            await axios.delete(`/api/models/${id}`);
            setSuccessMessage(`Modèle "${name}" supprimé.`);
            fetchModels();
        } catch (err) {
            console.error('Failed to delete model:', err);
            setError('Erreur lors de la suppression.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <Navbar />
            <div className="admin-models-container">
                <h1>Gestion des Modèles AI</h1>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="tabs-container">
                    <button
                        className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        Modèles Installés
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        Ajouter un Modèle (Ollama)
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'search' && (
                        <div className="models-section search-section">
                            <h2>Rechercher sur Ollama Library</h2>
                            <form onSubmit={handleSearch} className="search-form">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ex: llama3, mistral, gemma..."
                                    disabled={searchLoading}
                                />
                                <button type="submit" disabled={searchLoading}>
                                    {searchLoading ? 'Recherche...' : 'Rechercher'}
                                </button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    <h3>Résultats</h3>
                                    <ul>
                                        {searchResults.map((model, index) => (
                                            <li key={index} className="model-item">
                                                <div className="model-info">
                                                    <strong>{model.name}</strong>
                                                    <p>{model.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAdd(model.name, model.description)}
                                                    disabled={loading || models.some(m => m.name === model.name)}
                                                    className="btn-add"
                                                >
                                                    {models.some(m => m.name === model.name) ? 'Déjà installé' : 'Installer'}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div className="models-section list-section">
                            <h2>Liste des Modèles</h2>
                            {loading && !searchLoading ? (
                                <div className="loading-spinner">Chargement...</div>
                            ) : (
                                <table className="models-table">
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Description</th>
                                            <th>Docker Image / Tag</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {models.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center' }}>Aucun modèle installé. Allez dans l'onglet "Ajouter" pour commencer.</td>
                                            </tr>
                                        ) : (
                                            models.map(model => (
                                                <tr key={model.id}>
                                                    <td><strong>{model.name}</strong></td>
                                                    <td>{model.description}</td>
                                                    <td><code>{model.dockerImage}</code></td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleDelete(model.id, model.name)}
                                                            className="btn-delete"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminModels;
