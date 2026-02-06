import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Unauthorized from './pages/Unauthorized';
import Requests from './pages/Requests';
import AdminRequests from './pages/AdminRequests';
import AdminModels from './pages/AdminModels';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <PrivateRoute>
                <Requests />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <PrivateRoute>
                <AdminRequests />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin>
                <div>
                  <h1>Administration</h1>
                  <p>Page d'administration (à implémenter)</p>
                </div>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/models"
            element={
              <PrivateRoute requireAdmin>
                <AdminModels />
              </PrivateRoute>
            }
          />

          <Route
            path="/deployments"
            element={
              <PrivateRoute>
                <div>
                  <h1>Déploiements</h1>
                  <p>Gestion des déploiements (à implémenter)</p>
                </div>
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h1>404 - Page non trouvée</h1>
              <p>La page que vous recherchez n'existe pas.</p>
              <a href="/dashboard">Retour au tableau de bord</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;