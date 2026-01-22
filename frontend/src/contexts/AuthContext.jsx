import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur depuis localStorage au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erreur parsing user:', e);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  // Inscription
  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password
      });

      console.log('Register response:', response.data);

      // 👇 GÉRER LE FORMAT BACKEND
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken, user: newUser } = responseData;

      if (!accessToken || !refreshToken || !newUser) {
        console.error('Données manquantes:', responseData);
        throw new Error('Tokens ou utilisateur manquants dans la réponse');
      }

      // Stocker
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 
               error.response?.data?.error || 
               'Erreur lors de l\'inscription'
      };
    }
  };

  // Connexion
  const login = async (email, password) => {
    try {
      console.log('AuthContext: Envoi de la requête login...');
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      console.log('AuthContext: Réponse complète:', response.data);

      // 👇 GÉRER LE FORMAT BACKEND (data dans data)
      const responseData = response.data.data || response.data;
      console.log('AuthContext: Response data:', responseData);

      const { accessToken, refreshToken, user: newUser } = responseData;

      console.log('AuthContext: Tokens extraits:', {
        accessToken: accessToken ? accessToken.substring(0, 20) + '...' : 'undefined',
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : 'undefined',
        user: newUser
      });

      if (!accessToken || !refreshToken || !newUser) {
        console.error('Données manquantes:', responseData);
        throw new Error('Tokens ou utilisateur manquants dans la réponse');
      }

      // Stocker
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      console.log('AuthContext: Données stockées dans localStorage');

      setUser(newUser);

      console.log('AuthContext: User state mis à jour:', newUser);

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Erreur login:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Identifiants invalides'
      };
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin === true,
    loading,
    register,
    login,
    logout
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '14px',
        color: '#666'
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}