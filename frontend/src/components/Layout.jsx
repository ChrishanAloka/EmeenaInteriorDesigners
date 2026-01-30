import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/dashboard">
            <h2>Emeena Interior Designers</h2>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link to="/dashboard" className="nav-link">
            📊 Dashboard
          </Link>
          <Link to="/quotations/create" className="nav-link">
            ➕ New Quotation
          </Link>
          <Link to="/invoices/create" className="nav-link">
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
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; 2026 Emeena Interior Designers. All rights reserved.</p>
        <p>📞 071 017 22 09 | 🌐 www.emeena.ecity.lk</p>
      </footer>
    </div>
  );
};

export default Layout;