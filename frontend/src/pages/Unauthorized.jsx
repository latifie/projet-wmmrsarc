import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">🚫</div>
        <h1>Accès refusé</h1>
        <p>Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
        <p className="unauthorized-help">
          Cette page est réservée aux administrateurs.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;