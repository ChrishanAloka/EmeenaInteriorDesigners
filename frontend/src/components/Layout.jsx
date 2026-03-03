import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-header">
          <div className="navbar-brand">
            <Link to="/dashboard" onClick={closeMenu}>
              <h2>Emeena Interior Designers</h2>
            </Link>
          </div>
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
          <div className="navbar-menu">
            <Link to="/dashboard" className="nav-link" onClick={closeMenu}>
              📊 Dashboard
            </Link>
            <Link to="/quotations/create" className="nav-link" onClick={closeMenu}>
              ➕ New Quotation
            </Link>
            <Link to="/invoices/create" className="nav-link" onClick={closeMenu}>
              🧾 Create Invoice
            </Link>
          </div>

          <div className="navbar-user">
            <div className="user-info">
              <span className="user-name">{user?.fullName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; 2026 ideasmart Solutions. All rights reserved.</p>
        <p>📞 076 811 9 360 | 📧 info@solutions.ideasmart.lk | 🌐 www.solutions.ideasmart.lk</p>
      </footer>
    </div>
  );
};

export default Layout;